import { Bell, Clock, MapPin, AlertOctagon, ShieldCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { alerts } from '../data/mockData'
import { riskConfig, riskSolidColors } from '../utils/riskColors'
import type { RiskLevel } from '../types'

const levelIcons: Record<RiskLevel, string> = {
  verde: '✓',
  amarelo: '!',
  laranja: '⚠',
  vermelho: '✕',
}

export default function AlertsPage() {
  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Alertas" subtitle={`${alerts.length} alertas ativos`} />

      <div className="px-4 pt-4">
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-primary-50 p-3">
          <Bell size={20} className="text-primary-600" />
          <p className="text-sm text-primary-800">
            Monitoramento ativo para <strong>Sento Sé - BA</strong>
          </p>
        </div>

        <div className="space-y-4">
          {alerts.map((alert, index) => {
            const config = riskConfig[alert.level]
            const color = riskSolidColors[alert.level]
            return (
              <div
                key={alert.id}
                className="card overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-1.5" style={{ backgroundColor: color }} />
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {levelIcons[alert.level]}
                    </div>
                    <h3 className="font-bold uppercase leading-tight text-slate-800">
                      Risco {config.label} de {alert.category}
                    </h3>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={12} />
                      <span>
                        Região: <strong className="text-slate-700">{alert.region}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={12} />
                      <span>
                        Período: <strong className="text-slate-700">{alert.period}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 rounded-lg bg-slate-50 p-2.5">
                    <AlertOctagon size={15} className="mt-0.5 flex-shrink-0 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-600">Motivo</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{alert.reason}</p>
                    </div>
                  </div>

                  <div
                    className="mt-2 flex gap-2 rounded-lg p-2.5"
                    style={{ backgroundColor: `${color}14` }}
                  >
                    <ShieldCheck size={15} className="mt-0.5 flex-shrink-0" style={{ color }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color }}>
                        Recomendação
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-700">
                        {alert.recommendation}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} />
                    <span>{alert.time}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 card p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Legenda de Níveis</h3>
          <div className="grid grid-cols-2 gap-2">
            {(['verde', 'amarelo', 'laranja', 'vermelho'] as RiskLevel[]).map((level) => (
              <div key={level} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: riskSolidColors[level] }}
                />
                <span className="text-xs text-slate-600">{riskConfig[level].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
