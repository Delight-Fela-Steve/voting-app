"use server";

import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";
import { isEmailConfigured } from "@/lib/email/mailer";
import {
  getValidResetToken,
  hashResetToken,
} from "@/lib/password-reset/validate";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getPasswordResetUrl } from "@/lib/urls";

export type ForgotPasswordState = {
  error?: string;
  success?: boolean;
};

export type ResetPasswordState = {
  error?: string;
};

const MIN_PASSWORD_LENGTH = 8;
const RESET_EXPIRY_MINUTES = 60;
const RESET_REQUEST_RATE_LIMIT = 3;
const RESET_REQUEST_RATE_WINDOW_MS = 60 * 60_000;

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const emailRaw = formData.get("email");

  if (typeof emailRaw !== "string" || !emailRaw.trim()) {
    return { error: "Email is required." };
  }

  const email = emailRaw.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const allowed = await checkRateLimit(
    `password-reset-request:${email}`,
    RESET_REQUEST_RATE_LIMIT,
    RESET_REQUEST_RATE_WINDOW_MS,
  );
  if (!allowed) {
    return { error: "Too many reset requests. Please try again later." };
  }

  if (!(await isEmailConfigured())) {
    return {
      error:
        "Email is not configured on this server. Contact your administrator.",
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { success: true };
  }

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60_000);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    }),
    prisma.passwordResetToken.create({
      data: {
        tokenHash: hashResetToken(token),
        userId: user.id,
        expiresAt,
      },
    }),
  ]);

  const result = await sendPasswordResetEmail({
    to: user.email,
    resetUrl: getPasswordResetUrl(token),
  });

  if (!result.sent) {
    console.error(
      "Failed to send password reset email:",
      result.reason === "failed" ? result.error : result.reason,
    );
  }

  return { success: true };
}

export async function resetPassword(
  token: string,
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const validation = await getValidResetToken(token);
  if ("error" in validation) {
    return { error: validation.error };
  }

  const { resetToken } = validation;

  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);
  } catch {
    return { error: "Password reset failed. Please try again." };
  }

  redirect("/admin/login?reset=1");
}
