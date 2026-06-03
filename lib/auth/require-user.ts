import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export async function requireUser(): Promise<AuthUser> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.email || !user.role) {
    throw new Error("Unauthorized");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? user.email,
    role: user.role,
  };
}
