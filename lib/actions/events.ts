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
