"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getEventForUser } from "@/lib/events/access";
import { prisma } from "@/lib/prisma";

export type ParticipantActionState = {
  error?: string;
};

export async function addParticipant(
  eventId: string,
  _prev: ParticipantActionState,
  formData: FormData,
): Promise<ParticipantActionState> {
  await requireUser();
  const event = await getEventForUser(eventId);

  if (!event) {
    return { error: "Event not found or you do not have access." };
  }

  const name = formData.get("name");
  const imageUrl = formData.get("imageUrl");

  if (typeof name !== "string" || !name.trim()) {
    return { error: "Participant name is required." };
  }

  const imageUrlValue =
    typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null;

  const maxOrder = await prisma.participant.aggregate({
    where: { eventId },
    _max: { displayOrder: true },
  });

  await prisma.participant.create({
    data: {
      eventId,
      name: name.trim(),
      imageUrl: imageUrlValue,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  });

  revalidatePath(`/admin/events/${eventId}`);
  return {};
}

export async function deleteParticipant(
  eventId: string,
  participantId: string,
): Promise<ParticipantActionState> {
  await requireUser();
  const event = await getEventForUser(eventId);

  if (!event) {
    return { error: "Event not found or you do not have access." };
  }

  const participant = await prisma.participant.findFirst({
    where: { id: participantId, eventId },
  });

  if (!participant) {
    return { error: "Participant not found." };
  }

  await prisma.participant.delete({ where: { id: participantId } });

  revalidatePath(`/admin/events/${eventId}`);
  return {};
}

/** Form action wrapper with void return for HTML forms. */
export async function removeParticipant(
  eventId: string,
  participantId: string,
): Promise<void> {
  await deleteParticipant(eventId, participantId);
}
