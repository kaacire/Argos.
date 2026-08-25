import type { ServerResponse } from 'node:http'
import { sendJson, errorToStatus } from '../lib/http.js'
import { getEarthquakes, DEFAULT_EARTHQUAKE_QUERY } from '../services/earthquakeService.js'

// GET /api/earthquakes
// GET /api/earthquakes?minlatitude=&maxlatitude=&minlongitude=&maxlongitude=&minmagnitude=&days=
//
// Sem parâmetros, usa DEFAULT_EARTHQUAKE_QUERY: bounding box do Brasil
// inteiro (BRAZIL_BBOX, config.ts) - não é limitado a Sento Sé como
// /api/weather ou /api/rivers, porque atividade sísmica não é um dado
// "pontual" e este endpoint já nasce pensado para cobrir o país todo
// (ver histórico do projeto: o dado de Sento Sé é o que será expandido
// para nível nacional no futuro).
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
