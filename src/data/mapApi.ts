// Camada de acesso ao backend ARGOS, usada SOMENTE pelo MapPage.tsx nesta
// etapa. As outras camadas do mapa (zonas de risco, ocorrências, abrigos,
// chuva espacial, rios) continuam vindo de src/data/mockData.ts, pois ainda
// não têm uma fonte de dados real integrada - isso é intencional e está
// documentado no README do projeto.

// Mesmo formato retornado por GET /api/weather no backend
// (backend/src/types.ts -> ArgosWeatherModel).
export interface RealWeatherData {
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

export type MapApiState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

export async function fetchRealWeather(): Promise<RealWeatherData> {
  const response = await fetch('/api/weather')

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `Backend respondeu com status ${response.status}`)
  }

  return response.json()
}
