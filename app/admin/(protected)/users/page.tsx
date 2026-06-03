import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserList } from "@/components/admin/user-list";
import type { UserListItem } from "@/components/admin/user-list";

export default async function AdminUsersPage() {
  const session = await auth();

  if (session?.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const currentUserId = session.user.id;

  const rows = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const users: UserListItem[] = rows.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    canDelete:
      user.role !== "SUPER_ADMIN" && user.id !== currentUserId,
  }));

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <p className="mt-1 text-text-muted">
          Manage admin accounts. Super admin accounts cannot be deleted.
        </p>
      </div>

      <UserList users={users} />
    </main>
  );
}
