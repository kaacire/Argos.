import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
}

export default function PageHeader({ title, subtitle, showBack = false }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="page-header">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl bg-white/20 p-2 transition-colors hover:bg-white/30"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
        </div>
      </div>
    </header>
  )
}
