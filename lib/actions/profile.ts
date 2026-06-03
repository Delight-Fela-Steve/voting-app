"use server";

import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { signOut } from "@/lib/auth";
import { requireUser } from "@/lib/auth/require-user";
import { sendOtpEmail } from "@/lib/email/send-otp-email";
import { prisma } from "@/lib/prisma";

export type ProfileActionState = {
  error?: string;
  success?: string;
  maskedEmail?: string;
  otpSent?: boolean;
};

const MIN_PASSWORD_LENGTH = 8;
const OTP_EXPIRY_MINUTES = 10;

function normalizeOptionalName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

async function invalidatePendingOtps(
  userId: string,
  purpose: "CHANGE_EMAIL" | "CHANGE_PASSWORD",
) {
  await prisma.otpCode.deleteMany({
    where: {
      userId,
      purpose,
      usedAt: null,
    },
  });
}

export async function updateName(
  firstName: string | null,
  lastName: string | null,
): Promise<ProfileActionState> {
  const user = await requireUser();

  const normalizedFirst = normalizeOptionalName(firstName);
  const normalizedLast = normalizeOptionalName(lastName);

  const displayName = [normalizedFirst, normalizedLast]
    .filter(Boolean)
    .join(" ")
    .trim();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: normalizedFirst,
      lastName: normalizedLast,
      ...(displayName ? { name: displayName } : {}),
    },
  });

  revalidatePath("/admin/profile");
  revalidatePath("/admin/events");
  revalidatePath("/admin");

  return { success: "Name updated." };
}

export async function requestEmailChange(
  newEmailRaw: string,
): Promise<ProfileActionState> {
  const user = await requireUser();

  if (typeof newEmailRaw !== "string" || !newEmailRaw.trim()) {
    return { error: "Enter a new email address." };
  }

  const newEmail = newEmailRaw.trim().toLowerCase();

  if (!isValidEmail(newEmail)) {
    return { error: "Enter a valid email address." };
  }

  if (newEmail === user.email.toLowerCase()) {
    return { error: "That is already your current email address." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: newEmail },
  });

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const code = generateOtpCode();

  await invalidatePendingOtps(user.id, "CHANGE_EMAIL");

  await prisma.otpCode.create({
    data: {
      userId: user.id,
      purpose: "CHANGE_EMAIL",
      code,
      payload: newEmail,
      expiresAt: otpExpiresAt(),
    },
  });

  const emailResult = await sendOtpEmail({
    to: user.email,
    code,
    purpose: "CHANGE_EMAIL",
  });

  if (!emailResult.sent) {
    await invalidatePendingOtps(user.id, "CHANGE_EMAIL");

    if (emailResult.reason === "not_configured") {
      return {
        error:
          "Email is not configured on this server. Contact your administrator.",
      };
    }

    return {
      error: emailResult.error ?? "Failed to send verification email.",
    };
  }

  const { maskEmail } = await import("@/lib/email/mask-email");

  return {
    otpSent: true,
    maskedEmail: maskEmail(user.email),
    success: "Verification code sent to your current email.",
  };
}

export async function confirmEmailChange(
  code: string,
): Promise<ProfileActionState> {
  const user = await requireUser();

  if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
    return { error: "Enter the 6-digit verification code." };
  }

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      purpose: "CHANGE_EMAIL",
      code: code.trim(),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp?.payload) {
    return { error: "Invalid or expired verification code." };
  }

  const newEmail = otp.payload;

  const existingUser = await prisma.user.findUnique({
    where: { email: newEmail },
  });

  if (existingUser && existingUser.id !== user.id) {
    return { error: "That email address is no longer available." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { email: newEmail },
    });

    await tx.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });
  });

  await signOut({ redirectTo: "/admin/login?email_changed=1" });

  return { success: "Email updated." };
}

export async function requestPasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string,
): Promise<ProfileActionState> {
  const user = await requireUser();

  if (typeof currentPassword !== "string" || !currentPassword) {
    return { error: "Enter your current password." };
  }

  if (
    typeof newPassword !== "string" ||
    newPassword.length < MIN_PASSWORD_LENGTH
  ) {
    return {
      error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  if (newPassword !== confirmNewPassword) {
    return { error: "New passwords do not match." };
  }

  if (currentPassword === newPassword) {
    return { error: "New password must be different from your current password." };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, email: true },
  });

  if (!dbUser) {
    return { error: "User not found." };
  }

  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const code = generateOtpCode();

  await invalidatePendingOtps(user.id, "CHANGE_PASSWORD");

  await prisma.otpCode.create({
    data: {
      userId: user.id,
      purpose: "CHANGE_PASSWORD",
      code,
      payload: passwordHash,
      expiresAt: otpExpiresAt(),
    },
  });

  const emailResult = await sendOtpEmail({
    to: dbUser.email,
    code,
    purpose: "CHANGE_PASSWORD",
  });

  if (!emailResult.sent) {
    await invalidatePendingOtps(user.id, "CHANGE_PASSWORD");

    if (emailResult.reason === "not_configured") {
      return {
        error:
          "Email is not configured on this server. Contact your administrator.",
      };
    }

    return {
      error: emailResult.error ?? "Failed to send verification email.",
    };
  }

  const { maskEmail } = await import("@/lib/email/mask-email");

  return {
    otpSent: true,
    maskedEmail: maskEmail(dbUser.email),
    success: "Verification code sent to your email.",
  };
}

export async function confirmPasswordChange(
  code: string,
): Promise<ProfileActionState> {
  const user = await requireUser();

  if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
    return { error: "Enter the 6-digit verification code." };
  }

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      purpose: "CHANGE_PASSWORD",
      code: code.trim(),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp?.payload) {
    return { error: "Invalid or expired verification code." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash: otp.payload! },
    });

    await tx.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });
  });

  revalidatePath("/admin/profile");

  return { success: "Password updated successfully." };
}
