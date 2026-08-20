import { Phone, Clock, Shield, Flame, HeartPulse, ShieldCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { emergencyContacts } from '../data/mockData'

const iconMap: Record<string, typeof Shield> = {
  shield: Shield,
  flame: Flame,
  'heart-pulse': HeartPulse,
  'shield-check': ShieldCheck,
}

export default function EmergencyPage() {
  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Emergência" subtitle="Contatos de emergência" />

      <div className="px-4 pt-4">
        <div className="mb-6 rounded-2xl bg-risk-red/10 border border-risk-red/20 p-4 text-center">
          <p className="text-sm font-medium text-risk-red">
            Em caso de emergência, ligue imediatamente para os números abaixo
          </p>
        </div>

        <div className="space-y-4">
          {emergencyContacts.map((contact, index) => {
            const Icon = iconMap[contact.icon]
            return (
              <a
                key={contact.id}
                href={`tel:${contact.phone}`}
                className={`block rounded-2xl bg-gradient-to-r ${contact.color} p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.98] animate-slide-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                    <Icon size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{contact.name}</h3>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} />
                        <span className="text-2xl font-bold tracking-wider">
                          {contact.phone}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-white/80">
                      <Clock size={12} />
                      <span>Atendimento: {contact.hours}</span>
                    </div>
                  </div>
                </div>
              </a>
            )
          })}
        </div>

        <div className="mt-6 card p-4">
          <h3 className="mb-2 font-semibold text-slate-800">Informações Úteis</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Mantenha a calma e forneça sua localização exata</li>
            <li>• Descreva a situação de forma clara e objetiva</li>
            <li>• Não desligue até ser orientado pelo atendente</li>
            <li>• Prefira ligação a mensagens em emergências</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
