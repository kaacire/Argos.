// Serviço ArcGIS REST (Esri) da CPRM/SGB - NÃO é o mesmo webservice do
// módulo `cprm/` (aquele é OGC API Features / pygeoapi, em
// geoservicos.sgb.gov.br/ogcapi). Esse aqui foi escolhido depois de
// confirmar, em teste manual, que a coleção OGC API "Suscetibilidade a
// Movimento de Massa" está retornando 0 features mesmo em regiões de alto
// risco conhecido (ex: Serra Fluminense) - ver histórico do projeto em
// services/landslideService.ts. Este serviço ArcGIS é o backend real por
// trás do mapa público da CPRM e tem dados confirmados (campo `classe`
// com valores como "Alta").
import type { ArcGisGeoJsonFeatureCollection } from './types.js'

// CPRM foi renomeada para SGB (Serviço Geológico do Brasil) e o domínio
// migrou de geoportal.cprm.gov.br para geoportal.sgb.gov.br. O certificado
// TLS do servidor só reconhece o novo host - usar o domínio antigo causa
// falha de handshake ("Hostname/IP does not match certificate's altnames").
export const CPRM_ARCGIS_BASE_URL = 'https://geoportal.sgb.gov.br/server/rest/services'
export const MOVIMENTO_MASSA_LAYER_URL = `${CPRM_ARCGIS_BASE_URL}/gestaoterritorial/movimento_massa/MapServer/0`

export interface MovimentoMassaBboxQuery {
  minLongitude: number
  minLatitude: number
  maxLongitude: number
  maxLatitude: number
}

function assertHttpResponse(response: Response, source: string): void {
  if (!response.ok) throw new Error(`${source}: HTTP ${response.status} ${response.statusText}`)
}

async function readJson<T>(response: Response, source: string): Promise<T> {
  assertHttpResponse(response, source)
  try {
    return await response.json() as T
  } catch {
    throw new Error(`${source}: resposta JSON inválida.`)
  }
}

function validateFeatureCollection(data: ArcGisGeoJsonFeatureCollection): ArcGisGeoJsonFeatureCollection {
  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error('CPRM ArcGIS (movimento_massa): resposta GeoJSON inválida.')
  }
  return data
}

// Consulta a camada "Movimento de Massa Área" por bounding box (lat/lng em
// WGS84 / EPSG:4326 - o ArcGIS REST reprojeta a partir da referência
// nativa do serviço, EPSG:3857, via os parâmetros inSR/outSR abaixo, então
// quem chama esta função nunca precisa lidar com Web Mercator).
export async function queryMovimentoMassaByBbox(bbox: MovimentoMassaBboxQuery): Promise<ArcGisGeoJsonFeatureCollection> {
  const url = new URL(`${MOVIMENTO_MASSA_LAYER_URL}/query`)
  url.searchParams.set('f', 'geojson')
  url.searchParams.set('geometry', `${bbox.minLongitude},${bbox.minLatitude},${bbox.maxLongitude},${bbox.maxLatitude}`)
  url.searchParams.set('geometryType', 'esriGeometryEnvelope')
  url.searchParams.set('inSR', '4326')
  url.searchParams.set('outSR', '4326')
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects')
  url.searchParams.set('outFields', 'municipio,uf,classe')
  // returnGeometry=true: a camada "Movimento de Massa Área" É um polígono
  // (área de suscetibilidade mapeada), não um ponto. Antes esta consulta
  // pedia returnGeometry=false e o frontend desenhava um círculo genérico
  // em torno de um ponto fixo no lugar da forma real - descartando dado
  // espacial que a própria API sempre teve disponível. Corrigido para usar
  // a geometria real (polígono, em WGS84 via outSR=4326 acima).
  url.searchParams.set('returnGeometry', 'true')

  return validateFeatureCollection(await readJson<ArcGisGeoJsonFeatureCollection>(await fetch(url), 'CPRM ArcGIS (movimento_massa)'))
}
