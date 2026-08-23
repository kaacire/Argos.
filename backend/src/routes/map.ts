import type { ServerResponse } from 'node:http'
import { sendJson, errorToStatus } from '../lib/http.js'
import { getWeatherForCoords } from '../services/weatherService.js'
import { SENTO_SE_COORDS } from '../config.js'

// GET /api/map
//
// Retorna somente os dados do mapa para os quais existe uma fonte real
// integrada nesta etapa: o clima atual (temperatura, vento, condição) no
// ponto de Sento Sé, vindo da Open-Meteo via weatherService.
//
// A camada "Chuva" também já tem fonte real, mas por endpoint próprio
// (GET /api/rain, routes/rain.ts) - não está incluída aqui para não
// duplicar chamadas à Open-Meteo/Postgres.
//
// As demais camadas do mapa (zonas de risco, ocorrências, abrigos, rios,
// alagamentos, deslizamentos) NÃO têm fonte real integrada ainda e
// continuam vindo do mockData.ts diretamente no frontend - este endpoint
// não as retorna, para não fingir que são dados reais.
export async function handleMap(res: ServerResponse) {
  const [lat, lng] = SENTO_SE_COORDS

  try {
    const weather = await getWeatherForCoords(lat, lng)
    sendJson(res, 200, {
      coords: SENTO_SE_COORDS,
      weather,
      realLayers: ['temperatura', 'ventania', 'chuva'],
      mockLayers: ['zonas', 'alagamentos', 'deslizamentos', 'relatos', 'abrigos', 'rios'],
    })
  } catch (err) {
    const { status, message } = errorToStatus(err)
    sendJson(res, status, { error: message })
  }
}
