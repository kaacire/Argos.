// -----------------------------------------------------------------------
// FLUXO (mesma arquitetura de weatherService.ts / historyService.ts):
//
//   ANA - webservice legado (telemetriaws1.ana.gov.br/ServiceANA.asmx)
//        -> integrations/external/ana-hidro                (chamada HTTP
//           real, GET simples, sem necessidade de cadastro/token)
//        -> findNearestStation / findObservationForStation  (busca + escolha
//           da leitura mais recente, sem inventar valor)
//        -> PostgreSQL (Prisma, RiverObservation)           (cache de leitura)
//        -> getRiverLevelForCoords / getRiverLevelForStation
//        -> rota GET /api/rivers
//
// TROCA DE FONTE (ver histórico do projeto): esta rota usava a USGS Water
// Data, que só cobre estações dos EUA - para Sento Sé (BA) e qualquer
// outra coordenada brasileira, sempre voltava `no-data`. A ANA (Agência
// Nacional de Águas) é a fonte equivalente para o Brasil.
//
// AVISO IMPORTANTE sobre esta integração (ler antes de mexer):
// O webservice legado da ANA usado aqui não exige cadastro (diferente da
// HidroWebService nova, que exige e-mail + aprovação manual da ANA), mas:
//   - a própria ANA marca esse serviço como tecnologicamente defasado e já
//     avisou os usuários para migrar (sem data de desligamento confirmada
//     no momento em que este código foi escrito);
//   - não foi possível confirmar os nomes EXATOS das colunas retornadas
//     por HidroInventario/HidroSerieHistorica a partir deste ambiente (a
//     chamada real não pôde ser testada aqui - ver
//     integrations/external/ana-hidro/xml.ts para o porquê e a estratégia
//     defensiva usada no parser).
//   - a ANA não tem um parâmetro de busca por bbox/lat-lng como a USGS
//     tinha; a aproximação usada aqui é filtrar por estado brasileiro
//     (ver services/brazilStates.ts) e por tipo de estação (fluviométrica).
// Se, na prática, a resposta real vier com nomes de coluna diferentes dos
// previstos, o resultado é `no-data` (nunca um valor inventado) - não um
// erro 500 nem um crash. Se isso acontecer, o próximo passo é capturar uma
// resposta real (`curl` no endpoint) e ajustar as listas de candidatos em
// ana-hidro/xml.ts e os nomes usados abaixo.
// -----------------------------------------------------------------------

import { prisma } from '../db.js'
import { RIVER_CACHE_MINUTES } from '../config.js'
import { InvalidParameterError, UpstreamUnavailableError, type RiverLevelResponse, type RiverObservationData } from '../types.js'
import { validateCoords } from './weatherService.js'
import { findBrazilStateForCoords } from './brazilStates.js'
import { fetchAnaHidroInventario, fetchAnaHidroSerieHistorica, pickField, pickNumberField } from '../integrations/external/ana-hidro/index.js'
import type { AnaXmlRow } from '../integrations/external/ana-hidro/index.js'
import type { RiverObservation as RiverObservationRow } from '@prisma/client'

const ANA_TIMEOUT_LABEL = 'webservice legado da ANA'

