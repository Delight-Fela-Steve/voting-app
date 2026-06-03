"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { eventWhereForUser, getEventForUser } from "@/lib/events/access";
import { prisma } from "@/lib/prisma";
import { generateEventSlug } from "@/lib/slug";

export type EventActionState = {
  error?: string;
};

function parseOptionalDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseEventFields(formData: FormData) {
  const name = formData.get("name");
  const description = formData.get("description");
  const isActive = formData.get("isActive") === "on";

  if (typeof name !== "string" || !name.trim()) {
    return { error: "Event name is required." as const };
  }

  const descriptionValue =
    typeof description === "string" && description.trim()
      ? description.trim()
      : null;

  return {
    data: {
      name: name.trim(),
      description: descriptionValue,
      isActive,
      startsAt: parseOptionalDate(formData.get("startsAt")),
      endsAt: parseOptionalDate(formData.get("endsAt")),
    },
  };
}

export async function createEvent(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const user = await requireUser();
  const parsed = parseEventFields(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const event = await prisma.event.create({
    data: {
      ...parsed.data,
      slug: generateEventSlug(),
      createdById: user.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  redirect(`/admin/events/${event.id}`);
}

export async function updateEvent(
  eventId: string,
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  await requireUser();
  const existing = await getEventForUser(eventId);

  if (!existing) {
    return { error: "Event not found or you do not have access." };
  }

  const parsed = parseEventFields(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  await prisma.event.update({
    where: { id: eventId },
    data: parsed.data,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  return {};
}

export async function toggleEventActive(
  eventId: string,
): Promise<EventActionState> {
  const user = await requireUser();
  const existing = await prisma.event.findFirst({
    where: { id: eventId, ...eventWhereForUser(user) },
    select: { id: true, isActive: true },
  });

  if (!existing) {
    return { error: "Event not found or you do not have access." };
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { isActive: !existing.isActive },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  return {};
}

export async function deleteEvent(eventId: string): Promise<EventActionState> {
  const user = await requireUser();
  const existing = await prisma.event.findFirst({
    where: { id: eventId, ...eventWhereForUser(user) },
    select: { id: true },
  });

  if (!existing) {
    return { error: "Event not found or you do not have access." };
  }

  await prisma.event.delete({ where: { id: eventId } });

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  redirect("/admin");
}
