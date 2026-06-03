import { prisma } from "@/lib/prisma";

export type ValidInvitation = {
  id: string;
  email: string | null;
  token: string;
  expiresAt: Date;
  invitedBy: { name: string };
};

export async function getValidPendingInvitation(
  token: string,
): Promise<{ invitation: ValidInvitation } | { error: string }> {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      invitedBy: { select: { name: true } },
    },
  });

  if (!invitation) {
    return { error: "Invalid invitation link." };
  }

  if (invitation.status === "ACCEPTED") {
    return { error: "This invitation has already been used." };
  }

  if (invitation.status === "REVOKED") {
    return { error: "This invitation was revoked." };
  }

  if (invitation.status === "EXPIRED") {
    return { error: "This invitation has expired." };
  }

  if (invitation.expiresAt < new Date()) {
    if (invitation.status === "PENDING") {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
    }
    return { error: "This invitation has expired." };
  }

  if (invitation.status !== "PENDING") {
    return { error: "This invitation is no longer valid." };
  }

  return { invitation };
}
