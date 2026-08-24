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
//
// Para 1y, o início é calculado por ARITMÉTICA DE MÊS (12 meses antes de
// "ontem", +1 dia) em vez de "-364 dias" fixo. Isso alinha exatamente com
// os 12 baldes mensais de bucketByRelativeMonth() abaixo (mesma fronteira
// nos dois lugares), então nenhum dia buscado fica de fora do balde certo
// e nenhum balde fica parcial. Na prática o intervalo continua ~365 dias
// (364-366, dependendo dos meses cruzados) - a mesma janela de "último
// ano", só que com o corte exatamente onde a agregação mensal também corta.
function computeDateRange(period: HistoryPeriod): { startDate: string; endDate: string } {
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - 1)

  const start = new Date(end)
  if (period === '7d') start.setUTCDate(start.getUTCDate() - 6)
  else if (period === '3m') start.setUTCDate(start.getUTCDate() - 89)
  else {
    start.setUTCMonth(start.getUTCMonth() - 12)
    start.setUTCDate(start.getUTCDate() + 1)
  }

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

// Calcula as fronteiras dos 12 "meses relativos" que terminam exatamente em
// endDate: bucket mais recente = (endDate - 1 mês + 1 dia) até endDate;
// o anterior = mais um mês para trás; e assim por diante. Contíguos, sem
// sobreposição, sempre exatamente 12 - nunca dependem de onde o mês
// civil começa, então nunca duplicam um mês por causa da virada de ano.
function relativeMonthBounds(endDateStr: string): { start: string; end: string }[] {
  const bounds: { start: string; end: string }[] = []
  let cursorEnd = new Date(`${endDateStr}T00:00:00Z`)

  for (let i = 0; i < 12; i++) {
    const cursorStart = new Date(cursorEnd)
    cursorStart.setUTCMonth(cursorStart.getUTCMonth() - 1)
    cursorStart.setUTCDate(cursorStart.getUTCDate() + 1)

    bounds.unshift({ start: toIsoDate(cursorStart), end: toIsoDate(cursorEnd) })

    cursorEnd = new Date(cursorStart)
    cursorEnd.setUTCDate(cursorEnd.getUTCDate() - 1)
  }

  return bounds
}

// Agrupa pontos diários em exatamente 12 baldes "mensais" relativos a
// endDate (ver relativeMonthBounds) - usado para 1 ano. Cada balde vira um
// ponto no gráfico rotulado com sua data de início.
function bucketByRelativeMonth(points: HistoryPoint[], endDate: string): HistoryPoint[] {
  const bounds = relativeMonthBounds(endDate)

  return bounds.map(({ start, end }) => {
    const chunk = points.filter((p) => p.date >= start && p.date <= end)
    return {
      date: start,
      temperature: average(chunk.map((p) => p.temperature)),
      precipitation: sum(chunk.map((p) => p.precipitation)),
      humidity: average(chunk.map((p) => p.humidity)),
      windSpeed: average(chunk.map((p) => p.windSpeed)),
    }
  })
}

function aggregationLabelForPeriod(period: HistoryPeriod): HistoryAggregation {
  if (period === '7d') return 'daily'
  if (period === '3m') return 'weekly'
  return 'monthly'
}

function aggregateForPeriod(
  period: HistoryPeriod,
  daily: HistoryPoint[],
  endDate: string
): { aggregation: HistoryAggregation; points: HistoryPoint[] } {
  if (period === '7d') return { aggregation: 'daily', points: daily }
  if (period === '3m') return { aggregation: 'weekly', points: bucketByDays(daily, 7) }
  return { aggregation: 'monthly', points: bucketByRelativeMonth(daily, endDate) }
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
  const { aggregation, points } = aggregateForPeriod(period, daily, endDate)

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
