import type { UsgsEarthquakeFeed } from './types.js'

export const USGS_EARTHQUAKE_BASE_URL = 'https://earthquake.usgs.gov'
export const USGS_EARTHQUAKE_FEED_BASE_URL = `${USGS_EARTHQUAKE_BASE_URL}/earthquakes/feed/v1.0/summary`
export const USGS_EARTHQUAKE_CATALOG_BASE_URL = `${USGS_EARTHQUAKE_BASE_URL}/fdsnws/event/1`
export const USGS_EARTHQUAKE_FEEDS = {
  allHour: `${USGS_EARTHQUAKE_FEED_BASE_URL}/all_hour.geojson`,
  allDay: `${USGS_EARTHQUAKE_FEED_BASE_URL}/all_day.geojson`,
  allWeek: `${USGS_EARTHQUAKE_FEED_BASE_URL}/all_week.geojson`,
  allMonth: `${USGS_EARTHQUAKE_FEED_BASE_URL}/all_month.geojson`,
} as const

export interface UsgsEarthquakeCatalogQuery {
  starttime?: string; endtime?: string; minmagnitude?: number; maxmagnitude?: number
  minlatitude?: number; maxlatitude?: number; minlongitude?: number; maxlongitude?: number
  latitude?: number; longitude?: number; maxradiuskm?: number; limit?: number
  orderby?: 'time' | 'time-asc' | 'magnitude' | 'magnitude-asc'
}
function assertHttpResponse(response: Response, source: string): void {
  if (!response.ok) throw new Error(`${source}: HTTP ${response.status} ${response.statusText}`)
}
async function readJson<T>(response: Response, source: string): Promise<T> {
  assertHttpResponse(response, source)
  try { return await response.json() as T } catch { throw new Error(`${source}: resposta JSON inválida.`) }
}
function validateFeed(data: UsgsEarthquakeFeed): UsgsEarthquakeFeed {
  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('USGS Earthquake: resposta GeoJSON inválida.')
  return data
}
export async function fetchUsgsEarthquakeFeed(feed: keyof typeof USGS_EARTHQUAKE_FEEDS = 'allDay'): Promise<UsgsEarthquakeFeed> {
  return validateFeed(await readJson<UsgsEarthquakeFeed>(await fetch(USGS_EARTHQUAKE_FEEDS[feed]), 'USGS Earthquake Feed'))
}
export async function queryUsgsEarthquakes(query: UsgsEarthquakeCatalogQuery = {}): Promise<UsgsEarthquakeFeed> {
  const url = new URL(`${USGS_EARTHQUAKE_CATALOG_BASE_URL}/query`)
  url.searchParams.set('format', 'geojson')
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined) url.searchParams.set(key, String(value)) })
  return validateFeed(await readJson<UsgsEarthquakeFeed>(await fetch(url), 'USGS Earthquake Catalog'))
}
