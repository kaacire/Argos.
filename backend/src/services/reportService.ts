// PLACEHOLDER - NÃO IMPLEMENTADO NESTA ETAPA.
//
// Estrutura reservada para uma futura funcionalidade de relatos
// comunitários (NewReportPage / ReportsPage). Não há tabela Prisma para
// isso, e o frontend de relatos continua usando src/data/mockData.ts
// (reports) sem nenhuma alteração.
//
// Ver README, seção "O que NÃO foi implementado".

import { NotImplementedError } from '../types.js'

export interface CreateReportInput {
  type: string
  location: string
  description?: string
}

export async function createReport(_input: CreateReportInput): Promise<never> {
  throw new NotImplementedError('Envio de relatos (reportService)')
}
