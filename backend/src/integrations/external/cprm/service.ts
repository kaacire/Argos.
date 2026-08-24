import type { CprmCollectionInfo, CprmCollectionsResponse, CprmFeatureCollection } from './types.js'

export const CPRM_BASE_URL = 'https://geoservicos.sgb.gov.br/ogcapi'
export const CPRM_COLLECTIONS_ENDPOINT = `${CPRM_BASE_URL}/collections`
export const CPRM_CONFORMANCE_ENDPOINT = `${CPRM_BASE_URL}/conformance`
export const CPRM_OPENAPI_ENDPOINT = `${CPRM_BASE_URL}/api`
function assertHttpResponse(response: Response, source: string): void { if (!response.ok) throw new Error(`${source}: HTTP ${response.status} ${response.statusText}`) }
async function readJson<T>(response: Response, source: string): Promise<T> { assertHttpResponse(response, source); try { return await response.json() as T } catch { throw new Error(`${source}: resposta JSON inválida.`) } }
export async function fetchCprmCollections(): Promise<CprmCollectionsResponse> {
  const url = new URL(CPRM_COLLECTIONS_ENDPOINT); url.searchParams.set('f', 'json')
  const data = await readJson<CprmCollectionsResponse>(await fetch(url), 'CPRM Collections')
  if (!Array.isArray(data.collections)) throw new Error('CPRM Collections: resposta inválida.')
  return data
}
export async function fetchCprmCollection(collectionId: string): Promise<CprmCollectionInfo> {
  if (!collectionId.trim()) throw new Error('CPRM: collectionId é obrigatório.')
  const url = new URL(`${CPRM_COLLECTIONS_ENDPOINT}/${encodeURIComponent(collectionId)}`); url.searchParams.set('f', 'json')
  return readJson<CprmCollectionInfo>(await fetch(url), 'CPRM Collection')
}
export async function fetchCprmCollectionItems<TProperties = Record<string, unknown>>(collectionId: string, query: Record<string, string | number | undefined> = {}): Promise<CprmFeatureCollection<TProperties>> {
  if (!collectionId.trim()) throw new Error('CPRM: collectionId é obrigatório.')
  const url = new URL(`${CPRM_COLLECTIONS_ENDPOINT}/${encodeURIComponent(collectionId)}/items`); url.searchParams.set('f', 'json')
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined) url.searchParams.set(key, String(value)) })
  const data = await readJson<CprmFeatureCollection<TProperties>>(await fetch(url), 'CPRM Collection Items')
  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('CPRM Collection Items: resposta GeoJSON inválida.')
  return data
}
