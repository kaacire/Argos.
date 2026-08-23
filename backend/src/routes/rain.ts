import type { ServerResponse } from 'node:http'
import { sendJson } from '../lib/http.js'
import { getWeatherForCoords } from '../services/weatherService.js'
import { RAIN_LAYER_POINTS } from '../config.js'
import type { RainLayerPoint } from '../types.js'

// GET /api/rain
//
// Camada "Chuva" do mapa: precipitação REAL da Open-Meteo para uma
// quantidade controlada de pontos fixos (RAIN_LAYER_POINTS, config.ts -
// as mesmas 3 coordenadas que já eram usadas como mock).
//
// Reaproveita 100% a integração já existente com a Open-Meteo
// (getWeatherForCoords, o mesmo serviço usado por Temperatura/Ventania),
// então herda o mesmo cache no Postgres (WeatherData) - consultar os
// mesmos 3 pontos repetidamente dentro da janela de cache não gera novas
// chamadas à Open-Meteo.
//
// Cada ponto é buscado de forma independente: se um ponto falhar
// (Open-Meteo fora do ar, coordenada inválida etc.), ele entra na resposta
// com `error`, e não com um valor inventado - os demais pontos que deram
// certo continuam aparecendo normalmente.
export async function handleRain(res: ServerResponse) {
  const points: RainLayerPoint[] = await Promise.all(
    RAIN_LAYER_POINTS.map(async ({ lat, lng }): Promise<RainLayerPoint> => {
      try {
        const weather = await getWeatherForCoords(lat, lng)
        return {
          lat,
          lng,
          precipitation: weather.precipitation,
          condition: weather.condition,
          lastUpdate: weather.lastUpdate,
          cached: weather.cached,
        }
      } catch (err) {
        return {
          lat,
          lng,
          error: err instanceof Error ? err.message : 'Erro desconhecido ao consultar a Open-Meteo.',
        }
      }
    })
  )

  sendJson(res, 200, { points })
}
