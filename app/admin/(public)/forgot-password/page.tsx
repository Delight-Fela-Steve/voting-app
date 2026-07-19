import Link from "next/link";
import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";
import { Card } from "@/components/ui";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <p className="text-lg font-bold text-text-primary">Voting App</p>
          <p className="text-xs text-text-muted">Admin panel</p>
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-text-primary">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Enter your account email and we&apos;ll send you a reset link.
        </p>

        <div className="mt-6">
          <ForgotPasswordForm />
        </div>

        <Link
          href="/admin/login"
          className="mt-6 inline-block text-sm font-medium text-text-muted hover:text-text-primary"
        >
          ← Back to sign in
        </Link>
      </Card>
    </main>
  );
}
