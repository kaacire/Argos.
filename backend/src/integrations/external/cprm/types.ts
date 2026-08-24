export interface CprmGeoJsonGeometry { type: string; coordinates: unknown }
export interface CprmGeoJsonFeature<TProperties = Record<string, unknown>> { type: 'Feature'; id?: string | number; geometry: CprmGeoJsonGeometry | null; properties: TProperties }
export interface CprmFeatureCollection<TProperties = Record<string, unknown>> { type: 'FeatureCollection'; features: CprmGeoJsonFeature<TProperties>[]; numberMatched?: number; numberReturned?: number; links?: Array<{ href: string; rel?: string; type?: string; title?: string }> }
export interface CprmCollectionInfo { id: string; title?: string; description?: string; links?: Array<{ href: string; rel?: string; type?: string; title?: string }> }
export interface CprmCollectionsResponse { collections: CprmCollectionInfo[]; links?: Array<{ href: string; rel?: string; type?: string; title?: string }> }
