// Modelo interno do ARGOS para dados de clima.
// Formato compatível com a interface WeatherData de src/types/index.ts
// do frontend (sem o campo riskLevel, que pertence a uma camada de risco
// ainda não implementada nesta etapa - ver README, seção "O que NÃO foi implementado").
export interface ArgosWeatherModel {
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
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
