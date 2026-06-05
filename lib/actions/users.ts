"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { signOut } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getValidPendingInvitation } from "@/lib/invitations/validate";
import { prisma } from "@/lib/prisma";

export type RegisterActionState = {
  error?: string;
};

export type DeleteUserActionState = {
  error?: string;
};

const MIN_PASSWORD_LENGTH = 8;

export async function acceptInvitation(
  token: string,
  _prev: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const validation = await getValidPendingInvitation(token);
  if ("error" in validation) {
    return { error: validation.error };
  }

  const { invitation } = validation;

  const name = formData.get("name");
  const emailRaw = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof name !== "string" || !name.trim()) {
    return { error: "Name is required." };
  }

  if (typeof emailRaw !== "string" || !emailRaw.trim()) {
    return { error: "Email is required." };
  }

  const email = emailRaw.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  if (invitation.email && email !== invitation.email.toLowerCase()) {
    return {
      error: "This invitation is locked to a different email address.",
    };
  }

  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email,
          passwordHash,
          role: "ADMIN",
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          usedAt: new Date(),
          usedById: user.id,
        },
      });
    });
  } catch {
    return { error: "Registration failed. Please try again." };
  }

  await signOut({ redirectTo: "/admin/login?registered=1" });
  return {}
}

export async function deleteUser(
  userId: string,
): Promise<DeleteUserActionState> {
  const currentUser = await requireSuperAdmin();

  if (userId === currentUser.id) {
    return { error: "You cannot delete your own account." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });

  if (!target) {
    return { error: "User not found." };
  }

  if (target.role === "SUPER_ADMIN") {
    return { error: "Super admin accounts cannot be deleted." };
  }

  const eventCount = await prisma.event.count({
    where: { createdById: userId },
  });

  if (eventCount > 0) {
    return {
      error: `Cannot delete this admin — they own ${eventCount} event${eventCount === 1 ? "" : "s"}. Delete or reassign those events first.`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.invitation.updateMany({
        where: { usedById: userId },
        data: { usedById: null },
      });

      await tx.user.delete({ where: { id: userId } });
    });
  } catch {
    return { error: "Failed to delete user. Please try again." };
  }

  revalidatePath("/admin/users");

  return {};
}
