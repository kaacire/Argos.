// Modelo interno do ARGOS para dados de clima.
// Formato compatível com a interface WeatherData de src/types/index.ts
// do frontend (sem o campo riskLevel, que pertence a uma camada de risco
// ainda não implementada nesta etapa - ver README, seção "O que NÃO foi implementado").
// Um dia de previsão (agregado diário da Open-Meteo: &daily=...).
export interface ForecastDay {
  date: string // yyyy-mm-dd, formato ISO 8601 devolvido pela Open-Meteo
  condition: string
  temperatureMax: number
  temperatureMin: number
  precipitationSum: number
}

export interface ArgosWeatherModel {
  latitude: number
  longitude: number
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  precipitation: number
  forecast: ForecastDay[]
  city: string
  state: string
  lastUpdate: string
  source: 'open-meteo'
  cached: boolean
}

// Um ponto da camada "Chuva" do mapa. Reaproveita o mesmo dado de
// precipitação já normalizado em ArgosWeatherModel (getWeatherForCoords),
// só que consultado para vários pontos fixos em vez de um único.
// Quando a Open-Meteo/Postgres falha para um ponto específico, ele entra
// na resposta com `error` preenchido e sem `precipitation` - nunca com um
// valor inventado.
export type RainLayerPoint =
  | {
      lat: number
      lng: number
      precipitation: number
      condition: string
      lastUpdate: string
      cached: boolean
    }
  | {
      lat: number
      lng: number
      error: string
    }

export class UpstreamUnavailableError extends Error {}
export class InvalidCoordinatesError extends Error {}
export class InvalidParameterError extends Error {}
export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} ainda não foi implementado nesta etapa do ARGOS.`)
  }
}

// --- Página Histórico (7d/3m/1y) ------------------------------------------

export type HistoryPeriod = '7d' | '3m' | '1y'

// Um ponto normalizado da série histórica. Cada campo é `null` (nunca um
// valor inventado) quando a fonte não tinha o dado para aquele dia/semana/mês.
export interface HistoryPoint {
  // yyyy-mm-dd: o próprio dia (agregação diária) ou o primeiro dia do
  // intervalo (agregação semanal/mensal).
  date: string
  temperature: number | null
  precipitation: number | null
  humidity: number | null
  windSpeed: number | null
}

export type HistoryAggregation = 'daily' | 'weekly' | 'monthly'

export interface WeatherHistoryResponse {
  period: HistoryPeriod
  aggregation: HistoryAggregation
  points: HistoryPoint[]
  source: 'open-meteo'
  cached: boolean
}

// --- Nível dos rios (GET /api/rivers, ANA - webservice legado) -------------
//
// Fonte: ANA (Agência Nacional de Águas), webservice legado
// telemetriaws1.ana.gov.br/ServiceANA.asmx - ver riverService.ts para o
// histórico da troca (era USGS Water Data, só EUA) e os avisos sobre esta
// integração. Para coordenadas sem estação da ANA por perto, a resposta
// correta NÃO é um erro de rota, e sim `{ status: 'no-data', data: null }`
// - nunca um nível inventado.

export type RiverStatus = 'ok' | 'no-data'

export interface RiverObservationData {
  stationId: string
  stationName: string | null
  latitude: number | null
  longitude: number | null
  // Código do tipo de dado da ANA ("1" = Cotas/nível da régua - o único
  // usado aqui). `unit` sempre reflete a unidade original da ANA (cm).
  parameterCode: string
  parameterName: string | null
  value: number
  unit: string | null
  observedAt: string
  source: 'ana-hidro'
  cached: boolean
}

export type RiverLevelResponse =
  | { status: 'ok'; data: RiverObservationData }
  | { status: 'no-data'; data: null }

// --- Terremotos (GET /api/earthquakes, USGS Earthquake Catalog) -----------
//
// Fonte: USGS (United States Geological Survey), earthquake.usgs.gov -
// ver integrations/external/usgs-earthquake/service.ts. Apesar do nome,
// é um catálogo GLOBAL (não só EUA): cobre qualquer bounding box do
// planeta, incluindo o Brasil inteiro, sem exigir cadastro/token. Não
// existe uma API pública/estável equivalente da Rede Sismográfica
// Brasileira (RSBR) no momento em que esta integração foi escrita - ver
// services/earthquakeService.ts.

export interface EarthquakeEventData {
  id: string
  magnitude: number | null
  magType: string | null
  place: string | null
  // ISO 8601. `null` quando a USGS não retornou timestamp para o evento.
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

export interface EarthquakesResponse {
  bbox: { minLatitude: number; maxLatitude: number; minLongitude: number; maxLongitude: number }
  minMagnitude: number
  days: number
  count: number
  events: EarthquakeEventData[]
  source: 'usgs-earthquake'
  cached: boolean
}

// --- Suscetibilidade a deslizamento (GET /api/landslide-susceptibility,
// SGB/CPRM - OGC API) -------------------------------------------------------
//
// Fonte: SGB/CPRM (Serviço Geológico do Brasil), OGC API em
// geoservicos.sgb.gov.br/ogcapi, coleção "Prevenção de Desastres:
// Suscetibilidade a Movimento de Massa" - ver
// services/landslideService.ts e integrations/external/cprm/. Cartografia
// de suscetibilidade a movimentos gravitacionais de massa (deslizamentos,
// corridas de massa) por município. Cobertura NACIONAL, mas não é 100% do
// Brasil ainda (cerca de 700 municípios com carta publicada no momento em
// que esta integração foi escrita) - para coordenadas sem carta
// publicada, a resposta correta é `{ status: 'no-data', data: null }`,
// igual ao padrão já usado em rivers.

export type LandslideSusceptibilityStatus = 'ok' | 'no-data'

// Um polígono de suscetibilidade que intersecta o bbox consultado. `classe`
// é o texto original retornado pela CPRM (ex.: "Alta", "Média", "Baixa") -
// não normalizado nem traduzido, para não inventar uma categorização que a
// fonte não garantiu.
export interface LandslideSusceptibilityArea {
  municipio: string | null
  uf: string | null
  classe: string | null
  source: 'cprm-sgb'
}

export interface LandslideSusceptibilityData {
  latitude: number
  longitude: number
  areas: LandslideSusceptibilityArea[]
  source: 'cprm-sgb'
  cached: boolean
}

export type LandslideSusceptibilityResponse =
  | { status: 'ok'; data: LandslideSusceptibilityData }
  | { status: 'no-data'; data: null }
