import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";
import { Card } from "@/components/ui";
import { createEvent } from "@/lib/actions/events";

export default function NewEventPage() {
  return (
    <main className="mx-auto max-w-xl space-y-6 p-6 sm:p-8">
      <div>
        <Link
          href="/admin/events"
          className="text-sm font-medium text-text-muted hover:text-text-primary"
        >
          ← Back to events
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-text-primary">
          New event
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          A unique vote link slug is generated automatically.
        </p>
      </div>

      <Card className="p-6">
        <EventForm action={createEvent} submitLabel="Create event" />
      </Card>
    </main>
  );
}
