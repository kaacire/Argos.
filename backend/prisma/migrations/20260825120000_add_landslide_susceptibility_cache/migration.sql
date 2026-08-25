-- CreateTable
CREATE TABLE "LandslideSusceptibilityCache" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "areas" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'cprm-sgb',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandslideSusceptibilityCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LandslideSusceptibilityCache_latitude_longitude_fetchedAt_idx" ON "LandslideSusceptibilityCache"("latitude", "longitude", "fetchedAt");
