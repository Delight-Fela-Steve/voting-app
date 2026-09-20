-- Convert every DateTime column from `timestamp` to `timestamptz`.
--
-- Prisma has always written these values as UTC, but a plain `timestamp` keeps
-- no offset, so any client reading the column resolves the naive value against
-- its own timezone and reports a different instant than the one written.
--
-- Postgres would otherwise convert using the session's `TimeZone` setting,
-- which differs between a local database, Supabase, Neon and CI. Each column is
-- therefore converted with an explicit `USING ... AT TIME ZONE 'UTC'`, which
-- states outright that the stored naive value is UTC. That makes the migration
-- produce identical results everywhere instead of depending on server config.
--
-- The instants are preserved; only the column type and its explicitness change.
-- NULLs pass through untouched.

ALTER TABLE "EmailConfig"
  ALTER COLUMN "tokenExpiry" SET DATA TYPE TIMESTAMPTZ(3) USING "tokenExpiry" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Event"
  ALTER COLUMN "startsAt" SET DATA TYPE TIMESTAMPTZ(3) USING "startsAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "endsAt" SET DATA TYPE TIMESTAMPTZ(3) USING "endsAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Invitation"
  ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "usedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "usedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "revokedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "revokedAt" AT TIME ZONE 'UTC';

ALTER TABLE "OtpCode"
  ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "usedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "usedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "PasswordResetToken"
  ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "usedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "usedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "RateLimitEntry"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "User"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Vote"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';
