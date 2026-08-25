// PLACEHOLDER - NÃO IMPLEMENTADO NESTA ETAPA.
//
// Este arquivo existe apenas para reservar a estrutura de uma futura IA de
// planejamento de rotas seguras: dado uma origem e um destino, sugerir um
// trajeto que evite áreas de risco (alagamento, deslizamento, etc) em vez
// de só o caminho mais rápido. Nenhuma lógica de IA, roteamento ou
// cruzamento com as camadas de risco do ARGOS foi implementada aqui, e o
// frontend NÃO chama nada deste arquivo.
//
// Depende de integrations/external/google-routes/ (também casca, ver
// service.ts daquele módulo) e, no futuro, de riskService.ts (também
// placeholder hoje) para saber quais áreas evitar.

import { NotImplementedError } from '../types.js'

export interface SafeRouteRequest {
  origin: { latitude: number; longitude: number }
  destination: { latitude: number; longitude: number }
}

export interface SafeRouteResult {
  distanceMeters: number
  durationSeconds: number
  polyline: string
  avoidedRiskAreas: string[]
}

export async function planSafeRoute(_request: SafeRouteRequest): Promise<SafeRouteResult> {
  throw new NotImplementedError('Planejamento de rotas seguras (routePlanningService)')
}
