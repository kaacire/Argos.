import type { ServerResponse } from 'node:http'
import { sendJson, errorToStatus } from '../lib/http.js'
import { getEarthquakes, DEFAULT_EARTHQUAKE_QUERY } from '../services/earthquakeService.js'

// GET /api/earthquakes
// GET /api/earthquakes?minlatitude=&maxlatitude=&minlongitude=&maxlongitude=&minmagnitude=&days=
//
// Sem parâmetros, usa DEFAULT_EARTHQUAKE_QUERY: bbox restrito à região de
// Sento Sé/BA (SENTO_SE_BBOX, config.ts) - simplificação temporária
// enquanto o app não tem uma forma consistente de mostrar dados
// nacionais num mapa com zoom/centro fixo em uma cidade. Continua
// possível pedir uma área maior via querystring (minlatitude= etc.),
// então nada foi removido - só o padrão mudou.
//
// Fonte: USGS Earthquake Catalog (earthquake.usgs.gov), catálogo GLOBAL -
// ver backend/src/services/earthquakeService.ts para o porquê da escolha
// (não existe hoje uma API pública/estável equivalente da Rede
// Sismográfica Brasileira para consumo programático).
//
// Resposta 200: EarthquakesResponse (ver src/types.ts) - `events: []` é
// uma resposta válida (nenhum sismo na janela pedida), não um erro.
// Resposta 400: bounding box, minmagnitude ou days inválidos
// Resposta 502: catálogo da USGS indisponível, timeout ou resposta inesperada
// Resposta 500: erro interno (ex: PostgreSQL indisponível)
export async function handleEarthquakes(res: ServerResponse, searchParams: URLSearchParams) {
  try {
    const minLatitude = searchParams.has('minlatitude') ? Number(searchParams.get('minlatitude')) : DEFAULT_EARTHQUAKE_QUERY.minLatitude
    const maxLatitude = searchParams.has('maxlatitude') ? Number(searchParams.get('maxlatitude')) : DEFAULT_EARTHQUAKE_QUERY.maxLatitude
    const minLongitude = searchParams.has('minlongitude') ? Number(searchParams.get('minlongitude')) : DEFAULT_EARTHQUAKE_QUERY.minLongitude
    const maxLongitude = searchParams.has('maxlongitude') ? Number(searchParams.get('maxlongitude')) : DEFAULT_EARTHQUAKE_QUERY.maxLongitude
    const minMagnitude = searchParams.has('minmagnitude') ? Number(searchParams.get('minmagnitude')) : DEFAULT_EARTHQUAKE_QUERY.minMagnitude
    const days = searchParams.has('days') ? Number(searchParams.get('days')) : DEFAULT_EARTHQUAKE_QUERY.days

    const result = await getEarthquakes({ minLatitude, maxLatitude, minLongitude, maxLongitude, minMagnitude, days })
    sendJson(res, 200, result)
  } catch (err) {
    const { status, message } = errorToStatus(err)
    sendJson(res, status, { error: message })
  }
}
