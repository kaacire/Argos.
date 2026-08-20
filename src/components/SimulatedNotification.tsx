import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

/**
 * Tipos das props que o componente recebe.
 * Em TSX, "interface" descreve o "formato" de um objeto:
 * quais campos existem e qual o tipo de cada um.
 *
 * O "?" depois do nome (ex: time?) significa que o campo é OPCIONAL.
 */
interface SimulatedNotificationProps {
  visible: boolean
  title: string
  message: string
  time?: string
  onClose?: () => void // função que não recebe nada e não retorna nada
  autoHideMs?: number
}

export function SimulatedNotification({
  visible,
  title,
  message,
  time = 'agora',
  onClose,
  autoHideMs = 4000,
}: SimulatedNotificationProps) {
  useEffect(() => {
    if (!visible || autoHideMs === 0) return

    const timer = setTimeout(() => {
      onClose?.()
    }, autoHideMs)

    return () => clearTimeout(timer)
  }, [visible, autoHideMs, onClose])

  return (
    <div
      className={`fixed left-1/2 top-3 z-50 w-[92%] max-w-sm -translate-x-1/2 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'
      }`}
    >
      <div className="card flex items-start gap-3 p-3 shadow-lg">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-risk-yellow/10 text-risk-yellow">
          <AlertTriangle size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-slate-800">{title}</h4>
            <span className="flex-shrink-0 text-[10px] text-slate-400">{time}</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{message}</p>
        </div>

        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100"
          aria-label="Fechar notificação"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

/**
 * Página de protótipo isolada para testar a notificação sozinha.
 * Pode ser apagada depois que você confirmar que o componente funciona.
 */
export default function NotificationDemoPage() {
  const [showNotification, setShowNotification] = useState<boolean>(false)

  return (
    <div className="page-container animate-fade-in">
      <SimulatedNotification
        visible={showNotification}
        title="App de Relatos"
        message="Um novo relato foi registrado próximo a você: Buraco na via."
        time="agora"
        onClose={() => setShowNotification(false)}
      />

      <div className="flex flex-col items-center justify-center px-4 pt-24 text-center">
        <h2 className="text-lg font-bold text-slate-800">Protótipo de Notificação</h2>
        <p className="mt-2 text-sm text-slate-500">
          Clique no botão abaixo para simular o aparecimento de uma notificação
          push no topo da tela.
        </p>

        <button className="btn-primary mt-6" onClick={() => setShowNotification(true)}>
          Simular Notificação
        </button>
      </div>
    </div>
  )
}