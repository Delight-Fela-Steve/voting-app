import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { LoginSuccessBanner } from "@/components/admin/login-success-banner";
import { Badge, Card } from "@/components/ui";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-6">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <p className="text-lg font-bold text-text-primary">Voting App</p>
          <p className="text-xs text-text-muted">Admin panel</p>
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-text-primary">
          Admin sign in
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Sign in with your admin account. New admins register via an invite link.
        </p>

        <Suspense fallback={null}>
          <LoginSuccessBanner />
        </Suspense>

        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-text-muted hover:text-text-primary"
        >
          ← Back to home
        </Link>

        <div className="mt-8 flex justify-center">
          <Badge variant="default">
            <LockIcon />
            Secure admin access
          </Badge>
        </div>
      </Card>
    </main>
  );
}

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v-2a3 3 0 00-6 0v2h6z"
        clipRule="evenodd"
      />
    </svg>
  );
}
