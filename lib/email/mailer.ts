import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { EmailConfig } from "@prisma/client";
import { decrypt } from "@/lib/email/encrypt";
import { EMAIL_CONFIG_SINGLETON_ID } from "@/lib/email/email-config-id";
import { prisma } from "@/lib/prisma";

export type MailSendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type MailSendResult =
  | { sent: true }
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

async function createTransport(
  config: EmailConfig,
): Promise<SMTPTransport.Options | null> {
  if (config.provider === "GMAIL_PASSWORD") {
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
    const { encrypt } = await import("@/lib/email/encrypt");
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

export async function isEmailConfigured(): Promise<boolean> {
  const config = await loadEmailConfig();
  if (!config) {
    return false;
  }
  if (config.provider === "GMAIL_PASSWORD") {
    return Boolean(config.appPassword);
  }
  return Boolean(config.refreshToken);
}

export async function sendMail(input: MailSendInput): Promise<MailSendResult> {
  const config = await loadEmailConfig();
  if (!config) {
    return { sent: false, reason: "not_configured" };
  }

  const transportOptions = await createTransport(config);
  if (!transportOptions) {
    return { sent: false, reason: "not_configured" };
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
    return { sent: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send email.";
    return { sent: false, reason: "failed", error: message };
  } finally {
    transport.close();
  }
}
