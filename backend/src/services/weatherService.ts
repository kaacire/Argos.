import { prisma } from '../db.js'
import { OPEN_METEO_BASE_URL, SENTO_SE_CITY, SENTO_SE_STATE, WEATHER_CACHE_MINUTES } from '../config.js'
import { ArgosWeatherModel, InvalidCoordinatesError, UpstreamUnavailableError } from '../types.js'

// -----------------------------------------------------------------------
// FLUXO (ver README, seção "Arquitetura"):
//
//   Open-Meteo (formato próprio)
//        -> fetchFromOpenMeteo        (chamada HTTP real)
//        -> normalizeOpenMeteo        (Open-Meteo -> ArgosWeatherModel)
//        -> PostgreSQL (Prisma)       (persistência real)
//        -> getWeatherForCoords       (cache de leitura + gravação)
//        -> rota GET /api/weather
//
// O frontend NUNCA vê o formato bruto da Open-Meteo.
// -----------------------------------------------------------------------

interface OpenMeteoResponse {
  latitude: number
  longitude: number
  current?: {
    temperature_2m?: number
    relative_humidity_2m?: number
    wind_speed_10m?: number
    weather_code?: number
    time?: string
  }
  current_weather?: {
    temperature?: number
    windspeed?: number
    weathercode?: number
    time?: string
  }
}

// Mapeamento reduzido dos WMO weather codes usados pela Open-Meteo para uma
// descrição em português. Não é uma tradução completa da tabela oficial -
// apenas os códigos suficientes para descrever a condição atual no mapa.
const WEATHER_CODE_LABELS: Record<number, string> = {
  0: 'Céu limpo',
  1: 'Principalmente limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina com geada',
  51: 'Garoa fraca',
  53: 'Garoa moderada',
  55: 'Garoa intensa',
  61: 'Chuva fraca',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  80: 'Pancadas de chuva fracas',
  81: 'Pancadas de chuva moderadas',
  82: 'Pancadas de chuva violentas',
  95: 'Tempestade',
}

function describeWeatherCode(code: number | undefined): string {
  if (code === undefined) return 'Condição indisponível'
  return WEATHER_CODE_LABELS[code] ?? `Condição não mapeada (código ${code})`
}

function validateCoords(lat: number, lng: number) {
  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new InvalidCoordinatesError(`Coordenadas inválidas: lat=${lat}, lng=${lng}`)
  }
}

// Chamada REAL à Open-Meteo. Nenhum dado é inventado: se a API não
// responder, ou responder algo inesperado, um erro é propagado e o
// endpoint retorna um erro compreensível ao frontend (ver rotas/weather.ts).
async function fetchFromOpenMeteo(lat: number, lng: number): Promise<OpenMeteoResponse> {
  const url = new URL(OPEN_METEO_BASE_URL)
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code')
  url.searchParams.set('timezone', 'auto')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  let response: Response
  try {
    response = await fetch(url, { signal: controller.signal })
  } catch (err) {
    throw new UpstreamUnavailableError(
      `Falha ao conectar à Open-Meteo: ${err instanceof Error ? err.message : String(err)}`
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new UpstreamUnavailableError(`Open-Meteo retornou status ${response.status}`)
  }

  const data = (await response.json()) as OpenMeteoResponse
  if (!data.current && !data.current_weather) {
    throw new UpstreamUnavailableError('Resposta da Open-Meteo em formato inesperado (sem dados atuais).')
  }
  return data
}

function normalizeOpenMeteo(raw: OpenMeteoResponse): Omit<ArgosWeatherModel, 'cached'> {
  const current = raw.current
  const legacy = raw.current_weather

  const temperature = current?.temperature_2m ?? legacy?.temperature
  const windSpeed = current?.wind_speed_10m ?? legacy?.windspeed
  const weatherCode = current?.weather_code ?? legacy?.weathercode
  const humidity = current?.relative_humidity_2m

  if (temperature === undefined || windSpeed === undefined) {
    throw new UpstreamUnavailableError('Open-Meteo não retornou temperatura e/ou vento para este ponto.')
  }

  return {
    temperature,
    windSpeed,
    // A Open-Meteo não retorna umidade no endpoint "current_weather" legado;
    // quando indisponível, documentamos isso explicitamente em vez de inventar.
    humidity: humidity ?? -1,
    condition: describeWeatherCode(weatherCode),
    city: SENTO_SE_CITY,
    state: SENTO_SE_STATE,
    lastUpdate: new Date().toISOString(),
    source: 'open-meteo',
  }
}

// Ponto de entrada usado pelas rotas. Implementa cache de leitura via
// PostgreSQL: se existir um registro recente (WEATHER_CACHE_MINUTES) para
// as mesmas coordenadas, ele é reaproveitado em vez de bater na Open-Meteo
// a cada requisição do mapa. Isso é um cache real (dado persistido), não
// um mock - e está documentado aqui para não ser confundido com um.
export async function getWeatherForCoords(lat: number, lng: number): Promise<ArgosWeatherModel> {
  validateCoords(lat, lng)

  const cacheThreshold = new Date(Date.now() - WEATHER_CACHE_MINUTES * 60_000)

  const cached = await prisma.weatherData.findFirst({
    where: {
      latitude: lat,
      longitude: lng,
      fetchedAt: { gte: cacheThreshold },
    },
    orderBy: { fetchedAt: 'desc' },
  })

  if (cached) {
    return {
      temperature: cached.temperature,
      condition: cached.condition,
      humidity: cached.humidity,
      windSpeed: cached.windSpeed,
      city: cached.city,
      state: cached.state,
      lastUpdate: cached.fetchedAt.toISOString(),
      source: 'open-meteo',
      cached: true,
    }
  }

  const raw = await fetchFromOpenMeteo(lat, lng)
  const normalized = normalizeOpenMeteo(raw)

  await prisma.weatherData.create({
    data: {
      latitude: lat,
      longitude: lng,
      temperature: normalized.temperature,
      condition: normalized.condition,
      humidity: normalized.humidity,
      windSpeed: normalized.windSpeed,
      city: normalized.city,
      state: normalized.state,
      source: normalized.source,
    },
  })

  return { ...normalized, cached: false }
}
