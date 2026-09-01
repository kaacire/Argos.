// GeoJSON simplificado retornado pelo ArcGIS REST (`f=geojson`) - mesma
// forma de FeatureCollection do resto do projeto, só que vindo de um
// serviço Esri em vez de um OGC API Features.
export interface ArcGisMovimentoMassaProperties {
  munic?: string | null
  uf?: string | null
  grau_risco?: string | null
  tipolo_g1?: string | null
  tipolo_e1?: string | null
  descricao?: string | null
  local?: string | null
  [key: string]: unknown
}

// Geometria real da camada (com returnGeometry=true, outSR=4326): sempre
// Polygon ou MultiPolygon em GeoJSON padrão ([lng, lat] por vértice).
// Tipagem mínima local (não depende do pacote @types/geojson) - só o
// suficiente para passar direto pro <GeoJSON> do react-leaflet no frontend
// sem reinterpretar/transformar coordenadas.
export type ArcGisMovimentoMassaGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] }

export interface ArcGisGeoJsonFeature {
  type: 'Feature'
  geometry: ArcGisMovimentoMassaGeometry | null
  properties: ArcGisMovimentoMassaProperties
}

export interface ArcGisGeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: ArcGisGeoJsonFeature[]
}
