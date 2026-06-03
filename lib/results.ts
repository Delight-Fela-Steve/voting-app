import { prisma } from "@/lib/prisma";

export type ResultParticipant = {
  id: string;
  name: string;
  imageUrl: string | null;
  voteCount: number;
};

export type EventResults = {
  eventId: string;
  eventName: string;
  slug: string;
  totalVotes: number;
  participants: ResultParticipant[];
  updatedAt: string;
};

function sortParticipantsByVotes(
  participants: ResultParticipant[]
): ResultParticipant[] {
  return [...participants].sort((a, b) => {
    if (b.voteCount !== a.voteCount) {
      return b.voteCount - a.voteCount;
    }

    return a.name.localeCompare(b.name);
  });
}

export async function getEventResults(
  slug: string
): Promise<EventResults | null> {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      participants: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          _count: { select: { votes: true } },
        },
      },
    },
  });

  if (!event) {
    return null;
  }

  const participants = sortParticipantsByVotes(
    event.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      imageUrl: participant.imageUrl,
      voteCount: participant._count.votes,
    }))
  );

  const totalVotes = participants.reduce(
    (sum, participant) => sum + participant.voteCount,
    0
  );

  return {
    eventId: event.id,
    eventName: event.name,
    slug: event.slug,
    totalVotes,
    participants,
    updatedAt: new Date().toISOString(),
  };
}
