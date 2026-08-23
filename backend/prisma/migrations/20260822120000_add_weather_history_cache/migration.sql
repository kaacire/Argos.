-- CreateTable
CREATE TABLE "WeatherHistoryCache" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL,
    "points" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'open-meteo',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherHistoryCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeatherHistoryCache_latitude_longitude_period_key" ON "WeatherHistoryCache"("latitude", "longitude", "period");
