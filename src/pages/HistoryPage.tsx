import { useState } from 'react'
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
import { CloudRain, Thermometer, Wind, AlertTriangle, Waves } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getChartData } from '../data/mockData'

type Period = '7d' | '3m' | '1y'

const periods: { id: Period; label: string }[] = [
  { id: '7d', label: '7 dias' },
  { id: '3m', label: '3 meses' },
  { id: '1y', label: '1 ano' },
]

export default function HistoryPage() {
  const [period, setPeriod] = useState<Period>('7d')
  const data = getChartData(period)

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

        <div className="space-y-4">
          <ChartCard
            title="Chuva (mm)"
            icon={<CloudRain size={18} className="text-primary-600" />}
            data={data.rain}
            color="#3b82f6"
            type="bar"
          />
          <ChartCard
            title="Nível do Rio (m)"
            icon={<Waves size={18} className="text-blue-700" />}
            data={data.riverLevel}
            color="#1d4ed8"
            type="line"
          />
          <ChartCard
            title="Temperatura (°C)"
            icon={<Thermometer size={18} className="text-risk-red" />}
            data={data.temperature}
            color="#ef4444"
            type="line"
          />
          <ChartCard
            title="Ventos (km/h)"
            icon={<Wind size={18} className="text-purple-500" />}
            data={data.wind}
            color="#8b5cf6"
            type="line"
          />
          <ChartCard
            title="Eventos Registrados"
            subtitle="Enchentes, deslizamentos, terremotos e ventanias"
            icon={<AlertTriangle size={18} className="text-risk-orange" />}
            data={data.occurrences}
            color="#f97316"
            type="bar"
          />
        </div>
      </div>
    </div>
  )
}

interface ChartCardProps {
  title: string
  subtitle?: string
  icon: React.ReactNode
  data: { label: string; value: number }[]
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
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
