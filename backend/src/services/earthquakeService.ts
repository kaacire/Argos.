// -----------------------------------------------------------------------
// FLUXO (mesma arquitetura de weatherService.ts / riverService.ts):
//
//   USGS Earthquake Catalog (earthquake.usgs.gov/fdsnws/event/1/query)
//        -> integrations/external/usgs-earthquake  (chamada HTTP real,
//           GET simples, sem necessidade de cadastro/token)
//        -> normalizeFeature                        (GeoJSON -> EarthquakeEventData)
//        -> PostgreSQL (Prisma, EarthquakeQueryCache) (cache de leitura)
//        -> getEarthquakes
//        -> rota GET /api/earthquakes
//
// Diferente de weather/river, esta fonte não é "global" no sentido do
// projeto (EUA), e sim o oposto: a USGS Earthquake Catalog é um catálogo
// GLOBAL de sismos, então cobre o Brasil inteiro sem qualquer ajuste -
// só precisa de um bounding box. Não existe hoje uma API pública/estável
// equivalente da Rede Sismográfica Brasileira (RSBR) para consumo
// programático (o monitoramento oficial existe, mas é divulgado como
// site/mapa, não como endpoint documentado) - por isso a USGS foi
// escolhida como fonte real desta integração.
// -----------------------------------------------------------------------

import { prisma } from '../db.js'
import { BRAZIL_BBOX, EARTHQUAKE_CACHE_MINUTES, EARTHQUAKE_DEFAULT_DAYS, EARTHQUAKE_DEFAULT_MIN_MAGNITUDE } from '../config.js'
import { EarthquakeEventData, EarthquakesResponse, InvalidCoordinatesError, InvalidParameterError, UpstreamUnavailableError } from '../types.js'
import { queryUsgsEarthquakes } from '../integrations/external/usgs-earthquake/index.js'
import type { UsgsEarthquakeFeature } from '../integrations/external/usgs-earthquake/index.js'
import type { EarthquakeQueryCache } from '@prisma/client'

export interface EarthquakeQuery {
  minLatitude: number
  maxLatitude: number
  minLongitude: number
  maxLongitude: number
  minMagnitude: number
  days: number
}

export const DEFAULT_EARTHQUAKE_QUERY: EarthquakeQuery = {
  minLatitude: BRAZIL_BBOX.minLatitude,
  maxLatitude: BRAZIL_BBOX.maxLatitude,
  minLongitude: BRAZIL_BBOX.minLongitude,
  maxLongitude: BRAZIL_BBOX.maxLongitude,
  minMagnitude: EARTHQUAKE_DEFAULT_MIN_MAGNITUDE,
  days: EARTHQUAKE_DEFAULT_DAYS,
}

export function validateEarthquakeQuery(query: EarthquakeQuery) {
  const { minLatitude, maxLatitude, minLongitude, maxLongitude, minMagnitude, days } = query

  for (const [label, value] of Object.entries({ minLatitude, maxLatitude, minLongitude, maxLongitude })) {
    if (Number.isNaN(value)) {
      throw new InvalidCoordinatesError(`Coordenada inválida para "${label}".`)
    }
  }
  if (minLatitude < -90 || maxLatitude > 90 || minLongitude < -180 || maxLongitude > 180) {
    throw new InvalidCoordinatesError('Bounding box fora do intervalo válido (lat: -90..90, lng: -180..180).')
  }
  if (minLatitude >= maxLatitude || minLongitude >= maxLongitude) {
    throw new InvalidCoordinatesError('Bounding box inválido: min deve ser menor que max (lat e lng).')
  }
  if (Number.isNaN(minMagnitude)) {
    throw new InvalidParameterError('minmagnitude inválido.')
  }
  if (!Number.isInteger(days) || days <= 0 || days > 365) {
    throw new InvalidParameterError('days deve ser um inteiro entre 1 e 365.')
  }
}

// Chave de cache: os parâmetros de busca já normalizados (arredondados a 2
// casas decimais nas coordenadas, o suficiente para não gerar uma linha
// nova de cache por ruído de precisão de ponto flutuante).
function buildQueryKey(query: EarthquakeQuery): string {
  const round = (n: number) => n.toFixed(2)
  return [
    round(query.minLatitude),
    round(query.maxLatitude),
    round(query.minLongitude),
    round(query.maxLongitude),
    query.minMagnitude,
    query.days,
  ].join(':')
}

