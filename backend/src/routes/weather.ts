import type { ServerResponse } from 'node:http'
import { sendJson, errorToStatus } from '../lib/http.js'
import { getWeatherForCoords } from '../services/weatherService.js'
import { SENTO_SE_COORDS } from '../config.js'

// GET /api/weather?lat=<number>&lng=<number>
// Se lat/lng não forem informados, usa SENTO_SE_COORDS (localização de teste
// principal do projeto, reaproveitada de mockData.ts).
//
// Resposta 200: ArgosWeatherModel (ver src/types.ts)
// Resposta 400: coordenadas inválidas
// Resposta 502: Open-Meteo indisponível ou respondeu algo inesperado
// Resposta 500: erro interno (ex: PostgreSQL indisponível)
export async function handleWeather(res: ServerResponse, searchParams: URLSearchParams) {
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')

  const lat = latParam !== null ? Number(latParam) : SENTO_SE_COORDS[0]
  const lng = lngParam !== null ? Number(lngParam) : SENTO_SE_COORDS[1]

  try {
    const weather = await getWeatherForCoords(lat, lng)
    sendJson(res, 200, weather)
  } catch (err) {
    const { status, message } = errorToStatus(err)
    sendJson(res, status, { error: message })
  }
}
