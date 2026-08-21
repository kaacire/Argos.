// PLACEHOLDER - NÃO IMPLEMENTADO NESTA ETAPA.
//
// Este arquivo existe apenas para reservar a estrutura de uma futura
// camada de cálculo/classificação de risco (ex: score de risco de
// alagamento/deslizamento). Nenhuma lógica de IA, ML ou heurística de
// risco foi implementada aqui, e o frontend NÃO chama nada deste arquivo.
//
// Ver README, seção "O que NÃO foi implementado".

import { NotImplementedError } from '../types.js'

export interface RiskModelInput {
  latitude: number
  longitude: number
}

export interface RiskModelResult {
  score: number
  confidence: number
}

export async function calculateRisk(_input: RiskModelInput): Promise<RiskModelResult> {
  throw new NotImplementedError('Cálculo de risco (riskService)')
}
