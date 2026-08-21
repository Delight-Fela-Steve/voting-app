import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { EmailConfig } from "@/lib/generated/prisma/client";
import { decrypt, encrypt } from "@/lib/email/encrypt";
import { EMAIL_CONFIG_SINGLETON_ID } from "@/lib/email/email-config-id";
import { prisma } from "@/lib/prisma";

export type MailSendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type MailSendResult =
  | { sent: true; usedFallback?: boolean }
  | { sent: false; reason: "not_configured" }
  | { sent: false; reason: "failed"; error: string };

async function loadEmailConfig(): Promise<EmailConfig | null> {
  return prisma.emailConfig.findUnique({
    where: { id: EMAIL_CONFIG_SINGLETON_ID },
  });
}

function formatFrom(config: EmailConfig): string {
  return `"${config.fromName.replace(/"/g, '\\"')}" <${config.fromEmail}>`;
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: Date | null }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to refresh Gmail token: ${body}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };

  const expiresAt =
    typeof data.expires_in === "number"
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;

  return { accessToken: data.access_token, expiresAt };
}

async function buildPasswordTransport(
  config: EmailConfig,
): Promise<SMTPTransport.Options | null> {
  if (!config.appPassword) {
    return null;
  }
  const password = decrypt(config.appPassword);
  return {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: config.fromEmail,
      pass: password,
    },
  };
}

async function buildOAuthTransport(
  config: EmailConfig,
): Promise<SMTPTransport.Options | null> {
  if (!config.refreshToken) {
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }

  let accessToken = config.accessToken ? decrypt(config.accessToken) : "";
  const refreshToken = decrypt(config.refreshToken);
  const needsRefresh =
    !accessToken ||
    (config.tokenExpiry && config.tokenExpiry.getTime() < Date.now() + 60_000);

  if (needsRefresh) {
    const refreshed = await refreshAccessToken(refreshToken);
    accessToken = refreshed.accessToken;
    await prisma.emailConfig.update({
      where: { id: EMAIL_CONFIG_SINGLETON_ID },
      data: {
        accessToken: encrypt(accessToken),
        tokenExpiry: refreshed.expiresAt,
      },
    });
  }

  return {
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: config.fromEmail,
      clientId,
      clientSecret,
      refreshToken,
      accessToken,
    },
  };
}

async function buildEnvPasswordTransport(
  config: EmailConfig,
): Promise<SMTPTransport.Options | null> {
  const rawPassword = process.env.EMAIL_APP_PASSWORD;
  if (!rawPassword) {
    return null;
  }
  return {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: config.fromEmail,
      pass: rawPassword.replace(/\s/g, ""),
    },
  };
}

export async function isEmailConfigured(): Promise<boolean> {
  const config = await loadEmailConfig();
  if (!config) {
    return false;
  }
  return (
    Boolean(config.refreshToken) ||
    Boolean(config.appPassword) ||
    Boolean(process.env.EMAIL_APP_PASSWORD)
  );
}

type TransportAttempt = {
  label: string;
  build: () => Promise<SMTPTransport.Options | null>;
};

export async function sendMail(input: MailSendInput): Promise<MailSendResult> {
  const config = await loadEmailConfig();
  if (!config) {
    return { sent: false, reason: "not_configured" };
  }

  const attempts: TransportAttempt[] =
    config.provider === "GMAIL_PASSWORD"
      ? [{ label: "password", build: () => buildPasswordTransport(config) }]
      : [
          { label: "oauth", build: () => buildOAuthTransport(config) },
          ...(config.appPassword
            ? [
                {
                  label: "backup password",
                  build: () => buildPasswordTransport(config),
                },
              ]
            : []),
          {
            label: "env fallback password",
            build: () => buildEnvPasswordTransport(config),
          },
        ];

  let lastError: string | null = null;

  for (const attempt of attempts) {
    let transportOptions: SMTPTransport.Options | null;
    try {
      transportOptions = await attempt.build();
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : `Failed to prepare ${attempt.label} transport.`;
      console.error(
        `[email] ${attempt.label} transport failed to build: ${lastError}`,
      );
      continue;
    }
    if (!transportOptions) {
      continue;
    }

    const transport = nodemailer.createTransport(transportOptions);
    try {
      await transport.sendMail({
        from: formatFrom(config),
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      } satisfies Mail.Options);
      return { sent: true, usedFallback: attempt !== attempts[0] };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Failed to send email.";
      console.error(`[email] send via ${attempt.label} failed: ${lastError}`);
    } finally {
      transport.close();
    }
  }

  return lastError === null
    ? { sent: false, reason: "not_configured" }
    : { sent: false, reason: "failed", error: lastError };
}
