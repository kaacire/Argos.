// GeoJSON simplificado retornado pelo ArcGIS REST (`f=geojson`) - mesma
// forma de FeatureCollection do resto do projeto, só que vindo de um
// serviço Esri em vez de um OGC API Features.
export interface ArcGisMovimentoMassaProperties {
  municipio?: string | null
  uf?: string | null
  classe?: string | null
  [key: string]: unknown
}

export interface ArcGisGeoJsonFeature {
  type: 'Feature'
  geometry: unknown
  properties: ArcGisMovimentoMassaProperties
}

export interface ArcGisGeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: ArcGisGeoJsonFeature[]
}
