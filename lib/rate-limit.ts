import { prisma } from "@/lib/prisma";

const CLEANUP_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const CLEANUP_PROBABILITY = 0.01;

/**
 * DB-backed sliding-window rate limit. Records an attempt and returns false
 * once `limit` attempts have been recorded for `key` within `windowMs`.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMs);

  const count = await prisma.rateLimitEntry.count({
    where: { key, createdAt: { gte: windowStart } },
  });

  if (count >= limit) {
    return false;
  }

  await prisma.rateLimitEntry.create({ data: { key } });

  if (Math.random() < CLEANUP_PROBABILITY) {
    await prisma.rateLimitEntry.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - CLEANUP_MAX_AGE_MS) } },
    });
  }

  return true;
}
