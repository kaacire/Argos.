// -----------------------------------------------------------------------
// FLUXO (mesma arquitetura de weatherService.ts):
//
//   Open-Meteo Historical Weather API (archive-api.open-meteo.com)
//        -> openMeteoHistorySource.fetchDailyHistory   (chamada HTTP real)
//        -> aggregateForPeriod                          (7d/3m/1y)
//        -> PostgreSQL (Prisma, WeatherHistoryCache)     (cache)
//        -> getWeatherHistory                            (orquestra tudo)
//        -> rota GET /api/history
//
// O frontend NUNCA vê o formato bruto da Open-Meteo. Nenhum valor é
// inventado: dias sem dado na fonte viram `null` nos campos, nunca 0 ou
// uma média fabricada.
//
// Preparado para futuras fontes: getWeatherHistory depende só da interface
// HistoricalWeatherSource (ver history/types.ts) - trocar ou combinar
// fontes no futuro não deve exigir reescrever este arquivo.
// -----------------------------------------------------------------------

import { prisma } from '../db.js'
import { HISTORY_CACHE_HOURS } from '../config.js'
import { validateCoords } from './weatherService.js'
import { openMeteoHistorySource } from './history/openMeteoHistorySource.js'
import type { HistoricalWeatherSource } from './history/types.js'
import type { HistoryAggregation, HistoryPeriod, HistoryPoint, WeatherHistoryResponse } from '../types.js'

// Fonte histórica usada hoje. Trocar ou adicionar outra fonte no futuro
// (ex: combinar com uma API de nível de rio) muda só esta linha/uma
// pequena lista, não a lógica de agregação/cache abaixo.
const historySource: HistoricalWeatherSource = openMeteoHistorySource

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Janela de datas por período. Termina em "ontem" (não hoje) porque o dia
// corrente ainda está em andamento e não tem dado diário completo/estável
// na fonte - evita misturar um dia parcial com dias completos no gráfico.
function computeDateRange(period: HistoryPeriod): { startDate: string; endDate: string } {
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - 1)

  const start = new Date(end)
  if (period === '7d') start.setUTCDate(start.getUTCDate() - 6)
  else if (period === '3m') start.setUTCDate(start.getUTCDate() - 89)
  else start.setUTCDate(start.getUTCDate() - 364)

  return { startDate: toIsoDate(start), endDate: toIsoDate(end) }
}

function average(values: (number | null)[]): number | null {
  const known = values.filter((v): v is number => v !== null)
  if (known.length === 0) return null
  const sum = known.reduce((a, b) => a + b, 0)
  return Math.round((sum / known.length) * 10) / 10
}

function sum(values: (number | null)[]): number | null {
  const known = values.filter((v): v is number => v !== null)
  if (known.length === 0) return null
  return Math.round(known.reduce((a, b) => a + b, 0) * 10) / 10
}

// Agrupa pontos diários em baldes de N dias corridos (usado para 3 meses:
// baldes de 7 dias, ~13 pontos em vez de ~90 - evita poluir o gráfico).
function bucketByDays(points: HistoryPoint[], daysPerBucket: number): HistoryPoint[] {
  const buckets: HistoryPoint[] = []
  for (let i = 0; i < points.length; i += daysPerBucket) {
    const chunk = points.slice(i, i + daysPerBucket)
    if (chunk.length === 0) continue
    buckets.push({
      date: chunk[0].date,
      temperature: average(chunk.map((p) => p.temperature)),
      precipitation: sum(chunk.map((p) => p.precipitation)),
      humidity: average(chunk.map((p) => p.humidity)),
      windSpeed: average(chunk.map((p) => p.windSpeed)),
    })
  }
  return buckets
}

// Agrupa pontos diários por mês-calendário (usado para 1 ano: ~12 pontos).
function bucketByMonth(points: HistoryPoint[]): HistoryPoint[] {
  const byMonth = new Map<string, HistoryPoint[]>()
  for (const p of points) {
    const monthKey = p.date.slice(0, 7) // yyyy-mm
    const list = byMonth.get(monthKey) ?? []
    list.push(p)
    byMonth.set(monthKey, list)
  }

  const result: HistoryPoint[] = []
  for (const [monthKey, chunk] of byMonth) {
    result.push({
      date: `${monthKey}-01`,
      temperature: average(chunk.map((p) => p.temperature)),
      precipitation: sum(chunk.map((p) => p.precipitation)),
      humidity: average(chunk.map((p) => p.humidity)),
      windSpeed: average(chunk.map((p) => p.windSpeed)),
    })
  }
  return result.sort((a, b) => a.date.localeCompare(b.date))
}

function aggregationLabelForPeriod(period: HistoryPeriod): HistoryAggregation {
  if (period === '7d') return 'daily'
  if (period === '3m') return 'weekly'
  return 'monthly'
}

function aggregateForPeriod(period: HistoryPeriod, daily: HistoryPoint[]): { aggregation: HistoryAggregation; points: HistoryPoint[] } {
  if (period === '7d') return { aggregation: 'daily', points: daily }
  if (period === '3m') return { aggregation: 'weekly', points: bucketByDays(daily, 7) }
  return { aggregation: 'monthly', points: bucketByMonth(daily) }
}

export async function getWeatherHistory(lat: number, lng: number, period: HistoryPeriod): Promise<WeatherHistoryResponse> {
  validateCoords(lat, lng)

  const cacheThreshold = new Date(Date.now() - HISTORY_CACHE_HOURS * 60 * 60_000)

  const cached = await prisma.weatherHistoryCache.findUnique({
    where: { latitude_longitude_period: { latitude: lat, longitude: lng, period } },
  })

  if (cached && cached.fetchedAt >= cacheThreshold) {
    return {
      period,
      aggregation: aggregationLabelForPeriod(period),
      points: cached.points as unknown as HistoryPoint[],
      source: 'open-meteo',
      cached: true,
    }
  }

  const { startDate, endDate } = computeDateRange(period)
  const daily = await historySource.fetchDailyHistory(lat, lng, startDate, endDate)
  const { aggregation, points } = aggregateForPeriod(period, daily)

  await prisma.weatherHistoryCache.upsert({
    where: { latitude_longitude_period: { latitude: lat, longitude: lng, period } },
    create: {
      latitude: lat,
      longitude: lng,
      period,
      points: points as unknown as object,
      source: 'open-meteo',
    },
    update: {
      points: points as unknown as object,
      source: 'open-meteo',
      fetchedAt: new Date(),
    },
  })

  return { period, aggregation, points, source: 'open-meteo', cached: false }
}
