import { removeParticipant } from "@/lib/actions/participants";
import { ParticipantAvatar } from "@/components/admin/participant-avatar";
import { Card } from "@/components/ui";

type Participant = {
  id: string;
  name: string;
  imageUrl: string | null;
};

type ParticipantListProps = {
  eventId: string;
  participants: Participant[];
};

export function ParticipantList({ eventId, participants }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No participants yet. Add at least one before sharing the vote link.
      </p>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <ul className="divide-y divide-border">
        {participants.map((participant) => (
          <li
            key={participant.id}
            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-raised/60"
          >
            <div className="flex min-w-0 items-center gap-3">
              <ParticipantAvatar
                name={participant.name}
                imageUrl={participant.imageUrl}
              />
              <span className="truncate font-medium text-text-primary">
                {participant.name}
              </span>
            </div>
            <form
              action={removeParticipant.bind(null, eventId, participant.id)}
            >
              <button
                type="submit"
                className="text-sm font-medium text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </form>
          </li>
        ))}
      </ul>
    </Card>
  );
}
