import { NextResponse } from "next/server";
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

  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
