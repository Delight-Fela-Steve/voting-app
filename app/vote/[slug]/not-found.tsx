import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function VoteNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-16">
      <Card className="max-w-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Event not found</h1>
        <p className="mt-3 text-text-muted">
          This voting link may be invalid or the event may have been removed.
        </p>
        <Link href="/" className="mt-8 inline-block">
          <Button variant="ghost">Go to home</Button>
        </Link>
      </Card>
    </main>
  );
}
