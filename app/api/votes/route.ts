import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventResults } from "@/lib/results";
import { buildVoterKey, getClientIp } from "@/lib/votes/voter-key";
import { voteEmitter } from "@/lib/voteEmitter";

type VoteBody = {
  slug?: string;
  participantId?: string;
  fingerprint?: string;
};

export async function POST(request: Request) {
  let body: VoteBody;

  try {
    body = (await request.json()) as VoteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { slug, participantId, fingerprint } = body;

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

  if (event.participants.length === 0) {
    return NextResponse.json(
      { error: "Invalid participant for this event" },
      { status: 400 }
    );
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

  const results = await getEventResults(slug.trim());
  if (results) {
    voteEmitter.emitVoteUpdate(slug.trim(), results);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
