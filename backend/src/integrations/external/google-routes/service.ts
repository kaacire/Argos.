// CASCA - NÃO IMPLEMENTADO NESTA ETAPA.
//
// Reservado para a futura integração com a Google Routes API, usada pela
// IA de planejamento de rotas seguras (ver
// services/routePlanningService.ts). Nenhuma chamada HTTP real é feita
// por este arquivo ainda - só a estrutura de onde ela vai entrar.
//
// Quando for implementado de verdade, o fluxo real é:
//
//   POST https://routes.googleapis.com/directions/v2:computeRoutes
//   Headers:
//     Content-Type: application/json
//     X-Goog-Api-Key: <GOOGLE_MAPS_API_KEY, ver config.ts>
//     X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.polyline,routes.warnings
//   Body: ComputeRoutesRequest (ver types.ts deste módulo)
//
// Requisitos que NÃO estão resolvidos ainda (deixados para quem
// implementar):
// - Faturamento habilitado no Google Cloud Console (Routes API é paga,
//   sem tier gratuito perpétuo) e a API "Routes API" ativada no projeto.
// - X-Goog-FieldMask é obrigatório - sem ele a API responde 400.
// - Nenhuma lógica de "rota segura" existe aqui: a Routes API só evita
//   pedágio/rodovia/balsa nativamente. "Evitar área de risco
//   geoclimático" exigiria decodificar a polyline retornada e cruzar com
//   as camadas de risco do ARGOS (rios, terremotos, deslizamento) - isso
//   é trabalho da IA de planejamento, não deste client.

import { NotImplementedError } from '../../../types.js'
import type { ComputeRoutesRequest, ComputeRoutesResponse } from './types.js'

export const GOOGLE_ROUTES_BASE_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'

export async function computeRoutes(_request: ComputeRoutesRequest): Promise<ComputeRoutesResponse> {
  throw new NotImplementedError('Google Routes API (integrations/external/google-routes)')
}
