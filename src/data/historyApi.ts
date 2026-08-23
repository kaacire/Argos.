// Camada de acesso ao backend ARGOS, usada SOMENTE pela HistoryPage.tsx.
// Separado de mapApi.ts (que é exclusivo do MapPage.tsx) para não misturar
// os dois pontos de entrada do frontend nem alterar código do mapa aqui.

export type HistoryPeriod = '7d' | '3m' | '1y'
export type HistoryAggregation = 'daily' | 'weekly' | 'monthly'

// Mesmo formato de backend/src/types.ts -> HistoryPoint. Campos vêm `null`
// (nunca um valor inventado) quando a Open-Meteo não tinha o dado.
export interface RealHistoryPoint {
  date: string
  temperature: number | null
  precipitation: number | null
  humidity: number | null
  windSpeed: number | null
}

// Mesmo formato de backend/src/types.ts -> WeatherHistoryResponse.
export interface RealHistoryResponse {
  period: HistoryPeriod
  aggregation: HistoryAggregation
  points: RealHistoryPoint[]
  source: 'open-meteo'
  cached: boolean
}

export type HistoryApiState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

export async function fetchRealHistory(period: HistoryPeriod): Promise<RealHistoryResponse> {
  const params = new URLSearchParams({ period })
  const response = await fetch(`/api/history?${params.toString()}`)

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `Backend respondeu com status ${response.status}`)
  }

  return response.json()
}
