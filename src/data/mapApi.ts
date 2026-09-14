// Camada de acesso ao backend ARGOS usada pelo MapPage.tsx.
// As camadas ainda não integradas permanecem em mockData.ts.

// ============================================================================
// MODO DEMONSTRAÇÃO - ligar/desligar em UM lugar só
// ============================================================================
// Quando true, NENHUMA chamada de rede é feita - todas as funções abaixo
// resolvem na hora com dado de demonstração plausível. Feito para
// apresentações ao vivo (Liga Jovem etc.), onde depender de rede real
// (cold start do Render, rate limit do Open-Meteo, instabilidade de
// APIs de governo) é um risco real de a tela mostrar erro no meio da
// banca avaliando.
//
// ⚠️ IMPORTANTE: isso é só para a TELA da apresentação. Não é uma
// mentira sobre o produto - é o equivalente a um app mobile mostrar
// screenshots preparados numa demo de loja de app. Ainda assim:
// - NÃO faça deploy desta branch/build como o site público real do
//   projeto - o diferencial do ARGOS é justamente nunca fingir dado
//   real, e essa troca aqui existe só pra não depender de rede durante
//   os 5 minutos cronometrados da banca.
// - Se alguém da banca perguntar diretamente "isso é dado ao vivo
//   agora?", a resposta honesta é "não, essa versão que estamos
//   mostrando é uma captura pra garantir que a rede do local não
//   atrapalhe - o app de verdade consulta X/Y/Z fontes reais, dá pra
//   ver no link publicado".
// - Pra voltar ao comportamento real (rede de verdade, erros reais
//   aparecendo), troque para `false` abaixo.
export const DEMO_MODE = true

const DEMO_COORDS = { lat: -9.7436, lng: -42.2564 }

const DEMO_WEATHER: RealWeatherData = {
  latitude: DEMO_COORDS.lat,
  longitude: DEMO_COORDS.lng,
  temperature: 31,
  condition: 'Céu limpo',
  humidity: 38,
  windSpeed: 9,
  precipitation: 0,
  forecast: [
    { date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), condition: 'Céu limpo', temperatureMax: 33, temperatureMin: 22, precipitationSum: 0 },
    { date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), condition: 'Parcialmente nublado', temperatureMax: 32, temperatureMin: 21, precipitationSum: 0.4 },
    { date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), condition: 'Céu limpo', temperatureMax: 34, temperatureMin: 23, precipitationSum: 0 },
  ],
  city: 'Sento Sé',
  state: 'BA',
  lastUpdate: new Date().toISOString(),
  source: 'open-meteo',
  cached: false,
}

const DEMO_RAIN: RealRainPoint[] = [
  { lat: -9.741, lng: -42.254, precipitation: 1.8, condition: 'Chuva fraca', lastUpdate: new Date().toISOString(), cached: false },
  { lat: -9.746, lng: -42.258, precipitation: 0, condition: 'Sem chuva', lastUpdate: new Date().toISOString(), cached: false },
  { lat: -9.738, lng: -42.261, precipitation: 0, condition: 'Sem chuva', lastUpdate: new Date().toISOString(), cached: false },
]

const DEMO_RIVERS: RiverApiResponse = {
  status: 'current',
  data: {
    station: 'Sento Sé (Rio São Francisco)',
    latitude: -9.735,
    longitude: -42.25,
    level: 245.3,
    unit: 'cm',
    timestamp: new Date().toISOString(),
    source: 'ana-hidro',
    cached: false,
  },
}

const DEMO_EARTHQUAKES: EarthquakesApiResponse = {
  bbox: { minLatitude: DEMO_COORDS.lat - 1, maxLatitude: DEMO_COORDS.lat + 1, minLongitude: DEMO_COORDS.lng - 1, maxLongitude: DEMO_COORDS.lng + 1 },
  minMagnitude: 2.5,
  days: 30,
  count: 1,
  events: [
    {
      id: 'demo-1',
      magnitude: 2.8,
      magType: 'ml',
      place: 'próximo a Sento Sé, BA',
      time: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated: new Date(Date.now() - 3 * 86400000).toISOString(),
      latitude: -9.71,
      longitude: -42.27,
      depthKm: 8,
      tsunami: false,
      alert: null,
      status: 'reviewed',
      url: null,
    },
  ],
  source: 'usgs-earthquake',
  cached: false,
}

