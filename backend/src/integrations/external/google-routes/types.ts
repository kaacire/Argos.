// CASCA - NÃO USADO AINDA.
//
// Tipos reservados para a futura integração com a Google Routes API
// (https://routes.googleapis.com), pensada para a IA de planejamento de
// rotas seguras (evitar vias em área de risco de alagamento/deslizamento
// no cálculo do trajeto). Nada aqui é usado em runtime - só estrutura para
// quando essa etapa for implementada de verdade.
//
// Ver service.ts deste mesmo módulo para o endpoint real e o formato do
// payload da API (Routes API v2, método computeRoutes).

export interface LatLng {
  latitude: number
  longitude: number
}

export type GoogleTravelMode = 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT'
export type GoogleRoutingPreference = 'TRAFFIC_UNAWARE' | 'TRAFFIC_AWARE' | 'TRAFFIC_AWARE_OPTIMAL'

// Espelha `routeModifiers` da Routes API - "avoid" aqui é só sobre
// pedágio/rodovia/balsa (o que a API do Google entende nativamente).
// NÃO cobre "evitar área de risco geoclimático" - isso é lógica que o
// ARGOS teria que aplicar por cima (comparando a polyline da rota com as
// camadas de risco), e não existe ainda. Ver routePlanningService.ts.
export interface GoogleRouteModifiers {
  avoidTolls?: boolean
  avoidHighways?: boolean
  avoidFerries?: boolean
}

export interface ComputeRoutesRequest {
  origin: { location: { latLng: LatLng } }
  destination: { location: { latLng: LatLng } }
  travelMode?: GoogleTravelMode
  routingPreference?: GoogleRoutingPreference
  routeModifiers?: GoogleRouteModifiers
  computeAlternativeRoutes?: boolean
}

export interface ComputeRoutesRoute {
  distanceMeters: number
  duration: string
  polyline?: { encodedPolyline: string }
  warnings?: string[]
}

export interface ComputeRoutesResponse {
  routes: ComputeRoutesRoute[]
}
