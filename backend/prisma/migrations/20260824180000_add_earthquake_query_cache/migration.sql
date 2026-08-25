-- CreateTable
CREATE TABLE "EarthquakeQueryCache" (
    "id" TEXT NOT NULL,
    "queryKey" TEXT NOT NULL,
    "minLatitude" DOUBLE PRECISION NOT NULL,
    "maxLatitude" DOUBLE PRECISION NOT NULL,
    "minLongitude" DOUBLE PRECISION NOT NULL,
    "maxLongitude" DOUBLE PRECISION NOT NULL,
    "minMagnitude" DOUBLE PRECISION NOT NULL,
    "days" INTEGER NOT NULL,
    "events" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'usgs-earthquake',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarthquakeQueryCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EarthquakeQueryCache_queryKey_key" ON "EarthquakeQueryCache"("queryKey");

-- CreateIndex
CREATE INDEX "EarthquakeQueryCache_queryKey_fetchedAt_idx" ON "EarthquakeQueryCache"("queryKey", "fetchedAt");
