"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import {
  isInviteEmailConfigured,
  sendInviteEmail,
} from "@/lib/email/send-invite-email";
import { prisma } from "@/lib/prisma";
import { getRegisterInviteUrl } from "@/lib/urls";

export type InvitationActionState = {
  error?: string;
  inviteUrl?: string;
  emailSent?: boolean;
  emailSkipped?: boolean;
  emailError?: string;
};

const DEFAULT_EXPIRY_DAYS = 7;

function parseExpiryDays(value: FormDataEntryValue | null): number {
  if (typeof value !== "string" || !value.trim()) {
    return DEFAULT_EXPIRY_DAYS;
  }
  const days = Number.parseInt(value, 10);
  if (Number.isNaN(days) || days < 1 || days > 90) {
    return DEFAULT_EXPIRY_DAYS;
  }
  return days;
}

export async function createInvitation(
  _prev: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const user = await requireSuperAdmin();

  const emailRaw = formData.get("email");
  const email =
    typeof emailRaw === "string" && emailRaw.trim()
      ? emailRaw.trim().toLowerCase()
      : null;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address or leave the field empty." };
  }

  const expiryDays = parseExpiryDays(formData.get("expiresInDays"));
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  const sendEmail = formData.get("sendEmail") === "on";

  if (sendEmail && !email) {
    return {
      error: "An email address is required to send an invitation email.",
    };
  }

  const token = nanoid(32);

  await prisma.invitation.create({
    data: {
      token,
      email,
      expiresAt,
      invitedById: user.id,
    },
  });

  revalidatePath("/admin/invitations");

  const inviteUrl = getRegisterInviteUrl(token);
  const result: InvitationActionState = { inviteUrl };

  if (sendEmail) {
    if (!(await isInviteEmailConfigured())) {
      result.emailSkipped = true;
      return result;
    }

    const emailResult = await sendInviteEmail({
      to: email!,
      inviteUrl,
      invitedByName: user.name,
      expiresAt,
    });

    if (emailResult.sent) {
      result.emailSent = true;
    } else if (emailResult.reason === "failed") {
      result.emailError = emailResult.error;
    } else {
      result.emailSkipped = true;
    }
  }

  return result;
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const user = await requireSuperAdmin();

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error("Invitation not found.");
  }

  if (invitation.status !== "PENDING") {
    throw new Error("Only pending invitations can be revoked.");
  }

  await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedById: user.id,
    },
  });

  revalidatePath("/admin/invitations");
}
