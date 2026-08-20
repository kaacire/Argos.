import { NavLink } from 'react-router-dom'
import { Home, Map, Bell, MessageSquare, Phone } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/mapa', icon: Map, label: 'Mapa' },
  { to: '/alertas', icon: Bell, label: 'Alertas' },
  { to: '/relatos', icon: MessageSquare, label: 'Relatos' },
  { to: '/emergencia', icon: Phone, label: 'Emergência' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-300 ${
                isActive
                  ? 'text-primary-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`rounded-lg p-1.5 transition-all duration-300 ${
                    isActive ? 'bg-primary-100' : ''
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
