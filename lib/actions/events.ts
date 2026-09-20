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

/**
 * A date-time string with no trailing `Z` or `+/-HH:MM` offset is parsed by
 * `new Date()` against the *runtime's* timezone. The admin's browser and the
 * server rarely share one (Vercel runs as UTC), so accepting a naive string
 * silently shifts the schedule by the offset between them. Only absolute
 * instants are accepted; the client converts before submitting.
 */
const ABSOLUTE_INSTANT = /(?:Z|[+-]\d{2}:?\d{2})$/i;

function parseOptionalDate(
  value: FormDataEntryValue | null,
): { data: Date | null } | { error: string } {
  if (typeof value !== "string" || !value.trim()) {
    return { data: null };
  }

  const trimmed = value.trim();

  if (!ABSOLUTE_INSTANT.test(trimmed)) {
    return {
      error:
        "The schedule was sent without a timezone. Reload the page and try again.",
    };
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime())
    ? { error: "The schedule contains an invalid date." }
    : { data: date };
}

function parseOptionalFloat(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseGeofenceFields(formData: FormData) {
  const geofenceEnabled = formData.get("geofenceEnabled") === "on";

  if (!geofenceEnabled) {
    return {
      data: {
        geofenceEnabled: false,
        latitude: null,
        longitude: null,
        radiusMeters: null,
      },
    };
  }

  const latitude = parseOptionalFloat(formData.get("latitude"));
  const longitude = parseOptionalFloat(formData.get("longitude"));
  const radiusRaw = parseOptionalFloat(formData.get("radiusMeters"));
  const radiusMeters = radiusRaw !== null ? Math.round(radiusRaw) : null;

  if (latitude === null || latitude < -90 || latitude > 90) {
    return { error: "A valid latitude (-90 to 90) is required." as const };
  }
  if (longitude === null || longitude < -180 || longitude > 180) {
    return { error: "A valid longitude (-180 to 180) is required." as const };
  }
  if (radiusMeters === null || radiusMeters <= 0) {
    return { error: "A voting radius greater than 0 meters is required." as const };
  }

  return {
    data: { geofenceEnabled: true, latitude, longitude, radiusMeters },
  };
}

function parseEventFields(formData: FormData) {
  const name = formData.get("name");
  const description = formData.get("description");
  const isActive = formData.get("isActive") === "on";

  if (typeof name !== "string" || !name.trim()) {
    return { error: "Event name is required." as const };
  }

  const geofence = parseGeofenceFields(formData);
  if ("error" in geofence) {
    return { error: geofence.error };
  }

  const startsAt = parseOptionalDate(formData.get("startsAt"));
  if ("error" in startsAt) {
    return { error: startsAt.error };
  }

  const endsAt = parseOptionalDate(formData.get("endsAt"));
  if ("error" in endsAt) {
    return { error: endsAt.error };
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
      startsAt: startsAt.data,
      endsAt: endsAt.data,
      ...geofence.data,
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

export async function toggleResultsPublished(
  eventId: string,
): Promise<EventActionState> {
  const user = await requireUser();
  const existing = await prisma.event.findFirst({
    where: { id: eventId, ...eventWhereForUser(user) },
    select: { id: true, resultsPublished: true },
  });

  if (!existing) {
    return { error: "Event not found or you do not have access." };
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { resultsPublished: !existing.resultsPublished },
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
