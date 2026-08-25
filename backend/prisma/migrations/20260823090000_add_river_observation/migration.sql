-- CreateTable
CREATE TABLE "RiverObservation" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "stationId" TEXT,
    "stationName" TEXT,
    "parameterCode" TEXT,
    "parameterName" TEXT,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "observedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'usgs-water',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiverObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiverObservation_latitude_longitude_fetchedAt_idx" ON "RiverObservation"("latitude", "longitude", "fetchedAt");

-- CreateIndex
CREATE INDEX "RiverObservation_stationId_fetchedAt_idx" ON "RiverObservation"("stationId", "fetchedAt");