// Chamada REAL à USGS. Nenhum dado é inventado: se a API não responder,
// ou responder algo inesperado, um erro é propagado (ver rotas/earthquakes.ts).
async function fetchFromUsgs(query: EarthquakeQuery): Promise<UsgsEarthquakeFeature[]> {
  const endtime = new Date()
  const starttime = new Date(endtime.getTime() - query.days * 24 * 60 * 60 * 1000)

  try {
    const feed = await queryUsgsEarthquakes({
      starttime: starttime.toISOString(),
      endtime: endtime.toISOString(),
      minlatitude: query.minLatitude,
      maxlatitude: query.maxLatitude,
      minlongitude: query.minLongitude,
      maxlongitude: query.maxLongitude,
      minmagnitude: query.minMagnitude,
      orderby: 'time',
    })
    return feed.features
  } catch (err) {
    throw new UpstreamUnavailableError(
      `Falha ao consultar USGS Earthquake Catalog: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

// GeoJSON da USGS -> EarthquakeEventData. `coordinates` vem sempre como
// [longitude, latitude, depthKm] (ver types.ts da integração) - eventos
// sem par lat/lng utilizável são descartados em vez de inventados.
function normalizeFeature(feature: UsgsEarthquakeFeature): EarthquakeEventData | null {
  const [longitude, latitude, depthKm] = feature.geometry?.coordinates ?? []
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null

  const props = feature.properties

  return {
    id: feature.id,
    magnitude: props.mag ?? null,
    magType: props.magType ?? null,
    place: props.place ?? null,
    time: typeof props.time === 'number' ? new Date(props.time).toISOString() : null,
    updated: typeof props.updated === 'number' ? new Date(props.updated).toISOString() : null,
    latitude,
    longitude,
    depthKm: typeof depthKm === 'number' ? depthKm : null,
    tsunami: props.tsunami === 1,
    alert: props.alert ?? null,
    status: props.status ?? null,
    url: props.url ?? null,
  }
}

function rowToResponse(row: EarthquakeQueryCache, query: EarthquakeQuery, cached: boolean): EarthquakesResponse {
  const events = (row.events as unknown as EarthquakeEventData[]) ?? []
  return {
    bbox: {
      minLatitude: query.minLatitude,
      maxLatitude: query.maxLatitude,
      minLongitude: query.minLongitude,
      maxLongitude: query.maxLongitude,
    },
    minMagnitude: query.minMagnitude,
    days: query.days,
    count: events.length,
    events,
    source: 'usgs-earthquake',
    cached,
  }
}

// Ponto de entrada usado pela rota. Mesmo padrão de cache de leitura de
// weatherService.ts/riverService.ts: se existir um registro recente
// (EARTHQUAKE_CACHE_MINUTES) para a mesma queryKey, reaproveita em vez de
// bater na USGS a cada requisição.
export async function getEarthquakes(query: EarthquakeQuery = DEFAULT_EARTHQUAKE_QUERY): Promise<EarthquakesResponse> {
  validateEarthquakeQuery(query)

  const queryKey = buildQueryKey(query)
  const cacheThreshold = new Date(Date.now() - EARTHQUAKE_CACHE_MINUTES * 60_000)

  const cached = await prisma.earthquakeQueryCache.findFirst({
    where: { queryKey, fetchedAt: { gte: cacheThreshold } },
    orderBy: { fetchedAt: 'desc' },
  })
  if (cached) return rowToResponse(cached, query, true)

  const features = await fetchFromUsgs(query)
  const events = features
    .map(normalizeFeature)
    .filter((e): e is EarthquakeEventData => e !== null)

  const row = await prisma.earthquakeQueryCache.upsert({
    where: { queryKey },
    create: {
      queryKey,
      minLatitude: query.minLatitude,
      maxLatitude: query.maxLatitude,
      minLongitude: query.minLongitude,
      maxLongitude: query.maxLongitude,
      minMagnitude: query.minMagnitude,
      days: query.days,
      events: events as unknown as object,
      source: 'usgs-earthquake',
    },
    update: {
      events: events as unknown as object,
      fetchedAt: new Date(),
    },
  })

  return rowToResponse(row, query, false)
}
