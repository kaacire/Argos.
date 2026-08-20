import type { DataAvailability, RiskFactor, RiskLevel, RiskZoneLevel } from '../types'

export const riskConfig: Record<RiskLevel, { bg: string; text: string; border: string; label: string }> = {
  verde: {
    bg: 'bg-risk-green/10',
    text: 'text-risk-green',
    border: 'border-risk-green/30',
    label: 'Baixo',
  },
  amarelo: {
    bg: 'bg-risk-yellow/10',
    text: 'text-risk-yellow',
    border: 'border-risk-yellow/30',
    label: 'Moderado',
  },
  laranja: {
    bg: 'bg-risk-orange/10',
    text: 'text-risk-orange',
    border: 'border-risk-orange/30',
    label: 'Alto',
  },
  vermelho: {
    bg: 'bg-risk-red/10',
    text: 'text-risk-red',
    border: 'border-risk-red/30',
    label: 'Crítico',
  },
}

export const riskSolidColors: Record<RiskLevel, string> = {
  verde: '#22c55e',
  amarelo: '#eab308',
  laranja: '#f97316',
  vermelho: '#ef4444',
}

// Escala de 5 níveis usada nas áreas/regiões de risco do mapa (RiskZone).
// Distinta da RiskLevel (usada em alertas/clima), que tem 4 níveis.
export const riskZoneConfig: Record<RiskZoneLevel, { color: string; label: string }> = {
  normal: { color: '#64748b', label: 'Normal' },
  atencao: { color: '#22c55e', label: 'Atenção' },
  moderado: { color: '#eab308', label: 'Moderado' },
  alto: { color: '#f97316', label: 'Alto' },
  critico: { color: '#ef4444', label: 'Crítico' },
}

// Converte uma pontuação de risco (0-100) na classificação de 5 níveis do dashboard/mapa.
export function getRiskZoneLevelFromScore(score: number): RiskZoneLevel {
  if (score <= 20) return 'normal'
  if (score <= 40) return 'atencao'
  if (score <= 60) return 'moderado'
  if (score <= 80) return 'alto'
  return 'critico'
}

export const factorImpactConfig: Record<RiskFactor['impact'], { color: string; label: string }> = {
  baixo: { color: '#22c55e', label: 'Baixo' },
  moderado: { color: '#eab308', label: 'Moderado' },
  alto: { color: '#ef4444', label: 'Alto' },
}

// Indica o quanto de dado real/atualizado embasa a estimativa de risco exibida.
// Mock organizado para futura substituição pelo status real de cobertura de sensores/fontes.
export const dataAvailabilityConfig: Record<
  DataAvailability,
  { label: string; description: string; color: string }
> = {
  completa: {
    label: 'Completa',
    description: 'Todas as fontes e sensores da região estão ativos e atualizados.',
    color: '#22c55e',
  },
  parcial: {
    label: 'Parcial',
    description: 'Parte dos sensores da região ainda não está integrada ao sistema.',
    color: '#eab308',
  },
  limitada: {
    label: 'Limitada',
    description: 'Estimativa baseada majoritariamente em histórico, com poucos dados em tempo real.',
    color: '#f97316',
  },
}
