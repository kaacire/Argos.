import type { OsrmCoordinate, OsrmRouteResponse, OsrmTableResponse } from './types.js'

export const OSRM_BASE_URL = 'https://router.project-osrm.org'
export const OSRM_API_VERSION = 'v1'
export const OSRM_DEFAULT_PROFILE = 'driving'

export interface OsrmRouteOptions {
  alternatives?: boolean | number
  steps?: boolean
  geometries?: 'polyline' | 'polyline6' | 'geojson'
  overview?: 'full' | 'simplified' | false
  annotations?: boolean
}

export interface OsrmTableOptions {
  sources?: number[] | 'all'
  destinations?: number[] | 'all'
  annotations?: 'duration' | 'distance' | 'duration,distance'
}

function assertHttpResponse(response: Response, source: string): void {
  if (!response.ok) throw new Error(`${source}: HTTP ${response.status} ${response.statusText}`)
}

async function readJson<T>(response: Response, source: string): Promise<T> {
  assertHttpResponse(response, source)
  try { return await response.json() as T } catch { throw new Error(`${source}: resposta JSON inválida.`) }
}

function coordinatesPath(coordinates: OsrmCoordinate[]): string {
  if (coordinates.length < 2) throw new Error('OSRM: são necessárias pelo menos duas coordenadas.')
  return coordinates.map(([longitude, latitude]) => `${longitude},${latitude}`).join(';')
}

export async function fetchOsrmRoute(coordinates: OsrmCoordinate[], options: OsrmRouteOptions = {}, profile = OSRM_DEFAULT_PROFILE): Promise<OsrmRouteResponse> {
  const url = new URL(`${OSRM_BASE_URL}/route/${OSRM_API_VERSION}/${profile}/${coordinatesPath(coordinates)}`)
  Object.entries(options).forEach(([key, value]) => { if (value !== undefined) url.searchParams.set(key, String(value)) })
  const data = await readJson<OsrmRouteResponse>(await fetch(url), 'OSRM Route')
  if (!data.code) throw new Error('OSRM Route: resposta sem código.')
  return data
}

export async function fetchOsrmTable(coordinates: OsrmCoordinate[], options: OsrmTableOptions = {}, profile = OSRM_DEFAULT_PROFILE): Promise<OsrmTableResponse> {
  const url = new URL(`${OSRM_BASE_URL}/table/${OSRM_API_VERSION}/${profile}/${coordinatesPath(coordinates)}`)
  if (options.sources) url.searchParams.set('sources', options.sources === 'all' ? 'all' : options.sources.join(';'))
  if (options.destinations) url.searchParams.set('destinations', options.destinations === 'all' ? 'all' : options.destinations.join(';'))
  if (options.annotations) url.searchParams.set('annotations', options.annotations)
  const data = await readJson<OsrmTableResponse>(await fetch(url), 'OSRM Table')
  if (!data.code) throw new Error('OSRM Table: resposta sem código.')
  return data
}
