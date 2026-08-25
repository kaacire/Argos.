import type { ServerResponse } from 'node:http'
import { sendJson, errorToStatus } from '../lib/http.js'
import { getRiverLevelForCoords, getRiverLevelForStation } from '../services/riverService.js'
import { SENTO_SE_COORDS } from '../config.js'

// GET /api/rivers
// GET /api/rivers?lat=<number>&lng=<number>
// GET /api/rivers?stationId=<USGS monitoring_location_id>
//
// `stationId` tem prioridade sobre lat/lng se ambos forem informados. Se
// nenhum parâmetro for informado, usa SENTO_SE_COORDS (mesmo default de
// /api/weather, /api/history).
//
// Fonte: ANA (Agência Nacional de Águas), webservice legado - ver
// backend/src/services/riverService.ts para o histórico da troca (era USGS
// Water Data, só EUA) e os avisos importantes sobre esta integração.
//
// Resposta 200: RiverLevelResponse (ver src/types.ts) - inclui o caso
// `{ status: 'no-data', data: null }`, que NÃO é um erro: significa que a
// ANA não tem nenhuma estação/observação disponível para a coordenada ou
// estação pedida.
// Resposta 400: coordenadas inválidas ou stationId vazio
// Resposta 502: webservice da ANA indisponível, timeout ou resposta inesperada
// Resposta 500: erro interno (ex: PostgreSQL indisponível)
export async function handleRivers(res: ServerResponse, searchParams: URLSearchParams) {
  const stationId = searchParams.get('stationId')

  try {
    if (stationId !== null) {
      const result = await getRiverLevelForStation(stationId)
      sendJson(res, 200, result)
      return
    }

    const latParam = searchParams.get('lat')
    const lngParam = searchParams.get('lng')

    const lat = latParam !== null ? Number(latParam) : SENTO_SE_COORDS[0]
    const lng = lngParam !== null ? Number(lngParam) : SENTO_SE_COORDS[1]

    const result = await getRiverLevelForCoords(lat, lng)
    sendJson(res, 200, result)
  } catch (err) {
    const { status, message } = errorToStatus(err)
    sendJson(res, status, { error: message })
  }
}
