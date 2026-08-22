import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { getEventResults } from "@/lib/results";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const results = await getEventResults(slug);

  if (!results) {
    return { title: "Results not found" };
  }

  return {
    title: `Results — ${results.eventName}`,
    description: `Live vote results for ${results.eventName}`,
  };
}

export default async function ResultsPage({ params }: PageProps) {
  const { slug } = await params;
  const results = await getEventResults(slug);

  if (!results) {
    notFound();
  }

  if (!results.resultsPublished) {
    const session = await auth();
    const isOwnerOrAdmin =
      !!session?.user &&
      (session.user.role === "SUPER_ADMIN" ||
        session.user.id === results.createdById);

    if (!isOwnerOrAdmin) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-bg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary">
              Results are not available yet
            </h1>
            <p className="mt-2 text-text-muted">
              The organizer has not published results for this event.
            </p>
          </div>
        </main>
      );
    }
  }

  const publicResults = {
    eventId: results.eventId,
    eventName: results.eventName,
    slug: results.slug,
    totalVotes: results.totalVotes,
    participants: results.participants,
    endsAt: results.endsAt,
    updatedAt: results.updatedAt,
    resultsPublished: results.resultsPublished,
  };

  return (
    <main className="min-h-screen bg-bg">
      <ResultsDashboard slug={slug} initialResults={publicResults} />
    </main>
  );
}
