// -----------------------------------------------------------------------
// FLUXO (mesma arquitetura de weatherService.ts / riverService.ts):
//
//   CPRM/SGB - ArcGIS REST (geoportal.cprm.gov.br)
//        -> integrations/external/cprm-movimento-massa (chamada HTTP real,
//           query por bbox na camada "Movimento de Massa Área")
//        -> normalizeFeature                 (GeoJSON -> LandslideSusceptibilityArea)
//        -> PostgreSQL (Prisma, LandslideSusceptibilityCache) (cache de leitura)
//        -> getLandslideSusceptibilityForCoords
//        -> rota GET /api/landslide-susceptibility
//
// Fonte: camada "Movimento de Massa Área" do SGB/CPRM, servida via ArcGIS
// REST (geoportal.cprm.gov.br) - cartografia de suscetibilidade a
// deslizamentos/corridas de massa por município, cobertura NACIONAL mas
// parcial (nem todo município tem carta publicada - para coordenadas sem
// cobertura, a resposta correta é `no-data`, nunca uma classe inventada).
//
// HISTÓRICO: a primeira versão desta integração usava a coleção
// equivalente no OGC API Features do SGB
// (geoservicos.sgb.gov.br/ogcapi/collections/gestao-territorial/
// suscetibilidade/movimento-de-massa). Essa coleção OGC API foi
// descartada depois de um teste manual mostrar 0 features mesmo em bbox
// cobrindo a Serra Fluminense (uma das áreas de maior risco de
// deslizamento do Brasil) - indicando que a coleção está vazia/quebrada
// no serviço OGC API, não que falta cobertura. O serviço ArcGIS REST
// abaixo é o backend real por trás do mapa público da CPRM e tem dados
// confirmados (campo `classe` com valores como "Alta"). Ver também
// services/landslideService.ts no histórico do projeto.
// -----------------------------------------------------------------------

import { prisma } from '../db.js'
import { LANDSLIDE_BBOX_BUFFER_DEGREES, LANDSLIDE_CACHE_MINUTES } from '../config.js'
import { LandslideSusceptibilityArea, LandslideSusceptibilityResponse, UpstreamUnavailableError } from '../types.js'
import { validateCoords } from './weatherService.js'
import { describeError } from '../lib/http.js'
import { queryMovimentoMassaByBbox } from '../integrations/external/cprm-movimento-massa/index.js'
import type { ArcGisGeoJsonFeature } from '../integrations/external/cprm-movimento-massa/index.js'
import type { LandslideSusceptibilityCache as LandslideCacheRow } from '@prisma/client'

// Chamada REAL ao ArcGIS REST do SGB/CPRM, filtrando por bbox ao redor do
// ponto pedido (mesma limitação estrutural do webservice da ANA, resolvida
// ali com filtro por estado: este serviço também não tem busca "mais
// próximo de", só filtro espacial). Nenhum dado é inventado: se a API não
// responder, ou responder algo inesperado, um erro é propagado (ver
// rotas/landslide.ts). Usa describeError() em vez de err.message puro
// porque falhas de rede do fetch nativo (ex: TLS/certificado) escondem o
// motivo real em err.cause - ver lib/http.ts.
async function fetchFromCprm(lat: number, lng: number): Promise<ArcGisGeoJsonFeature[]> {
  try {
    const collection = await queryMovimentoMassaByBbox({
      minLongitude: lng - LANDSLIDE_BBOX_BUFFER_DEGREES,
      minLatitude: lat - LANDSLIDE_BBOX_BUFFER_DEGREES,
      maxLongitude: lng + LANDSLIDE_BBOX_BUFFER_DEGREES,
      maxLatitude: lat + LANDSLIDE_BBOX_BUFFER_DEGREES,
    })
    return collection.features
  } catch (err) {
    throw new UpstreamUnavailableError(
      `Falha ao consultar SGB/CPRM (camada movimento_massa, ArcGIS REST): ${describeError(err)}`
    )
  }
}

function normalizeFeature(feature: ArcGisGeoJsonFeature): LandslideSusceptibilityArea {
  const properties = feature.properties ?? {}
  return {
    municipio: properties.municipio ?? null,
    uf: properties.uf ?? null,
    classe: properties.classe ?? null,
    source: 'cprm-sgb',
  }
}

function rowToResponse(row: LandslideCacheRow, lat: number, lng: number, cached: boolean): LandslideSusceptibilityResponse {
  if (row.status !== 'ok') return { status: 'no-data', data: null }

  return {
    status: 'ok',
    data: {
      latitude: lat,
      longitude: lng,
      areas: (row.areas as unknown as LandslideSusceptibilityArea[]) ?? [],
      source: 'cprm-sgb',
      cached,
    },
  }
}

// Ponto de entrada usado pela rota. Mesmo padrão de cache de leitura de
// weatherService.ts/riverService.ts: se existir um registro recente
// (LANDSLIDE_CACHE_MINUTES) para as mesmas coordenadas, reaproveita em vez
// de bater no SGB/CPRM a cada requisição. Cache mais longo que o de clima
// porque é uma cartografia (não muda de um minuto para o outro).
export async function getLandslideSusceptibilityForCoords(lat: number, lng: number): Promise<LandslideSusceptibilityResponse> {
  validateCoords(lat, lng)

  const cacheThreshold = new Date(Date.now() - LANDSLIDE_CACHE_MINUTES * 60_000)
  const cached = await prisma.landslideSusceptibilityCache.findFirst({
    where: { latitude: lat, longitude: lng, fetchedAt: { gte: cacheThreshold } },
    orderBy: { fetchedAt: 'desc' },
  })
  if (cached) return rowToResponse(cached, lat, lng, true)

  const features = await fetchFromCprm(lat, lng)
  const areas = features.map(normalizeFeature)

  const row = await prisma.landslideSusceptibilityCache.create({
    data: {
      latitude: lat,
      longitude: lng,
      areas: areas as unknown as object,
      status: areas.length > 0 ? 'ok' : 'no-data',
      source: 'cprm-sgb',
    },
  })

  return rowToResponse(row, lat, lng, false)
}
