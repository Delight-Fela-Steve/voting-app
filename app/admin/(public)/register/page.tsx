import Link from "next/link";
import { getValidPendingInvitation } from "@/lib/invitations/validate";
import { RegisterForm } from "@/components/admin/register-form";
import { Card } from "@/components/ui";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

function RegisterShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <Card className="w-full max-w-md p-8 text-center">
        <div>
          <p className="text-lg font-bold text-text-primary">Voting App</p>
          <p className="text-xs text-text-muted">Admin panel</p>
        </div>
        {children}
      </Card>
    </main>
  );
}

export default async function AdminRegisterPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <RegisterShell>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-text-primary">
          Accept invitation
        </h1>
        <p className="mt-2 text-sm text-red-400" role="alert">
          A valid invite token is required. Open the link from your invitation
          email.
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-block text-sm font-medium text-text-muted hover:text-text-primary"
        >
          Already have an account? Sign in
        </Link>
      </RegisterShell>
    );
  }

  const validation = await getValidPendingInvitation(token);

  if ("error" in validation) {
    return (
      <RegisterShell>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-text-primary">
          Accept invitation
        </h1>
        <p className="mt-2 text-sm text-red-400" role="alert">
          {validation.error}
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-block text-sm font-medium text-text-muted hover:text-text-primary"
        >
          Already have an account? Sign in
        </Link>
      </RegisterShell>
    );
  }

  const { invitation } = validation;

  return (
    <RegisterShell>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-text-primary">
        Accept invitation
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Set up your admin account to join the voting app.
      </p>

      <RegisterForm
        token={token}
        lockedEmail={invitation.email}
        invitedByName={invitation.invitedBy.name}
      />

      <Link
        href="/admin/login"
        className="mt-6 inline-block text-sm font-medium text-text-muted hover:text-text-primary"
      >
        Already have an account? Sign in
      </Link>
    </RegisterShell>
  );
}
