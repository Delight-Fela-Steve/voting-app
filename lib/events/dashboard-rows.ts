import { getResultsUrl, getVoteUrl } from "@/lib/urls";
import type { getEventsForSession } from "@/lib/events/access";
import type { AdminEventRow } from "@/components/admin/events-table";

type SessionEvent = Awaited<ReturnType<typeof getEventsForSession>>[number];

export function toAdminEventRows(
  events: SessionEvent[],
  baseUrl: string,
): AdminEventRow[] {
  return events.map((event) => ({
    id: event.id,
    name: event.name,
    slug: event.slug,
    isActive: event.isActive,
    createdAt: event.createdAt.toISOString(),
    participantCount: event._count.participants,
    voteCount: event._count.votes,
    createdByName: event.createdBy.firstName ?? event.createdBy.email,
    createdByRole: event.createdBy.role,
    voteUrl: getVoteUrl(event.slug, baseUrl),
    resultsUrl: getResultsUrl(event.slug, baseUrl),
  }));
}
