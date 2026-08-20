import { CloudSun } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  light?: boolean
}

export default function Logo({ size = 'md', showText = true, light = false }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 48, text: 'text-3xl' },
  }

  const s = sizes[size]

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center justify-center rounded-xl ${light ? 'bg-white/20' : 'bg-primary-100'} p-2`}>
        <CloudSun size={s.icon} className={light ? 'text-white' : 'text-primary-600'} />
      </div>
      {showText && (
        <div>
          <h1 className={`font-bold ${s.text} ${light ? 'text-white' : 'text-primary-800'}`}>
            Argos
          </h1>
          {size === 'lg' && (
            <p className={`text-xs ${light ? 'text-white/80' : 'text-slate-500'}`}>
              Monitoramento Climático Urbano
            </p>
          )}
        </div>
      )}
    </div>
  )
}
