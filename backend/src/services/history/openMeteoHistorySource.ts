import { OPEN_METEO_ARCHIVE_URL } from '../../config.js'
import { UpstreamUnavailableError, type HistoryPoint } from '../../types.js'
import type { HistoricalWeatherSource } from './types.js'

// -----------------------------------------------------------------------
// Historical Weather API da Open-Meteo (https://open-meteo.com/en/docs/historical-weather-api)
// Endpoint real: https://archive-api.open-meteo.com/v1/archive
// Parâmetros confirmados na documentação oficial (não inventados):
//   latitude, longitude, start_date, end_date, daily, timezone
// Variáveis diárias usadas: temperature_2m_mean, precipitation_sum,
// relative_humidity_2m_mean, wind_speed_10m_max
// -----------------------------------------------------------------------

interface OpenMeteoArchiveResponse {
  daily?: {
    time?: string[]
    temperature_2m_mean?: (number | null)[]
    precipitation_sum?: (number | null)[]
    relative_humidity_2m_mean?: (number | null)[]
    wind_speed_10m_max?: (number | null)[]
  }
}

async function fetchArchive(lat: number, lng: number, startDate: string, endDate: string): Promise<OpenMeteoArchiveResponse> {
  const url = new URL(OPEN_METEO_ARCHIVE_URL)
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('start_date', startDate)
  url.searchParams.set('end_date', endDate)
  url.searchParams.set('daily', 'temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max')
  url.searchParams.set('timezone', 'auto')

  const controller = new AbortController()
  // Intervalos longos (1 ano) podem demorar mais que a chamada de clima
  // atual - timeout um pouco maior, mas ainda finito (não trava o processo).
  const timeout = setTimeout(() => controller.abort(), 15000)

  let response: Response
  try {
    response = await fetch(url, { signal: controller.signal })
  } catch (err) {
    throw new UpstreamUnavailableError(
      `Falha ao conectar à Historical Weather API da Open-Meteo: ${err instanceof Error ? err.message : String(err)}`
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new UpstreamUnavailableError(`Historical Weather API retornou status ${response.status}`)
  }

  const data = (await response.json()) as OpenMeteoArchiveResponse
  if (!data.daily?.time) {
    throw new UpstreamUnavailableError('Resposta da Historical Weather API em formato inesperado (sem bloco "daily").')
  }
  return data
}

function normalize(raw: OpenMeteoArchiveResponse): HistoryPoint[] {
  const daily = raw.daily
  if (!daily?.time) return []

  const points: HistoryPoint[] = []
  for (let i = 0; i < daily.time.length; i++) {
    const date = daily.time[i]
    if (date === undefined) continue

    // Cada campo vira null (não um valor inventado) se a fonte não tiver
    // o dado para este dia específico - a Open-Meteo pode ter lacunas
    // pontuais mesmo dentro de um intervalo válido.
    points.push({
      date,
      temperature: daily.temperature_2m_mean?.[i] ?? null,
      precipitation: daily.precipitation_sum?.[i] ?? null,
      humidity: daily.relative_humidity_2m_mean?.[i] ?? null,
      windSpeed: daily.wind_speed_10m_max?.[i] ?? null,
    })
  }
  return points
}

export const openMeteoHistorySource: HistoricalWeatherSource = {
  id: 'open-meteo',
  async fetchDailyHistory(lat, lng, startDate, endDate) {
    const raw = await fetchArchive(lat, lng, startDate, endDate)
    return normalize(raw)
  },
}
