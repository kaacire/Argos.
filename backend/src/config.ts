// Configuração central do backend. Lê variáveis de ambiente e reaproveita
// a coordenada de teste já existente no frontend (mockData.ts), conforme
// exigido: "NÃO invente novas coordenadas se as coordenadas existentes
// puderem ser reutilizadas."

export const PORT = Number(process.env.PORT ?? 3001)

export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

export const WEATHER_CACHE_MINUTES = Number(process.env.WEATHER_CACHE_MINUTES ?? 15)

// Mesma coordenada de src/data/mockData.ts (SENTO_SE_COORDS).
// Mantida em [lat, lng], igual ao frontend.
export const SENTO_SE_COORDS: [number, number] = [-9.7436, -42.2564]
export const SENTO_SE_CITY = 'Sento Sé'
export const SENTO_SE_STATE = 'BA'

export const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast'
