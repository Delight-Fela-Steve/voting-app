import { QRCodePanel } from "@/components/QRCodePanel";
import { ResultsPublishedToggle } from "@/components/admin/results-published-toggle";
import { getResultsUrl, getVoteUrl } from "@/lib/urls";

type EventShareSectionProps = {
  eventId: string;
  slug: string;
  baseUrl: string;
  resultsPublished: boolean;
};

export function EventShareSection({
  eventId,
  slug,
  baseUrl,
  resultsPublished,
}: EventShareSectionProps) {
  const voteUrl = getVoteUrl(slug, baseUrl);
  const resultsUrl = getResultsUrl(slug, baseUrl);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Share &amp; QR codes
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Share these links or QR codes so voters can cast a ballot. Results
            are only visible to the public once published.
          </p>
        </div>
        <ResultsPublishedToggle
          eventId={eventId}
          resultsPublished={resultsPublished}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <QRCodePanel
          title="Voting link"
          url={voteUrl}
          downloadFileName={`vote-${slug}-qr.png`}
        />
        <QRCodePanel
          title="Results link"
          url={resultsUrl}
          downloadFileName={`results-${slug}-qr.png`}
        />
      </div>
    </section>
  );
}
