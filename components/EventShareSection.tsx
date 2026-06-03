import { QRCodePanel } from "@/components/QRCodePanel";
import { getResultsUrl, getVoteUrl } from "@/lib/urls";

type EventShareSectionProps = {
  slug: string;
  baseUrl: string;
};

export function EventShareSection({ slug, baseUrl }: EventShareSectionProps) {
  const voteUrl = getVoteUrl(slug, baseUrl);
  const resultsUrl = getResultsUrl(slug, baseUrl);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          Share &amp; QR codes
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Share these links or QR codes so voters can cast a ballot and anyone
          can view live results.
        </p>
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
