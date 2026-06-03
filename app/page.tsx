import Link from "next/link";
import { Badge } from "@/components/ui";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.15)_0%,_transparent_60%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
        <Badge variant="live" className="mb-6 px-3 py-1 text-sm">
          Live voting platform
        </Badge>

        <h1 className="text-balance text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
          Voting App
        </h1>

        <p className="mt-4 max-w-lg text-lg text-text-muted">
          Create events, share vote links, and watch results update in real time.
        </p>

        <Link
          href="/admin"
          className="mt-10 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-8 py-3 text-base font-semibold text-white transition hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Admin sign in
        </Link>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-text-muted">
          <span className="flex items-center gap-2">
            <LockIcon />
            One vote per person
          </span>
          <span className="flex items-center gap-2">
            <ChartIcon />
            Live results
          </span>
          <span className="flex items-center gap-2">
            <ShieldIcon />
            Anonymised
          </span>
        </div>
      </div>
    </main>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4 text-text-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v-2a3 3 0 00-6 0v2h6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-4 w-4 text-text-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-4 w-4 text-text-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
