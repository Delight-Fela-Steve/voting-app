import { prisma } from "@/lib/prisma";

export type PublicParticipant = {
  id: string;
  name: string;
  imageUrl: string | null;
  displayOrder: number;
};

export type PublicVotingEvent = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isActive: boolean;
  geofenceEnabled: boolean;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
  participants: PublicParticipant[];
};

export async function getPublicEventBySlug(
  slug: string
): Promise<PublicVotingEvent | null> {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      isActive: true,
      geofenceEnabled: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      participants: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          displayOrder: true,
        },
      },
    },
  });

  return event;
}
