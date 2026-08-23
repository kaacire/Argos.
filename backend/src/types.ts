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

export class UpstreamUnavailableError extends Error {}
export class InvalidCoordinatesError extends Error {}
export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} ainda não foi implementado nesta etapa do ARGOS.`)
  }
}
