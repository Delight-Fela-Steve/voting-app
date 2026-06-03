import Link from "next/link";
import { notFound } from "next/navigation";
import { EventShareSection } from "@/components/EventShareSection";
import { DeleteEventButton } from "@/components/admin/delete-event-button";
import { EventForm } from "@/components/admin/event-form";
import { ParticipantForm } from "@/components/admin/participant-form";
import { ParticipantList } from "@/components/admin/participant-list";
import { Card } from "@/components/ui";
import { updateEvent } from "@/lib/actions/events";
import { addParticipant } from "@/lib/actions/participants";
import { getEventForUser } from "@/lib/events/access";
import { getRequestBaseUrl } from "@/lib/urls";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEventForUser(id);

  if (!event) {
    notFound();
  }

  const baseUrl = await getRequestBaseUrl();
  const updateEventAction = updateEvent.bind(null, id);

  return (
    <main className="mx-auto max-w-4xl space-y-10 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm font-medium text-text-muted hover:text-text-primary"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-text-primary">
            {event.name}
          </h1>
          <p className="mt-1 font-mono text-sm text-text-muted">{event.slug}</p>
          {event.createdBy ? (
            <p className="mt-1 text-sm text-text-muted">
              Created by {event.createdBy.firstName ?? event.createdBy.email} ·{" "}
              {event._count.votes} vote
              {event._count.votes === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
        <DeleteEventButton eventId={event.id} eventName={event.name} />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary">Event details</h2>
        <p className="mt-1 text-sm text-text-muted">
          Update name, schedule, and whether voting is open.
        </p>
        <div className="mt-5">
          <EventForm
            action={updateEventAction}
            submitLabel="Save changes"
            event={{
              name: event.name,
              description: event.description,
              isActive: event.isActive,
              startsAt: event.startsAt,
              endsAt: event.endsAt,
            }}
          />
        </div>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Participants</h2>
          <p className="mt-1 text-sm text-text-muted">
            Voters choose one participant. Image URL is optional; initials are
            shown when no image is set.
          </p>
        </div>
        <ParticipantForm action={addParticipant.bind(null, id)} />
        <ParticipantList eventId={id} participants={event.participants} />
      </section>

      <EventShareSection slug={event.slug} baseUrl={baseUrl} />
    </main>
  );
}
