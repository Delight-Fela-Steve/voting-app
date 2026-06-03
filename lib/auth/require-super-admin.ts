import { requireUser, type AuthUser } from "@/lib/auth/require-user";

export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireUser();

  if (user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }

  return user;
}
