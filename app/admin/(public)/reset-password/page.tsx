import Link from "next/link";
import { getValidResetToken } from "@/lib/password-reset/validate";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";
import { Card } from "@/components/ui";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

function ResetShell({ children }: { children: React.ReactNode }) {
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

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <ResetShell>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-text-primary">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-red-400" role="alert">
          A valid reset token is required. Open the link from your email.
        </p>
        <Link
          href="/admin/forgot-password"
          className="mt-6 inline-block text-sm font-medium text-text-muted hover:text-text-primary"
        >
          Request a new link
        </Link>
      </ResetShell>
    );
  }

  const validation = await getValidResetToken(token);

  if ("error" in validation) {
    return (
      <ResetShell>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-text-primary">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-red-400" role="alert">
          {validation.error}
        </p>
        <Link
          href="/admin/forgot-password"
          className="mt-6 inline-block text-sm font-medium text-text-muted hover:text-text-primary"
        >
          Request a new link
        </Link>
      </ResetShell>
    );
  }

  return (
    <ResetShell>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-text-primary">
        Reset password
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Choose a new password for your admin account.
      </p>

      <ResetPasswordForm token={token} />

      <Link
        href="/admin/login"
        className="mt-6 inline-block text-sm font-medium text-text-muted hover:text-text-primary"
      >
        ← Back to sign in
      </Link>
    </ResetShell>
  );
}
