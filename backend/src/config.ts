// Configuração central do backend. Lê variáveis de ambiente e reaproveita
// a coordenada de teste já existente no frontend (mockData.ts), conforme
// exigido: "NÃO invente novas coordenadas se as coordenadas existentes
// puderem ser reutilizadas."

export const PORT = Number(process.env.PORT ?? 3001)

export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

export const WEATHER_CACHE_MINUTES = Number(process.env.WEATHER_CACHE_MINUTES ?? 15)

// Cache da página Histórico (7d/3m/1y). Mais longo que o do clima atual
// porque são dados do passado (não mudam de um minuto para o outro) - só
// precisa ser atualizado algumas vezes por dia para a janela deslizante
// (7d/3m/1y) acompanhar o avanço do "hoje".
export const HISTORY_CACHE_HOURS = Number(process.env.HISTORY_CACHE_HOURS ?? 12)

// Mesma coordenada de src/data/mockData.ts (SENTO_SE_COORDS).
// Mantida em [lat, lng], igual ao frontend.
export const SENTO_SE_COORDS: [number, number] = [-9.7436, -42.2564]
export const SENTO_SE_CITY = 'Sento Sé'
export const SENTO_SE_STATE = 'BA'

// Pontos da camada "Chuva" do mapa - reaproveita EXATAMENTE as mesmas 3
// coordenadas que já existiam como mock em src/data/mockData.ts
// (mapMarkers.chuva), para não inventar geometria nova. Quantidade
// controlada de pontos (3), igual ao mock que está sendo substituído.
export const RAIN_LAYER_POINTS: Array<{ lat: number; lng: number }> = [
  { lat: -9.741, lng: -42.254 },
  { lat: -9.746, lng: -42.258 },
  { lat: -9.738, lng: -42.261 },
]

export const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast'

// Historical Weather API (dados reais do passado, ERA5/IFS) - endpoint
// diferente do forecast acima. Ver services/history/openMeteoHistorySource.ts.
export const OPEN_METEO_ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'
