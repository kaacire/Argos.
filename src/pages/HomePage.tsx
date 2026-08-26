import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CloudRain,
  Droplets,
  Wind,
  MapPin,
  Clock,
  ChevronRight,
  Brain,
  BarChart3,
  AlertTriangle,
  Gauge,
  Database,
} from 'lucide-react'
import Logo from '../components/Logo'
import RiskBadge from '../components/RiskBadge'
import { SENTO_SE_COORDS, weatherData as mockWeatherData, alerts, dashboardRisk } from '../data/mockData'
import { fetchRealWeather, type MapApiState, type RealWeatherData } from '../data/mapApi'
import {
  dataAvailabilityConfig,
  factorImpactConfig,
  getRiskZoneLevelFromScore,
  riskZoneConfig,
} from '../utils/riskColors'

export default function HomePage() {
  const riskLevel = getRiskZoneLevelFromScore(dashboardRisk.score)
  const riskLevelConfig = riskZoneConfig[riskLevel]

  // Clima real vindo do backend ARGOS (GET /api/weather, mesma integração
  // Open-Meteo já usada no MapPage.tsx via src/data/mapApi.ts). O restante
  // do dashboard (pontuação de risco, fatores, confiabilidade e alertas)
  // continua vindo de mockData.ts, pois o backend ainda não tem essa fonte
  // real conectada (ver backend/src/services/riskService.ts, placeholder
  // não implementado).
  const [weatherState, setWeatherState] = useState<MapApiState<RealWeatherData>>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setWeatherState({ status: 'loading' })

    fetchRealWeather(SENTO_SE_COORDS[0], SENTO_SE_COORDS[1])
      .then((data) => {
        if (!cancelled) setWeatherState({ status: 'success', data })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setWeatherState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Não foi possível carregar os dados do clima.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Enquanto carrega ou em caso de erro, cai de volta no mock para não
  // deixar a tela vazia/quebrada - mas usa o dado real assim que chega.
  const weatherData = weatherState.status === 'success' ? weatherState.data : mockWeatherData

  return (
    <div className="page-container animate-fade-in">
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 px-4 pb-8 pt-6 text-white">
        <div className="mb-6">
          <Logo size="md" light />
        </div>

        <div className="mb-2 flex items-center gap-1 text-sm text-white/80">
          <MapPin size={14} />
          <span>
            {weatherData.city} - {weatherData.state}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-6xl font-bold tracking-tight">
              {weatherState.status === 'loading' ? '--' : `${weatherData.temperature}°`}
            </p>
            <p className="mt-1 text-lg text-white/90">
              {weatherState.status === 'error' ? 'Clima indisponível' : weatherData.condition}
            </p>
          </div>
          <div className="text-right">
            <CloudRain size={64} className="text-white/30" />
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
            <Droplets size={16} />
            <span className="text-sm">{weatherData.humidity}%</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
            <Wind size={16} />
            <span className="text-sm">{weatherData.windSpeed} km/h</span>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="card p-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin size={12} />
                <span>{dashboardRisk.region}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Pontuação de Risco</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold" style={{ color: riskLevelConfig.color }}>
                  {dashboardRisk.score}
                </span>
                <span className="text-sm text-slate-400">/ 100</span>
              </div>
              <div className="mt-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold"
                  style={{
                    color: riskLevelConfig.color,
                    borderColor: `${riskLevelConfig.color}4d`,
                    backgroundColor: `${riskLevelConfig.color}1a`,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: riskLevelConfig.color }}
                  />
                  {riskLevelConfig.label}
                </span>
              </div>
            </div>
            <AlertTriangle size={32} style={{ color: riskLevelConfig.color }} />
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${dashboardRisk.score}%`, backgroundColor: riskLevelConfig.color }}
            />
          </div>

          <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
            <Clock size={12} />
            <span>
              Última atualização:{' '}
              {weatherState.status === 'success'
                ? new Date(weatherState.data.lastUpdate).toLocaleTimeString('pt-BR')
                : weatherData.lastUpdate}
              {weatherState.status === 'success' && weatherState.data.cached ? ' (em cache)' : ''}
            </span>
          </div>
          <p className="mt-1 text-xs italic text-slate-400">Mock - dados não reais.</p>
        </div>

        <div className="mt-4 card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Principais Fatores de Risco</h2>
            <Link to="/ia" className="flex items-center gap-0.5 text-xs font-medium text-primary-600">
              Explicação completa <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {dashboardRisk.factors.map((factor) => {
              const impactConfig = factorImpactConfig[factor.impact]
              return (
                <div key={factor.id} className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: impactConfig.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800">{factor.label}</p>
                      <span
                        className="shrink-0 text-sm font-bold"
                        style={{ color: impactConfig.color }}
                      >
                        +{factor.points}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ color: impactConfig.color, backgroundColor: `${impactConfig.color}1a` }}
                      >
                        Impacto {impactConfig.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{factor.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 card p-4">
          <h2 className="mb-3 font-bold text-slate-800">Confiabilidade da Estimativa</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Gauge size={14} className="text-primary-600" />
                Nível de confiança
              </div>
              <p className="mt-1 text-base font-bold text-slate-800">{dashboardRisk.confidence}%</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-primary-600"
                  style={{ width: `${dashboardRisk.confidence}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Database size={14} style={{ color: dataAvailabilityConfig[dashboardRisk.dataAvailability].color }} />
                Dados disponíveis
              </div>
              <p
                className="mt-1 text-base font-bold"
                style={{ color: dataAvailabilityConfig[dashboardRisk.dataAvailability].color }}
              >
                {dataAvailabilityConfig[dashboardRisk.dataAvailability].label}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-slate-400">
                {dataAvailabilityConfig[dashboardRisk.dataAvailability].description}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
            <Clock size={12} />
            <span>Estimativa gerada em {dashboardRisk.lastUpdate}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link to="/historico" className="card card-hover p-4">
            <BarChart3 size={24} className="text-primary-600" />
            <p className="mt-2 font-semibold text-slate-800">Histórico</p>
            <p className="text-xs text-slate-500">Dados climáticos</p>
          </Link>
          <Link to="/ia" className="card card-hover p-4">
            <Brain size={24} className="text-accent-500" />
            <p className="mt-2 font-semibold text-slate-800">IA Preditiva</p>
            <p className="text-xs text-slate-500">Análise de riscos</p>
          </Link>
        </div>

        <div className="mt-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Alertas Ativos</h2>
            <Link to="/alertas" className="flex items-center gap-1 text-sm text-primary-600">
              Ver todos <ChevronRight size={16} />
            </Link>
          </div>
          <p className="mb-3 text-xs italic text-slate-400">Mock - dados não reais.</p>
          <div className="space-y-3">
            {alerts.slice(0, 2).map((alert) => (
              <div key={alert.id} className="card card-hover p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">{alert.category}</p>
                  <RiskBadge level={alert.level} size="sm" />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {alert.region} • {alert.period}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pb-4">
          <h2 className="mb-3 font-bold text-slate-800">Acesso Rápido</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link
              to="/mapa"
              className="card card-hover flex flex-col items-center p-3 text-center"
            >
              <MapPin size={20} className="text-primary-600" />
              <span className="mt-1 text-xs font-medium">Mapa</span>
            </Link>
            <Link
              to="/relatos"
              className="card card-hover flex flex-col items-center p-3 text-center"
            >
              <CloudRain size={20} className="text-primary-600" />
              <span className="mt-1 text-xs font-medium">Relatos</span>
            </Link>
            <Link
              to="/emergencia"
              className="card card-hover flex flex-col items-center p-3 text-center"
            >
              <AlertTriangle size={20} className="text-risk-red" />
              <span className="mt-1 text-xs font-medium">Emergência</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
