import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

  return (
    <main className="min-h-screen bg-bg">
      <ResultsDashboard slug={slug} initialResults={results} />
    </main>
  );
}
