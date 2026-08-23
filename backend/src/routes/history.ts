import type { ServerResponse } from 'node:http'
import { sendJson, errorToStatus } from '../lib/http.js'
import { getWeatherHistory } from '../services/historyService.js'
import { SENTO_SE_COORDS } from '../config.js'
import { InvalidParameterError, type HistoryPeriod } from '../types.js'

const VALID_PERIODS: HistoryPeriod[] = ['7d', '3m', '1y']

// GET /api/history?period=<7d|3m|1y>&lat=<number>&lng=<number>
// lat/lng são opcionais (default: SENTO_SE_COORDS, igual aos demais endpoints).
//
// Resposta 200: WeatherHistoryResponse (ver src/types.ts)
// Resposta 400: período ou coordenadas inválidos
// Resposta 502: Historical Weather API indisponível ou resposta inesperada
export async function handleHistory(res: ServerResponse, searchParams: URLSearchParams) {
  const periodParam = searchParams.get('period') ?? '7d'
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')

  const lat = latParam !== null ? Number(latParam) : SENTO_SE_COORDS[0]
  const lng = lngParam !== null ? Number(lngParam) : SENTO_SE_COORDS[1]

  try {
    if (!VALID_PERIODS.includes(periodParam as HistoryPeriod)) {
      throw new InvalidParameterError(`Período inválido: "${periodParam}". Use um de: ${VALID_PERIODS.join(', ')}.`)
    }

    const history = await getWeatherHistory(lat, lng, periodParam as HistoryPeriod)
    sendJson(res, 200, history)
  } catch (err) {
    // ---------------------------------------------------------------
    // DIAGNÓSTICO TEMPORÁRIO — remover depois de identificar a causa do
    // "Erro interno do servidor." Loga a exceção ORIGINAL completa no
    // console do backend (nunca no frontend) antes de mapear para uma
    // mensagem genérica de resposta HTTP.
    // ---------------------------------------------------------------
    console.error('[DIAGNÓSTICO /api/history] Exceção original capturada:')
    console.error('  nome/classe:', err instanceof Error ? err.constructor.name : typeof err)
    console.error('  mensagem:', err instanceof Error ? err.message : String(err))
    console.error('  code:', (err as { code?: unknown })?.code ?? '(sem propriedade code)')
    console.error('  stack:', err instanceof Error ? err.stack : '(sem stack - não é instância de Error)')
    console.error('  objeto completo:', err)
    // ---------------------------------------------------------------

    const { status, message } = errorToStatus(err)
    sendJson(res, status, { error: message })
  }
}
