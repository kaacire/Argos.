import { prisma } from '../db.js'
import { OPEN_METEO_BASE_URL, SENTO_SE_CITY, SENTO_SE_STATE, WEATHER_CACHE_MINUTES } from '../config.js'
import { ArgosWeatherModel, ForecastDay, InvalidCoordinatesError, UpstreamUnavailableError } from '../types.js'

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
    precipitation?: number
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
  daily?: {
    time?: string[]
    weather_code?: number[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_sum?: number[]
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

export function validateCoords(lat: number, lng: number) {
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
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code'
  )
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum'
  )
  url.searchParams.set('forecast_days', '5')
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

// Normaliza o bloco `daily` da Open-Meteo em ForecastDay[]. Os 4 arrays
// (time, weather_code, temperature_2m_max, temperature_2m_min,
// precipitation_sum) vêm sempre com o mesmo tamanho e alinhados por índice
// - se algum vier ausente/curto, o dia é descartado em vez de inventado.
function normalizeForecast(daily: OpenMeteoResponse['daily']): ForecastDay[] {
  if (!daily?.time) return []

  const days: ForecastDay[] = []
  for (let i = 0; i < daily.time.length; i++) {
    const date = daily.time[i]
    const tempMax = daily.temperature_2m_max?.[i]
    const tempMin = daily.temperature_2m_min?.[i]
    const precipitationSum = daily.precipitation_sum?.[i]
    const code = daily.weather_code?.[i]

    if (date === undefined || tempMax === undefined || tempMin === undefined || precipitationSum === undefined) {
      continue
    }

    days.push({
      date,
      condition: describeWeatherCode(code),
      temperatureMax: tempMax,
      temperatureMin: tempMin,
      precipitationSum,
    })
  }
  return days
}

function normalizeOpenMeteo(
  raw: OpenMeteoResponse,
  requestedLat: number,
  requestedLng: number
): Omit<ArgosWeatherModel, 'cached'> {
  const current = raw.current
  const legacy = raw.current_weather

  const temperature = current?.temperature_2m ?? legacy?.temperature
  const windSpeed = current?.wind_speed_10m ?? legacy?.windspeed
  const weatherCode = current?.weather_code ?? legacy?.weathercode
  const humidity = current?.relative_humidity_2m
  const precipitation = current?.precipitation

  if (temperature === undefined || windSpeed === undefined) {
    throw new UpstreamUnavailableError('Open-Meteo não retornou temperatura e/ou vento para este ponto.')
  }

  return {
    // Coordenadas efetivamente consultadas (não as do grid-cell que a
    // Open-Meteo pode retornar levemente deslocado - ver docs da API).
    latitude: requestedLat,
    longitude: requestedLng,
    temperature,
    windSpeed,
    // A Open-Meteo não retorna umidade/precipitação no endpoint
    // "current_weather" legado; quando indisponível, documentamos isso
    // explicitamente em vez de inventar um valor.
    humidity: humidity ?? -1,
    precipitation: precipitation ?? -1,
    forecast: normalizeForecast(raw.daily),
    condition: describeWeatherCode(weatherCode),
    city: SENTO_SE_CITY,
    state: SENTO_SE_STATE,
    lastUpdate: current?.time ?? legacy?.time ?? new Date().toISOString(),
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
      latitude: cached.latitude,
      longitude: cached.longitude,
      temperature: cached.temperature,
      condition: cached.condition,
      humidity: cached.humidity,
      windSpeed: cached.windSpeed,
      precipitation: cached.precipitation,
      forecast: (cached.forecast as unknown as ForecastDay[] | null) ?? [],
      city: cached.city,
      state: cached.state,
      lastUpdate: cached.fetchedAt.toISOString(),
      source: 'open-meteo',
      cached: true,
    }
  }

  const raw = await fetchFromOpenMeteo(lat, lng)
  const normalized = normalizeOpenMeteo(raw, lat, lng)

  await prisma.weatherData.create({
    data: {
      latitude: lat,
      longitude: lng,
      temperature: normalized.temperature,
      condition: normalized.condition,
      humidity: normalized.humidity,
      windSpeed: normalized.windSpeed,
      precipitation: normalized.precipitation,
      // Prisma serializa objetos JS em JSONB automaticamente para colunas Json.
      forecast: normalized.forecast as unknown as object,
      city: normalized.city,
      state: normalized.state,
      source: normalized.source,
    },
  })

  return { ...normalized, cached: false }
}
