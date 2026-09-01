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
// A camada "movimento_massa" (suscetibilidade contínua a deslizamento por
// município) NÃO EXISTE MAIS na estrutura nova do SGB - confirmado
// listando a pasta gestaoterritorial inteira, ela sumiu na migração de
// domínio/reorganização. A candidata mais próxima é "risco"
// ("Setorização de Risco" / "Risco Geológico"), mas é um dado
// estruturalmente diferente: setores de risco mapeados pontualmente pela
// CPRM/Defesa Civil (ex: encostas específicas em áreas urbanas já
// avaliadas em campo), não uma carta contínua de suscetibilidade por
// município. Por isso é esperado que cubra MENOS áreas que antes -
// ausência de dado aqui é ainda mais comum e legítima.
//
// ⚠️ NÃO TESTADO CONTRA UMA RESPOSTA REAL - mapeado só a partir da lista
// de campos que o metadado público do ArcGIS REST expõe
// (.../gestaoterritorial/risco/MapServer/0?f=pjson). O primeiro teste
// real deve ser um curl no /api/landslide-susceptibility local.
export const MOVIMENTO_MASSA_LAYER_URL = `${CPRM_ARCGIS_BASE_URL}/gestaoterritorial/risco/MapServer/0`

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
  // Campos da camada "risco" (gestaoterritorial/risco/MapServer/0) - nomes
  // diferentes da antiga "movimento_massa": munic (não municipio),
  // grau_risco (não classe), mais tipolo_g1/tipolo_e1 (tipologia geral e
  // específica do desastre - usado para filtrar só registros de
  // movimento de massa, já que essa camada cobre vários tipos de risco
  // na mesma tabela) e descricao/local para dar contexto real no popup.
  url.searchParams.set('outFields', 'munic,uf,grau_risco,tipolo_g1,tipolo_e1,descricao,local')
  // returnGeometry=true: a camada "Movimento de Massa Área" É um polígono
  // (área de suscetibilidade mapeada), não um ponto. Antes esta consulta
  // pedia returnGeometry=false e o frontend desenhava um círculo genérico
  // em torno de um ponto fixo no lugar da forma real - descartando dado
  // espacial que a própria API sempre teve disponível. Corrigido para usar
  // a geometria real (polígono, em WGS84 via outSR=4326 acima).
  url.searchParams.set('returnGeometry', 'true')

  return validateFeatureCollection(await readJson<ArcGisGeoJsonFeatureCollection>(await fetch(url), 'CPRM ArcGIS (movimento_massa)'))
}
