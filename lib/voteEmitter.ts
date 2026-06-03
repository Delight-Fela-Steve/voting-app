import { EventEmitter } from "events";
import type { EventResults } from "@/lib/results";

class VoteEmitter extends EventEmitter {
  emitVoteUpdate(slug: string, results: EventResults) {
    this.emit(`vote:${slug}`, results);
  }
}

const globalForVoteEmitter = globalThis as typeof globalThis & {
  voteEmitter?: VoteEmitter;
};

export const voteEmitter =
  globalForVoteEmitter.voteEmitter ?? new VoteEmitter();

globalForVoteEmitter.voteEmitter = voteEmitter;
