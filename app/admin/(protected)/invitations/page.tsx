import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRegisterInviteUrl } from "@/lib/urls";
import { isInviteEmailConfigured } from "@/lib/email/send-invite-email";
import { CreateInvitationForm } from "@/components/admin/create-invitation-form";
import { InvitationList } from "@/components/admin/invitation-list";
import type { InvitationListItem } from "@/components/admin/invitation-list";

export default async function AdminInvitationsPage() {
  const session = await auth();

  if (session?.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const rows = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      invitedBy: { select: { name: true } },
      usedBy: { select: { name: true, email: true } },
    },
  });

  const invitations: InvitationListItem[] = rows.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    token: invitation.token,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
    usedAt: invitation.usedAt?.toISOString() ?? null,
    inviteUrl: getRegisterInviteUrl(invitation.token),
    invitedBy: invitation.invitedBy,
    usedBy: invitation.usedBy,
  }));

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Invitations</h1>
        <p className="mt-1 text-text-muted">
          Create invite links for new admins and revoke pending invitations.
        </p>
      </div>

      <CreateInvitationForm
        emailConfigured={await isInviteEmailConfigured()}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">All invitations</h2>
        <InvitationList invitations={invitations} />
      </section>
    </main>
  );
}
