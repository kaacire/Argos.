import { Bell, Brain, ChevronRight, CloudRain, Droplets, History, MapPin, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import RiskProgressBar from '../components/RiskProgressBar'
import { aiInputs, aiResults, dashboardRisk } from '../data/mockData'

export default function AIPage() {
  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="IA Preditiva" subtitle="Análise inteligente de riscos" showBack />

      <div className="px-4 pt-4">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <Brain size={22} />
              <h2 className="font-bold">Painel de Previsão</h2>
            </div>
            <p className="mt-1 text-xs text-white/80">
              Modelo de IA treinado com dados de Sento Sé - BA
            </p>
          </div>

          <div className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Entradas Analisadas</h3>
            <div className="grid grid-cols-2 gap-2">
              <InputCard
                icon={<CloudRain size={16} className="text-primary-600" />}
                label="Chuva prevista"
                value={aiInputs.rainForecast}
              />
              <InputCard
                icon={<Droplets size={16} className="text-cyan-600" />}
                label="Umidade"
                value={aiInputs.humidity}
              />
              <InputCard
                icon={<History size={16} className="text-slate-600" />}
                label="Histórico da região"
                value={aiInputs.regionHistory}
              />
              <InputCard
                icon={<MapPin size={16} className="text-risk-orange" />}
                label="Proximidade de rios"
                value={aiInputs.riverProximity}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-accent-500" />
            <h3 className="font-bold text-slate-800">Resultados da Análise</h3>
          </div>

          <div className="space-y-5">
            <RiskProgressBar
              label="Risco de Chuva"
              value={aiResults.rain}
              color="#3b82f6"
            />
            <RiskProgressBar
              label="Risco de Alagamento"
              value={aiResults.flood}
              color="#06b6d4"
            />
            <RiskProgressBar
              label="Risco de Deslizamento"
              value={aiResults.landslide}
              color="#f97316"
            />
          </div>
        </div>

        <div className="mt-4 card p-4">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
            <Brain size={16} className="text-primary-600" />
            Explicação da IA
          </h3>
          <p className="text-sm leading-relaxed text-slate-600">
            {aiResults.explanation}
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-primary-50 p-3 text-center">
          <p className="text-xs text-primary-700">
            Análise gerada em {dashboardRisk.lastUpdate} • Confiança do modelo: {dashboardRisk.confidence}%
          </p>
        </div>

        <Link
          to="/alertas"
          className="mt-4 flex items-center justify-between rounded-xl border border-primary-200 bg-white p-3 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
        >
          <span className="flex items-center gap-2">
            <Bell size={16} />
            Ver alertas e recomendações relacionados
          </span>
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  )
}

function InputCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-800">{value}</p>
    </div>
  )
}
