import type { RiskLevel } from '../types'
import { riskConfig } from '../utils/riskColors'

interface RiskBadgeProps {
  level: RiskLevel
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function RiskBadge({ level, showLabel = true, size = 'md' }: RiskBadgeProps) {
  const config = riskConfig[level]
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold capitalize ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.text.replace('text-', 'bg-')}`} />
      {showLabel && config.label}
    </span>
  )
}
