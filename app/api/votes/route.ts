import { NextResponse } from "next/server";
import { haversineDistanceMeters } from "@/lib/geo/distance";
import { prisma } from "@/lib/prisma";
import { MAX_VOTE_LOCATION_ACCURACY_METERS } from "@/lib/voting/client-geolocation";
import { buildVoterKey, getClientIp } from "@/lib/votes/voter-key";

type VoteBody = {
  slug?: string;
  participantId?: string;
  fingerprint?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
};

export async function POST(request: Request) {
  let body: VoteBody;

  try {
    body = (await request.json()) as VoteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { slug, participantId, fingerprint, latitude, longitude, accuracy } = body;

  if (!slug?.trim() || !participantId?.trim()) {
    return NextResponse.json(
      { error: "slug and participantId are required" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findUnique({
    where: { slug: slug.trim() },
    select: {
      id: true,
      isActive: true,
      startsAt: true,
      endsAt: true,
      geofenceEnabled: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
      participants: {
        where: { id: participantId },
        select: { id: true },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!event.isActive) {
    return NextResponse.json({ error: "Voting has ended" }, { status: 403 });
  }

  const now = new Date();
  if (event.startsAt && now < event.startsAt) {
    return NextResponse.json(
      { error: "Voting has not started yet" },
      { status: 403 }
    );
  }
  if (event.endsAt && now > event.endsAt) {
    return NextResponse.json({ error: "Voting has ended" }, { status: 403 });
  }

  if (event.participants.length === 0) {
    return NextResponse.json(
      { error: "Invalid participant for this event" },
      { status: 400 }
    );
  }

  let distanceMeters: number | null = null;

  if (event.geofenceEnabled) {
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        { error: "Location is required to vote in this event" },
        { status: 400 }
      );
    }

    if (
      typeof accuracy !== "number" ||
      !Number.isFinite(accuracy) ||
      accuracy > MAX_VOTE_LOCATION_ACCURACY_METERS
    ) {
      return NextResponse.json(
        {
          error:
            "Your location isn't precise enough to verify you're at the voting location. Enable precise location and try again.",
        },
        { status: 400 }
      );
    }

    if (event.latitude !== null && event.longitude !== null && event.radiusMeters !== null) {
      distanceMeters = haversineDistanceMeters(
        latitude,
        longitude,
        event.latitude,
        event.longitude
      );

      if (distanceMeters > event.radiusMeters) {
        return NextResponse.json(
          { error: "You are outside the allowed voting area" },
          { status: 403 }
        );
      }
    }
  }

  const ipAddress = getClientIp(request);
  const voterKey = buildVoterKey(event.id, fingerprint, ipAddress);

  const existing = await prisma.vote.findUnique({
    where: {
      eventId_voterKey: {
        eventId: event.id,
        voterKey,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }

  try {
    await prisma.vote.create({
      data: {
        eventId: event.id,
        participantId,
        voterKey,
        ipAddress,
        fingerprint: fingerprint?.trim() || null,
        latitude: event.geofenceEnabled ? latitude : null,
        longitude: event.geofenceEnabled ? longitude : null,
        distanceMeters,
      },
    });
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code;

    if (code === "P2002") {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }

    throw error;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
