export type OsrmCoordinate = [longitude: number, latitude: number]

export interface OsrmWaypoint {
  hint?: string
  distance?: number
  name?: string
  location: OsrmCoordinate
  nodes?: number[]
}

export interface OsrmRoute {
  distance: number
  duration: number
  weight?: number
  geometry?: unknown
  legs?: unknown[]
}

export interface OsrmRouteResponse {
  code: string
  message?: string
  routes?: OsrmRoute[]
  waypoints?: OsrmWaypoint[]
}

export interface OsrmTableResponse {
  code: string
  message?: string
  distances?: Array<Array<number | null>>
  durations?: Array<Array<number | null>>
  sources?: OsrmWaypoint[]
  destinations?: OsrmWaypoint[]
}
