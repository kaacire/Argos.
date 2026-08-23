-- AlterTable
ALTER TABLE "WeatherData" ADD COLUMN "precipitation" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "WeatherData" ADD COLUMN "forecast" JSONB;
