import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProfileEmailSection } from "@/components/admin/profile-email-section";
import { ProfileNameSection } from "@/components/admin/profile-name-section";
import { ProfilePasswordSection } from "@/components/admin/profile-password-section";
import { Badge, Card } from "@/components/ui";

function roleLabel(role: string): string {
  return role === "SUPER_ADMIN" ? "Super admin" : "Admin";
}

export default async function AdminProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Profile</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your account details and security settings.
        </p>
      </div>
      <Card className="overflow-hidden p-0">
        <dl className="divide-y divide-border">
          <ProfileNameSection
            firstName={user.firstName}
            lastName={user.lastName}
          />
          <ProfileEmailSection email={user.email} />
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-text-muted">Role</dt>
            <dd className="col-span-2 text-sm">
              <Badge variant="default">{roleLabel(user.role)}</Badge>
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-sm font-medium text-text-muted">Joined</dt>
            <dd className="col-span-2 text-sm text-text-primary">
              {user.createdAt.toLocaleString()}
            </dd>
          </div>
        </dl>
      </Card>
      <ProfilePasswordSection />
    </main>
  );
}