async function safeAnaCall<T>(promise: Promise<T>, label: string): Promise<T> {
  try {
    return await promise
  } catch (err) {
    throw new UpstreamUnavailableError(
      `Falha ao consultar ${label} (${ANA_TIMEOUT_LABEL}): ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

// -----------------------------------------------------------------------
// Busca de estação + observação (dados reais, nunca inventados)
// -----------------------------------------------------------------------

function distanceSquared(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat1 - lat2
  const dLng = lng1 - lng2
  return dLat * dLat + dLng * dLng
}

interface AnaStationCandidate {
  stationId: string
  stationName: string | null
  latitude: number | null
  longitude: number | null
}

const STATION_CODE_CANDIDATES = ['Codigo', 'CodEstacao', 'EstacaoCodigo', 'codigoestacao']
const STATION_NAME_CANDIDATES = ['Nome', 'NomeEstacao', 'EstacaoNome']
const STATION_NAME_EXCLUDE = ['bacia', 'subbacia', 'rio', 'estado', 'municipio', 'responsavel', 'operadora']
const LATITUDE_CANDIDATES = ['Latitude']
const LONGITUDE_CANDIDATES = ['Longitude']

function rowToCandidate(row: AnaXmlRow): AnaStationCandidate | null {
  const stationId = pickField(row, STATION_CODE_CANDIDATES, ['bacia', 'subbacia', 'rio', 'estado', 'municipio', 'responsavel', 'operadora'])
  if (!stationId) return null

  return {
    stationId,
    stationName: pickField(row, STATION_NAME_CANDIDATES, STATION_NAME_EXCLUDE),
    latitude: pickNumberField(row, LATITUDE_CANDIDATES),
    longitude: pickNumberField(row, LONGITUDE_CANDIDATES),
  }
}

// Procura a estação fluviométrica da ANA mais próxima de [lat, lng].
// Como a ANA não tem busca por bbox, filtra por estado brasileiro
// (aproximado a partir da coordenada) e tipo "fluviométrica" (tpEst=1),
// e escolhe a mais próxima entre as candidatas que vieram com
// latitude/longitude preenchidas. Retorna `null` (não um valor
// inventado) se a busca não trouxer nenhuma estação utilizável - o caso
// esperado quando a coordenada não tem estação da rede ANA por perto.
async function findNearestStation(lat: number, lng: number): Promise<AnaStationCandidate | null> {
  const nmEstado = findBrazilStateForCoords(lat, lng) ?? undefined

  const rows = await safeAnaCall(
    fetchAnaHidroInventario({ tpEst: '1', nmEstado }),
    'inventário de estações (HidroInventario)'
  )

  const candidates = rows
    .map(rowToCandidate)
    .filter((c): c is AnaStationCandidate => c !== null)

  const withCoords = candidates.filter((c) => c.latitude !== null && c.longitude !== null)
  if (withCoords.length === 0) return null

  let nearest = withCoords[0]
  let nearestDist = distanceSquared(lat, lng, nearest.latitude!, nearest.longitude!)

  for (const candidate of withCoords.slice(1)) {
    const dist = distanceSquared(lat, lng, candidate.latitude!, candidate.longitude!)
    if (dist < nearestDist) {
      nearest = candidate
      nearestDist = dist
    }
  }

  return nearest
}

interface RawObservation {
  value: number
  observedAt: string
}

// Formato clássico do HIDRO: cada linha de HidroSerieHistorica é um MÊS,
// com uma coluna por dia (Cota01..Cota31) para o tipoDados pedido - não
// uma leitura por linha. Procura a leitura mais recente com valor
// preenchido entre as linhas retornadas (já vêm ordenadas por data pela
// ANA; para garantir, olha da última linha para a primeira).
function extractLatestFromMonthlyGrid(rows: AnaXmlRow[]): RawObservation | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i]
    const monthStart = pickField(row, ['Data', 'DataHora', 'DataMedicao'])
    if (!monthStart) continue

    const baseDate = new Date(monthStart)
    if (Number.isNaN(baseDate.getTime())) continue

    for (let day = 31; day >= 1; day--) {
      const dayColumn = `Cota${String(day).padStart(2, '0')}`
      const value = pickNumberField(row, [dayColumn])
      if (value === null) continue

      const observedAt = new Date(baseDate.getFullYear(), baseDate.getMonth(), day)
      if (Number.isNaN(observedAt.getTime())) continue

      return { value, observedAt: observedAt.toISOString() }
    }
  }
  return null
}

// Segunda estratégia, para o caso de a resposta vir no formato "uma
// leitura por linha" (ex.: feed telemétrico) em vez da grade mensal
// clássica - tenta achar uma coluna de valor de cota e uma de data
// diretamente em cada linha, começando pela mais recente.
function extractLatestFromFlatRows(rows: AnaXmlRow[]): RawObservation | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i]
    const value = pickNumberField(row, ['Cota', 'Nivel', 'Valor'])
    const observedAtRaw = pickField(row, ['DataHora', 'Data'])
    if (value === null || !observedAtRaw) continue

    const observedAt = new Date(observedAtRaw)
    if (Number.isNaN(observedAt.getTime())) continue

    return { value, observedAt: observedAt.toISOString() }
  }
  return null
}

// Busca a leitura de cota (nível) mais recente de uma estação. Retorna
// `null` (não um valor inventado) se a estação não tiver observação
// disponível, ou se o formato retornado não bater com nenhuma das
// estratégias de leitura conhecidas (ver aviso no topo do arquivo).
async function findObservationForStation(stationId: string): Promise<RawObservation | null> {
  const rows = await safeAnaCall(
    fetchAnaHidroSerieHistorica({ codEstacao: stationId, tipoDados: '1', nivelConsistencia: '1' }),
    'série histórica da estação (HidroSerieHistorica)'
  )
  if (rows.length === 0) return null

  return extractLatestFromMonthlyGrid(rows) ?? extractLatestFromFlatRows(rows)
}

// -----------------------------------------------------------------------
// Cache (PostgreSQL via Prisma) - mesmo padrão de weatherService.ts.
// Persiste tanto o resultado "ok" quanto o "no-data", para não repetir a
// mesma busca sem resultado a cada requisição.
// -----------------------------------------------------------------------

function rowToResponse(row: RiverObservationRow, cached: boolean): RiverLevelResponse {
  if (row.status !== 'ok' || row.value === null || row.parameterCode === null || row.observedAt === null) {
    return { status: 'no-data', data: null }
  }

  const data: RiverObservationData = {
    stationId: row.stationId ?? '',
    stationName: row.stationName,
    latitude: row.latitude,
    longitude: row.longitude,
    parameterCode: row.parameterCode,
    parameterName: row.parameterName,
    value: row.value,
    unit: row.unit,
    observedAt: row.observedAt.toISOString(),
    source: 'ana-hidro',
    cached,
  }

  return { status: 'ok', data }
}

interface PersistCoords {
  latitude?: number | null
  longitude?: number | null
}

interface PersistStation {
  stationId?: string | null
  stationName?: string | null
}

async function persistNoData(coords: PersistCoords, station: PersistStation = {}): Promise<RiverObservationRow> {
  return prisma.riverObservation.create({
    data: {
      latitude: coords.latitude ?? null,
      longitude: coords.longitude ?? null,
      stationId: station.stationId ?? null,
      stationName: station.stationName ?? null,
      status: 'no-data',
      source: 'ana-hidro',
    },
  })
}

async function persistObservation(
  coords: PersistCoords,
  station: Required<PersistStation>,
  observation: RawObservation
): Promise<RiverObservationRow> {
  return prisma.riverObservation.create({
    data: {
      latitude: coords.latitude ?? null,
      longitude: coords.longitude ?? null,
      stationId: station.stationId,
      stationName: station.stationName,
      parameterCode: '1', // tipoDados=1 (Cotas) da ANA
      parameterName: 'Cota (nível da régua)',
      value: observation.value,
      unit: 'cm',
      observedAt: new Date(observation.observedAt),
      status: 'ok',
      source: 'ana-hidro',
    },
  })
}

// Ponto de entrada usado pela rota quando lat/lng são informados (ou o
// default SENTO_SE_COORDS). Ver README/comentário no topo do arquivo para
// o fluxo completo.
export async function getRiverLevelForCoords(lat: number, lng: number): Promise<RiverLevelResponse> {
  validateCoords(lat, lng)

  const cacheThreshold = new Date(Date.now() - RIVER_CACHE_MINUTES * 60_000)
  const cached = await prisma.riverObservation.findFirst({
    where: { latitude: lat, longitude: lng, fetchedAt: { gte: cacheThreshold } },
    orderBy: { fetchedAt: 'desc' },
  })
  if (cached) return rowToResponse(cached, true)

  const station = await findNearestStation(lat, lng)
  if (!station) {
    const row = await persistNoData({ latitude: lat, longitude: lng })
    return rowToResponse(row, false)
  }

  const observation = await findObservationForStation(station.stationId)
  if (!observation) {
    const row = await persistNoData(
      { latitude: lat, longitude: lng },
      { stationId: station.stationId, stationName: station.stationName }
    )
    return rowToResponse(row, false)
  }

  const row = await persistObservation(
    { latitude: lat, longitude: lng },
    { stationId: station.stationId, stationName: station.stationName },
    observation
  )
  return rowToResponse(row, false)
}

// Ponto de entrada usado pela rota quando stationId é informado
// diretamente (GET /api/rivers?stationId=...) - pula a busca por
// proximidade e consulta a estação exata.
export async function getRiverLevelForStation(stationIdParam: string): Promise<RiverLevelResponse> {
  const stationId = stationIdParam.trim()
  if (!stationId) {
    throw new InvalidParameterError('stationId não pode ser vazio.')
  }

  const cacheThreshold = new Date(Date.now() - RIVER_CACHE_MINUTES * 60_000)
  const cached = await prisma.riverObservation.findFirst({
    where: { stationId, fetchedAt: { gte: cacheThreshold } },
    orderBy: { fetchedAt: 'desc' },
  })
  if (cached) return rowToResponse(cached, true)

  const inventoryRows = await safeAnaCall(
    fetchAnaHidroInventario({ codEstDE: stationId, codEstATE: stationId }),
    'inventário de estações (HidroInventario)'
  )
  const stationInfo = inventoryRows.map(rowToCandidate).find((c) => c?.stationId === stationId) ?? null

  const observation = await findObservationForStation(stationId)
  if (!observation) {
    const row = await persistNoData(
      { latitude: stationInfo?.latitude ?? null, longitude: stationInfo?.longitude ?? null },
      { stationId, stationName: stationInfo?.stationName ?? null }
    )
    return rowToResponse(row, false)
  }

  const row = await persistObservation(
    { latitude: stationInfo?.latitude ?? null, longitude: stationInfo?.longitude ?? null },
    { stationId, stationName: stationInfo?.stationName ?? null },
    observation
  )
  return rowToResponse(row, false)
}
