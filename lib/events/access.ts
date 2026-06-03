import type { Prisma } from "@prisma/client";
import { requireUser, type AuthUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";

export function eventWhereForUser(user: AuthUser): Prisma.EventWhereInput {
  if (user.role === "SUPER_ADMIN") {
    return {};
  }
  return { createdById: user.id };
}

export async function getEventsForSession() {
  const user = await requireUser();

  return prisma.event.findMany({
    where: eventWhereForUser(user),
    include: {
      createdBy: { select: { id: true, name: true, firstName: true, email: true, role: true } },
      _count: { select: { participants: true, votes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEventForUser(id: string) {
  const user = await requireUser();

  return prisma.event.findFirst({
    where: { id, ...eventWhereForUser(user) },
    include: {
      createdBy: { select: { id: true, name: true, firstName: true, email: true, role: true } },
      participants: { orderBy: [{ displayOrder: "asc" }, { name: "asc" }] },
      _count: { select: { votes: true } },
    },
  });
}
