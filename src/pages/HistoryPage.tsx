import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { CloudRain, Thermometer, Wind, AlertTriangle, Waves, Droplets } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getChartData } from '../data/mockData'
import { fetchRealHistory, type HistoryApiState, type HistoryPeriod, type RealHistoryResponse } from '../data/historyApi'

const periods: { id: HistoryPeriod; label: string }[] = [
  { id: '7d', label: '7 dias' },
  { id: '3m', label: '3 meses' },
  { id: '1y', label: '1 ano' },
]

// Formata a data (yyyy-mm-dd) de um ponto histórico real em um rótulo curto
// para o eixo X do gráfico, no mesmo estilo que a página já usava com os
// dados mock (dia da semana para 7d, dd/mm para 3m, mês abreviado para 1y).
// Usa meio-dia (T12:00:00) só para evitar que o fuso horário local jogue a
// data para o dia anterior/seguinte ao formatar - não altera o dado em si.
function formatLabel(dateStr: string, period: HistoryPeriod): string {
  const d = new Date(`${dateStr}T12:00:00`)
  const capitalize = (s: string) => (s.charAt(0).toUpperCase() + s.slice(1)).replace('.', '')

  if (period === '7d') return capitalize(d.toLocaleDateString('pt-BR', { weekday: 'short' }))
  if (period === '3m') return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return capitalize(d.toLocaleDateString('pt-BR', { month: 'short' }))
}

type ChartPoint = { label: string; value: number | null }

function toSeries(
  history: RealHistoryResponse,
  field: 'temperature' | 'precipitation' | 'humidity' | 'windSpeed'
): ChartPoint[] {
  return history.points.map((p) => ({ label: formatLabel(p.date, history.period), value: p[field] }))
}

// -----------------------------------------------------------------------
// Estatísticas (máxima, mínima, média) do período. Calculadas SOMENTE a
// partir dos pontos reais já retornados por /api/history (a mesma série
// usada nos gráficos) - nunca de um valor fixo/mock. Campos `null` (sem
// dado na fonte para aquele dia/semana/mês) são excluídos do cálculo, não
// tratados como 0. Se não sobrar nenhum valor numérico, retorna `null` e a
// interface mostra "Sem dados disponíveis" em vez de inventar um número.
// -----------------------------------------------------------------------
interface PeriodStats {
  max: number
  min: number
  avg: number
}

function computeStats(
  history: RealHistoryResponse,
  field: 'temperature' | 'precipitation' | 'humidity' | 'windSpeed'
): PeriodStats | null {
  const values = history.points.map((p) => p[field]).filter((v): v is number => v !== null)
  if (values.length === 0) return null

  const max = Math.max(...values)
  const min = Math.min(...values)
  const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
  return { max, min, avg }
}

export default function HistoryPage() {
  const [period, setPeriod] = useState<HistoryPeriod>('7d')

  // Chuva, Temperatura, Umidade e Vento vêm da Historical Weather API real
  // da Open-Meteo (backend ARGOS, GET /api/history). Nível do Rio e Eventos
  // Registrados continuam vindo de mockData.ts - não têm fonte real ainda.
  const [historyState, setHistoryState] = useState<HistoryApiState<RealHistoryResponse>>({ status: 'loading' })
  const mockData = getChartData(period)

  useEffect(() => {
    let cancelled = false
    setHistoryState({ status: 'loading' })

    fetchRealHistory(period)
      .then((data) => {
        if (!cancelled) setHistoryState({ status: 'success', data })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setHistoryState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Não foi possível carregar o histórico.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [period])

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Histórico" subtitle="Dados climáticos de Sento Sé" showBack />

      <div className="px-4 pt-4">
        <div className="mb-4 flex gap-2">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${
                period === p.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {historyState.status === 'loading' && (
          <div className="mb-4 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
            Carregando dados reais do histórico (Open-Meteo)...
          </div>
        )}
        {historyState.status === 'error' && (
          <div className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 shadow-sm">
            Erro ao carregar histórico: {historyState.message}
          </div>
        )}

        {historyState.status === 'success' && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <StatCard title="Temperatura" unit="°C" stats={computeStats(historyState.data, 'temperature')} />
            <StatCard title="Chuva" unit="mm" stats={computeStats(historyState.data, 'precipitation')} />
            <StatCard title="Umidade" unit="%" stats={computeStats(historyState.data, 'humidity')} />
            <StatCard title="Vento" unit="km/h" stats={computeStats(historyState.data, 'windSpeed')} />
          </div>
        )}

        <div className="space-y-4">
          <ChartCard
            title="Chuva (mm)"
            icon={<CloudRain size={18} className="text-primary-600" />}
            data={historyState.status === 'success' ? toSeries(historyState.data, 'precipitation') : []}
            color="#3b82f6"
            type="bar"
          />
          <ChartCard
            title="Nível do Rio (m)"
            subtitle="Ainda não possui fonte real integrada"
            icon={<Waves size={18} className="text-blue-700" />}
            data={mockData.riverLevel}
            color="#1d4ed8"
            type="line"
          />
          <ChartCard
            title="Temperatura (°C)"
            icon={<Thermometer size={18} className="text-risk-red" />}
            data={historyState.status === 'success' ? toSeries(historyState.data, 'temperature') : []}
            color="#ef4444"
            type="line"
          />
          <ChartCard
            title="Umidade (%)"
            icon={<Droplets size={18} className="text-sky-600" />}
            data={historyState.status === 'success' ? toSeries(historyState.data, 'humidity') : []}
            color="#0ea5e9"
            type="line"
          />
          <ChartCard
            title="Ventos (km/h)"
            icon={<Wind size={18} className="text-purple-500" />}
            data={historyState.status === 'success' ? toSeries(historyState.data, 'windSpeed') : []}
            color="#8b5cf6"
            type="line"
          />
          <ChartCard
            title="Eventos Registrados"
            subtitle="Enchentes, deslizamentos, terremotos e ventanias (ainda não possui fonte real integrada)"
            icon={<AlertTriangle size={18} className="text-risk-orange" />}
            data={mockData.occurrences}
            color="#f97316"
            type="bar"
          />
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  unit: string
  stats: PeriodStats | null
}

// Card de resumo (máx/mín/média) de uma variável no período selecionado.
// `stats` já vem calculado por computeStats() a partir dos dados reais -
// este componente só exibe; nunca decide nem inventa um valor.
function StatCard({ title, unit, stats }: StatCardProps) {
  return (
    <div className="card p-3">
      <h4 className="mb-2 text-xs font-semibold text-slate-500">{title}</h4>
      {stats === null ? (
        <p className="text-xs text-slate-400">Sem dados disponíveis</p>
      ) : (
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <div className="text-[10px] text-slate-400">Máx</div>
            <div className="text-sm font-bold text-slate-800">
              {stats.max}
              {unit}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Mín</div>
            <div className="text-sm font-bold text-slate-800">
              {stats.min}
              {unit}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Média</div>
            <div className="text-sm font-bold text-slate-800">
              {stats.avg}
              {unit}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ChartCardProps {
  title: string
  subtitle?: string
  icon: React.ReactNode
  data: ChartPoint[]
  color: string
  type: 'bar' | 'line'
}

function ChartCard({ title, subtitle, icon, data, color, type }: ChartCardProps) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={30} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={30} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={{ fill: color, r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