const DEMO_LANDSLIDE: LandslideApiResponse = {
  status: 'ok',
  data: {
    latitude: DEMO_COORDS.lat,
    longitude: DEMO_COORDS.lng,
    areas: [
      {
        municipio: 'Sento Sé',
        uf: 'BA',
        classe: 'Médio',
        tipologia: 'Movimento de Massa',
        local: 'Setor central',
        descricao: 'Área de exemplo para demonstração do polígono real de risco.',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-42.27, -9.76],
              [-42.24, -9.76],
              [-42.24, -9.73],
              [-42.27, -9.73],
              [-42.27, -9.76],
            ],
          ],
        },
        source: 'cprm-sgb',
      },
    ],
    source: 'cprm-sgb',
    cached: false,
  },
}

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
  if (DEMO_MODE) return DEMO_WEATHER

  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
  const response = await fetch(`/api/weather?${params.toString()}`)

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `Backend respondeu com status ${response.status}`)
  }

  return response.json()
}

export async function fetchRealRainLayer(): Promise<RealRainPoint[]> {
  if (DEMO_MODE) return DEMO_RAIN

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
  if (DEMO_MODE) return DEMO_RIVERS

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

// Um evento sísmico (backend/src/types.ts -> EarthquakeEventData).
export interface RealEarthquakeEvent {
  id: string
  magnitude: number | null
  magType: string | null
  place: string | null
  time: string | null
  updated: string | null
  latitude: number
  longitude: number
  depthKm: number | null
  tsunami: boolean
  alert: string | null
  status: string | null
  url: string | null
}

// Mesmo formato retornado por GET /api/earthquakes (backend/src/types.ts -> EarthquakesResponse).
export interface EarthquakesApiResponse {
  bbox: { minLatitude: number; maxLatitude: number; minLongitude: number; maxLongitude: number }
  minMagnitude: number
  days: number
  count: number
  events: RealEarthquakeEvent[]
  source: 'usgs-earthquake'
  cached: boolean
}

export async function fetchRealEarthquakes(): Promise<EarthquakesApiResponse> {
  if (DEMO_MODE) return DEMO_EARTHQUAKES

  const response = await fetch('/api/earthquakes')

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `Backend respondeu com status ${response.status}`)
  }

  return response.json()
}

// Uma área de suscetibilidade a deslizamento (backend/src/types.ts -> LandslideSusceptibilityArea).
export type RealLandslideGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] }

export interface RealLandslideArea {
  municipio: string | null
  uf: string | null
  classe: string | null
  // Campos novos da camada "risco" (substituta de "movimento_massa",
  // descontinuada pelo SGB) - tipologia real do registro e contexto de
  // campo (local/descrição), quando a fonte fornece.
  tipologia: string | null
  local: string | null
  descricao: string | null
  // Polígono real da área de suscetibilidade (CPRM/SGB, ArcGIS REST com
  // returnGeometry=true). Null só se a fonte não devolver geometria para
  // aquela feature específica - nunca substituído por forma inventada.
  geometry: RealLandslideGeometry | null
  source: 'cprm-sgb'
}

export interface RealLandslideData {
  latitude: number
  longitude: number
  areas: RealLandslideArea[]
  source: 'cprm-sgb'
  cached: boolean
}

// Mesmo formato retornado por GET /api/landslide-susceptibility
// (backend/src/types.ts -> LandslideSusceptibilityResponse).
export type LandslideApiResponse =
  | { status: 'ok'; data: RealLandslideData }
  | { status: 'no-data'; data: null }

export async function fetchRealLandslideSusceptibility(lat: number, lng: number): Promise<LandslideApiResponse> {
  if (DEMO_MODE) return DEMO_LANDSLIDE

  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
  const response = await fetch(`/api/landslide-susceptibility?${params.toString()}`)
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
      ? body.error
      : `Backend respondeu com status ${response.status}`
    throw new Error(message)
  }
  if (!body || typeof body !== 'object' || !('status' in body)) {
    throw new Error('Resposta inválida do backend de suscetibilidade a deslizamento.')
  }
  return body as LandslideApiResponse
}
