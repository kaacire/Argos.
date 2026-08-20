import { MapPin, Clock, Filter } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SimulatedPhoto from '../components/SimulatedPhoto'
import { reports } from '../data/mockData'
import { Link } from 'react-router-dom'

const statusConfig = {
  pendente: { bg: 'bg-risk-yellow/10', text: 'text-risk-yellow', label: 'Pendente' },
  verificado: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'Verificado' },
  resolvido: { bg: 'bg-risk-green/10', text: 'text-risk-green', label: 'Resolvido' },
}

export default function ReportsPage() {
  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Relatos" subtitle={`${reports.length} relatos da comunidade`} />

      <div className="px-4 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">Relatos enviados pela população</p>
          <button className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            <Filter size={14} />
            Filtrar
          </button>
        </div>

        <div className="space-y-4">
          {reports.map((report, index) => {
            const status = statusConfig[report.status]
            return (
              <div
                key={report.id}
                className="card card-hover p-4 animate-slide-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex gap-3">
                  <SimulatedPhoto color={report.imageColor} label={report.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-800">{report.type}</h3>
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.text}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={12} />
                        <span className="truncate">{report.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock size={12} />
                        <span>{report.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Link to="/novo-relato" className="btn-primary mt-6 block w-full text-center">Enviar Novo Relato</Link>
      </div>
    </div>
  )
}
