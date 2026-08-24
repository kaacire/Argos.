export interface UsgsEarthquakeGeometry {
  type: 'Point'
  coordinates: [longitude: number, latitude: number, depthKm: number]
}
export interface UsgsEarthquakeProperties {
  mag: number | null
  place: string | null
  time: number | null
  updated: number | null
  tz: number | null
  url: string | null
  detail: string | null
  felt: number | null
  cdi: number | null
  mmi: number | null
  alert: string | null
  status: string | null
  tsunami: number
  sig: number
  net: string
  code: string
  ids: string
  sources: string
  types: string
  nst: number | null
  dmin: number | null
  rms: number | null
  gap: number | null
  magType: string | null
  type: string
  title: string
}
export interface UsgsEarthquakeFeature {
  type: 'Feature'
  id: string
  properties: UsgsEarthquakeProperties
  geometry: UsgsEarthquakeGeometry
}
export interface UsgsEarthquakeFeed {
  type: 'FeatureCollection'
  metadata: { generated: number; url: string; title: string; api: string; count: number; status: number }
  features: UsgsEarthquakeFeature[]
  bbox?: number[]
}
