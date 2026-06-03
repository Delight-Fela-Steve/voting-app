import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function ResultsNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-16">
      <Card className="max-w-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Results not found</h1>
        <p className="mt-3 text-text-muted">
          This results link may be invalid or the event may have been removed.
        </p>
        <Link href="/" className="mt-8 inline-block">
          <Button>Go home</Button>
        </Link>
      </Card>
    </main>
  );
}
