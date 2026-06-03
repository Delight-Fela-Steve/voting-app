import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VotingUI } from "@/components/voting/VotingUI";
import { Button, Card } from "@/components/ui";
import { getPublicEventBySlug } from "@/lib/events/public";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);

  if (!event) {
    return { title: "Event not found" };
  }

  return {
    title: `Vote — ${event.name}`,
    description: event.description ?? `Cast your vote for ${event.name}`,
  };
}

export default async function VotePage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);

  if (!event) {
    notFound();
  }

  if (!event.isActive) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-16">
        <Card className="max-w-lg p-8 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-text-muted">
            {event.name}
          </p>
          <h1 className="mt-3 text-2xl font-bold text-text-primary">
            Voting has ended
          </h1>
          <p className="mt-3 text-text-muted">
            This event is no longer accepting votes. You can still view the results.
          </p>
          <Link href={`/results/${event.slug}`} className="mt-8 inline-block">
            <Button>View results</Button>
          </Link>
        </Card>
      </main>
    );
  }

  if (event.participants.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-16">
        <Card className="max-w-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">{event.name}</h1>
          <p className="mt-3 text-text-muted">
            No participants have been added yet. Check back soon.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg">
      <VotingUI
        slug={event.slug}
        eventName={event.name}
        eventDescription={event.description}
        participants={event.participants}
      />
    </main>
  );
}
