import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEventResults } from "@/lib/results";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  const results = await getEventResults(slug);

  if (!results) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!results.resultsPublished) {
    const session = await auth();
    const isOwnerOrAdmin =
      !!session?.user &&
      (session.user.role === "SUPER_ADMIN" ||
        session.user.id === results.createdById);

    if (!isOwnerOrAdmin) {
      return NextResponse.json(
        { error: "Results not published yet" },
        { status: 403 },
      );
    }
  }

  return NextResponse.json(
    {
      eventId: results.eventId,
      eventName: results.eventName,
      slug: results.slug,
      totalVotes: results.totalVotes,
      participants: results.participants,
      endsAt: results.endsAt,
      updatedAt: results.updatedAt,
      resultsPublished: results.resultsPublished,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
