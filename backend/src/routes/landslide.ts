import type { ServerResponse } from 'node:http'
import { sendJson, errorToStatus } from '../lib/http.js'
import { getLandslideSusceptibilityForCoords } from '../services/landslideService.js'
import { SENTO_SE_COORDS } from '../config.js'

// GET /api/landslide-susceptibility
// GET /api/landslide-susceptibility?lat=<number>&lng=<number>
//
// Sem parâmetros, usa SENTO_SE_COORDS (mesmo default de /api/weather,
// /api/rivers, /api/history).
//
// Fonte: SGB/CPRM (Serviço Geológico do Brasil), OGC API - coleção
// "Suscetibilidade a Movimento de Massa" (geoservicos.sgb.gov.br/ogcapi) -
// ver backend/src/services/landslideService.ts para o fluxo completo e o
// porquê da escolha desta fonte.
//
// Resposta 200: LandslideSusceptibilityResponse (ver src/types.ts) -
// inclui o caso `{ status: 'no-data', data: null }`, que NÃO é um erro:
// significa que o SGB ainda não publicou carta de suscetibilidade para o
// município da coordenada pedida (cobertura nacional parcial, cerca de
// 700 municípios no momento em que esta integração foi escrita).
// Resposta 400: coordenadas inválidas
// Resposta 502: OGC API do SGB/CPRM indisponível, timeout ou resposta inesperada
// Resposta 500: erro interno (ex: PostgreSQL indisponível)
export async function handleLandslide(res: ServerResponse, searchParams: URLSearchParams) {
  try {
    const latParam = searchParams.get('lat')
    const lngParam = searchParams.get('lng')

    const lat = latParam !== null ? Number(latParam) : SENTO_SE_COORDS[0]
    const lng = lngParam !== null ? Number(lngParam) : SENTO_SE_COORDS[1]

    const result = await getLandslideSusceptibilityForCoords(lat, lng)
    sendJson(res, 200, result)
  } catch (err) {
    const { status, message } = errorToStatus(err)
    sendJson(res, status, { error: message })
  }
}
