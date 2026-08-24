// Camada de acesso ao backend ARGOS usada pelo MapPage.tsx.
// As camadas ainda não integradas permanecem em mockData.ts.

// Um dia de previsão (backend/src/types.ts -> ForecastDay).
export interface RealForecastDay {
  date: string
  condition: string
  temperatureMax: number
  temperatureMin: number
  precipitationSum: number
}

// Mesmo formato retornado por GET /api/weather no backend
// (backend/src/types.ts -> ArgosWeatherModel).
export interface RealWeatherData {
  latitude: number
  longitude: number
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  precipitation: number
  forecast: RealForecastDay[]
  city: string
  state: string
  lastUpdate: string
  source: 'open-meteo'
  cached: boolean
}

// Um ponto da camada "Chuva" (backend/src/types.ts -> RainLayerPoint).
// Quando a Open-Meteo falha para um ponto específico, ele vem com `error`
// em vez de `precipitation` - o frontend precisa checar qual dos dois.
export type RealRainPoint =
  | { lat: number; lng: number; precipitation: number; condition: string; lastUpdate: string; cached: boolean }
  | { lat: number; lng: number; error: string }

export type MapApiState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

export async function fetchRealWeather(lat: number, lng: number): Promise<RealWeatherData> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
  const response = await fetch(`/api/weather?${params.toString()}`)

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `Backend respondeu com status ${response.status}`)
  }

  return response.json()
}

export async function fetchRealRainLayer(): Promise<RealRainPoint[]> {
  const response = await fetch('/api/rain')

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `Backend respondeu com status ${response.status}`)
  }

  const body: { points: RealRainPoint[] } = await response.json()
  return body.points
}

export interface RealRiver {
  station: string
  latitude?: number
  longitude?: number
  level: number
  unit: string
  timestamp: string
  source: string
  cached: boolean
}

export interface RiverApiResponse {
  status: 'current' | 'cached' | 'no-data'
  data: RealRiver | null
  reason?: string
}

export async function fetchRealRivers(lat: number, lng: number): Promise<RiverApiResponse> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
  const response = await fetch(`/api/rivers?${params.toString()}`)
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
      ? body.error
      : `Backend respondeu com status ${response.status}`
    throw new Error(message)
  }
  if (!body || typeof body !== 'object' || !('status' in body)) {
    throw new Error('Resposta inválida do backend de rios.')
  }
  return body as RiverApiResponse
}
