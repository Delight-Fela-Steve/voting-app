import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session!.user;

  return (
    <AdminShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
