import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export type ValidResetToken = {
  id: string;
  userId: string;
};

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getValidResetToken(
  token: string,
): Promise<{ resetToken: ValidResetToken } | { error: string }> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });

  if (!record) {
    return { error: "Invalid password reset link." };
  }

  if (record.usedAt) {
    return { error: "This reset link has already been used." };
  }

  if (record.expiresAt < new Date()) {
    return { error: "This reset link has expired. Request a new one." };
  }

  return { resetToken: { id: record.id, userId: record.userId } };
}
