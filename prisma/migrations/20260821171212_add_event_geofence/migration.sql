-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "geofenceEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "radiusMeters" INTEGER;

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "distanceMeters" DOUBLE PRECISION,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
