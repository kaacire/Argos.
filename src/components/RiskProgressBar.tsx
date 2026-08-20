interface RiskProgressBarProps {
  label: string
  value: number
  color: string
}

export default function RiskProgressBar({ label, value, color }: RiskProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-lg font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
