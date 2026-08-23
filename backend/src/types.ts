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
