import type { UsgsWaterFeatureCollection, UsgsWaterMonitoringLocationProperties, UsgsWaterObservationProperties } from './types.js'

export const USGS_WATER_BASE_URL = 'https://api.waterdata.usgs.gov'
export const USGS_WATER_OGCAPI_BASE_URL = `${USGS_WATER_BASE_URL}/ogcapi/v0`
export const USGS_WATER_COLLECTIONS = {
  latestContinuous: `${USGS_WATER_OGCAPI_BASE_URL}/collections/latest-continuous/items`,
  continuous: `${USGS_WATER_OGCAPI_BASE_URL}/collections/continuous/items`,
  latestDaily: `${USGS_WATER_OGCAPI_BASE_URL}/collections/latest-daily/items`,
  daily: `${USGS_WATER_OGCAPI_BASE_URL}/collections/daily/items`,
  monitoringLocations: `${USGS_WATER_OGCAPI_BASE_URL}/collections/monitoring-locations/items`,
  timeSeriesMetadata: `${USGS_WATER_OGCAPI_BASE_URL}/collections/time-series-metadata/items`,
} as const
export interface UsgsWaterQuery { limit?: number; offset?: number; monitoring_location_id?: string; parameter_code?: string; statistic_id?: string; datetime?: string; state_name?: string; bbox?: string; api_key?: string; [key: string]: string | number | undefined }
function assertHttpResponse(response: Response, source: string): void { if (!response.ok) throw new Error(`${source}: HTTP ${response.status} ${response.statusText}`) }
async function readJson<T>(response: Response, source: string): Promise<T> { assertHttpResponse(response, source); try { return await response.json() as T } catch { throw new Error(`${source}: resposta JSON inválida.`) } }
async function fetchCollection<TProperties>(endpoint: string, query: UsgsWaterQuery = {}): Promise<UsgsWaterFeatureCollection<TProperties>> {
  const url = new URL(endpoint); url.searchParams.set('f', 'json')
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined) url.searchParams.set(key, String(value)) })
  const data = await readJson<UsgsWaterFeatureCollection<TProperties>>(await fetch(url), 'USGS Water Data')
  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('USGS Water Data: resposta GeoJSON inválida.')
  return data
}
export const fetchUsgsWaterLatestContinuous = (query: UsgsWaterQuery = {}) => fetchCollection<UsgsWaterObservationProperties>(USGS_WATER_COLLECTIONS.latestContinuous, query)
export const fetchUsgsWaterContinuous = (query: UsgsWaterQuery = {}) => fetchCollection<UsgsWaterObservationProperties>(USGS_WATER_COLLECTIONS.continuous, query)
export const fetchUsgsWaterLatestDaily = (query: UsgsWaterQuery = {}) => fetchCollection<UsgsWaterObservationProperties>(USGS_WATER_COLLECTIONS.latestDaily, query)
export const fetchUsgsWaterDaily = (query: UsgsWaterQuery = {}) => fetchCollection<UsgsWaterObservationProperties>(USGS_WATER_COLLECTIONS.daily, query)
export const fetchUsgsWaterMonitoringLocations = (query: UsgsWaterQuery = {}) => fetchCollection<UsgsWaterMonitoringLocationProperties>(USGS_WATER_COLLECTIONS.monitoringLocations, query)
export const fetchUsgsWaterTimeSeriesMetadata = (query: UsgsWaterQuery = {}) => fetchCollection<Record<string, unknown>>(USGS_WATER_COLLECTIONS.timeSeriesMetadata, query)
