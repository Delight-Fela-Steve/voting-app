"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { canEncrypt, encrypt } from "@/lib/email/encrypt";
import { EMAIL_CONFIG_SINGLETON_ID } from "@/lib/email/email-config-id";
import { isEmailConfigured, sendMail } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";
import type { EmailProvider } from "@prisma/client";

export type EmailConfigPublic = {
  provider: EmailProvider;
  fromName: string;
  fromEmail: string;
  connected: boolean;
};

export type SettingsActionState = {
  error?: string;
  success?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isGmailAddress(email: string): boolean {
  return /@gmail\.com$/i.test(email);
}

export async function getEmailConfig(): Promise<EmailConfigPublic | null> {
  await requireSuperAdmin();

  const config = await prisma.emailConfig.findUnique({
    where: { id: EMAIL_CONFIG_SINGLETON_ID },
  });

  if (!config) {
    return null;
  }

  return {
    provider: config.provider,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    connected: true,
  };
}

export async function saveGmailPasswordConfig(input: {
  fromName: string;
  fromEmail: string;
  appPassword: string;
}): Promise<SettingsActionState> {
  await requireSuperAdmin();

  if (!canEncrypt()) {
    return {
      error:
        "EMAIL_ENCRYPTION_KEY is not configured. Set a 64-character hex key in your environment.",
    };
  }

  const fromName = input.fromName.trim();
  const fromEmail = input.fromEmail.trim().toLowerCase();
  const appPassword = input.appPassword.replace(/\s/g, "");

  if (!fromName) {
    return { error: "Display name is required." };
  }

  if (!isValidEmail(fromEmail)) {
    return { error: "Enter a valid email address." };
  }

  if (!isGmailAddress(fromEmail)) {
    return { error: "Use a Gmail address for this connection method." };
  }

  const existing = await prisma.emailConfig.findUnique({
    where: { id: EMAIL_CONFIG_SINGLETON_ID },
  });

  let encryptedPassword: string | undefined;
  if (appPassword) {
    if (appPassword.length < 16) {
      return { error: "Enter a valid Gmail app password (16 characters)." };
    }
    encryptedPassword = encrypt(appPassword);
  } else if (
    existing?.provider === "GMAIL_PASSWORD" &&
    existing.appPassword
  ) {
    encryptedPassword = existing.appPassword;
  } else {
    return { error: "Enter a valid Gmail app password (16 characters)." };
  }

  await prisma.emailConfig.upsert({
    where: { id: EMAIL_CONFIG_SINGLETON_ID },
    create: {
      id: EMAIL_CONFIG_SINGLETON_ID,
      provider: "GMAIL_PASSWORD",
      fromName,
      fromEmail,
      appPassword: encryptedPassword,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
    },
    update: {
      provider: "GMAIL_PASSWORD",
      fromName,
      fromEmail,
      appPassword: encryptedPassword,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/invitations");

  return { success: "Gmail app password saved. Email service is connected." };
}

export async function disconnectEmailConfig(): Promise<SettingsActionState> {
  await requireSuperAdmin();

  await prisma.emailConfig.deleteMany({
    where: { id: EMAIL_CONFIG_SINGLETON_ID },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/invitations");

  return { success: "Email service disconnected." };
}

export async function sendTestEmail(): Promise<SettingsActionState> {
  await requireSuperAdmin();

  if (!(await isEmailConfigured())) {
    return { error: "Connect an email service before sending a test email." };
  }

  const config = await prisma.emailConfig.findUnique({
    where: { id: EMAIL_CONFIG_SINGLETON_ID },
  });

  if (!config) {
    return { error: "Email service is not configured." };
  }

  const result = await sendMail({
    to: config.fromEmail,
    subject: "Voting App — test email",
    html: `
      <p>Hi,</p>
      <p>This is a test email from your Voting App email service settings.</p>
      <p>If you received this message, outbound email is working correctly.</p>
    `.trim(),
    text: "This is a test email from your Voting App email service settings. If you received this message, outbound email is working correctly.",
  });

  if (result.sent) {
    return { success: `Test email sent to ${config.fromEmail}.` };
  }

  if (result.reason === "not_configured") {
    return { error: "Email service is not configured." };
  }

  return { error: result.error };
}

export async function isGoogleOAuthConfigured(): Promise<boolean> {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}
