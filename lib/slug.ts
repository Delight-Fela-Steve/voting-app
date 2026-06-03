import { nanoid } from "nanoid";

/** Unique public slug for /vote/[slug] and /results/[slug] (F4). */
export function generateEventSlug(): string {
  return nanoid(10);
}
