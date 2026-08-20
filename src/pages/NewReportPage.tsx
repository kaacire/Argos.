import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SimulatedPhoto from '../components/SimulatedPhoto'
import CameraCapture from '../components/CameraCapture'
import { SimulatedNotification } from '../components/SimulatedNotification'
import { reports, mapOccurrences, SENTO_SE_COORDS } from '../data/mockData'

// ---------- TIPOS ----------
// "interface" descreve o formato de um objeto: quais campos ele tem
// e o tipo de cada um. Isso ajuda o editor a te avisar de erros antes
// mesmo de rodar o código.

interface AccidentType {
  value: string
  label: string
  color: string
}

interface SubmittedReport {
  type: string
  color: string
  location: string
  description: string
  photoPreview: string | null
  time: string
  status: 'pendente'
}

// "Record<string, string>" = um objeto onde toda chave e todo valor são texto.
// Ex: { type: "Selecione...", photo: "Envie uma foto..." }
type FormErrors = Record<string, string>

const accidentTypes: AccidentType[] = [
  { value: 'rua-alagada', label: 'Rua alagada', color: '#3b82f6' },
  { value: 'enchente', label: 'Enchente', color: '#06b6d4' },
  { value: 'arvore-caida', label: 'Árvore caída', color: '#22c55e' },
  { value: 'poste-danificado', label: 'Poste danificado', color: '#eab308' },
  { value: 'deslizamento', label: 'Deslizamento', color: '#f97316' },
  { value: 'via-bloqueada', label: 'Via bloqueada', color: '#ef4444' },
  { value: 'rio-subindo', label: 'Rio subindo', color: '#1d4ed8' },
]

const MIN_DESCRIPTION_LENGTH = 100

export default function NewReportPage() {
  // useNavigate() retorna uma função que usamos para trocar de página
  // programaticamente (ex: ao clicar em um botão "Voltar" ou após enviar).
  const navigate = useNavigate()

  // Estados do formulário (campos controlados)
  // O texto dentro de < > é o TIPO do que vai dentro do useState.
  const [type, setType] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Estados de controle de UI
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState<SubmittedReport | null>(null)
  const [notify, setNotify] = useState<boolean>(false)

  function validate(): FormErrors {
    const newErrors: FormErrors = {}

    if (!type) {
      newErrors.type = 'Selecione o tipo de ocorrência.'
    }

    if (!photoPreview) {
      newErrors.photo = 'Tire uma foto do local pela câmera.'
    }

    const descLength = description.trim().length
    if (descLength < MIN_DESCRIPTION_LENGTH) {
      newErrors.description = `A descrição precisa ter pelo menos ${MIN_DESCRIPTION_LENGTH} caracteres (${descLength}/${MIN_DESCRIPTION_LENGTH}).`
    }

    return newErrors
  }

  // "e: React.FormEvent<HTMLFormElement>" = evento de submit de um <form>
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const newErrors = validate()
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) return

    const selectedType = accidentTypes.find((t) => t.value === type)
    if (!selectedType) return // segurança extra para o TypeScript

    const submittedLocation = location.trim() || 'Localização não informada'

    setSubmitted({
      type: selectedType.label,
      color: selectedType.color,
      location: submittedLocation,
      description: description.trim(),
      photoPreview,
      time: 'Agora mesmo',
      status: 'pendente',
    })

    // MVP: sem backend. A ocorrência é adicionada diretamente às listas
    // mockadas já usadas pela tela de Relatos e pelo Mapa, para que apareça
    // de imediato nessas telas sem precisar de uma arquitetura de estado nova.
    const newId = `relato-${Date.now()}`

    reports.unshift({
      id: newId,
      type: selectedType.label,
      location: submittedLocation,
      time: 'Agora mesmo',
      status: 'pendente',
      imageColor: selectedType.color,
    })

    mapOccurrences.unshift({
      id: newId,
      type: selectedType.label,
      location: submittedLocation,
      time: 'Agora mesmo',
      description: description.trim(),
      lat: SENTO_SE_COORDS[0] + (Math.random() - 0.5) * 0.01,
      lng: SENTO_SE_COORDS[1] + (Math.random() - 0.5) * 0.01,
    })

    setNotify(true)
  }

  function handleReset() {
    setType('')
    setLocation('')
    setDescription('')
    setPhotoPreview(null)
    setErrors({})
    setSubmitted(null)
  }

  const descLength = description.trim().length
  const descOk = descLength >= MIN_DESCRIPTION_LENGTH

  return (
    <div className="page-container animate-fade-in">
      <SimulatedNotification
        visible={notify}
        title="Relato enviado"
        message="Seu relato foi recebido e está pendente de análise."
        time="agora"
        onClose={() => setNotify(false)}
      />

      <PageHeader title="Novo Relato" subtitle="Conte o que está acontecendo" />

      <div className="px-4 pt-4">
        {/* Botão de voltar — exemplo de navegação programática */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-500"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        {submitted ? (
          // ---------- TELA DE CONFIRMAÇÃO (após enviar) ----------
          <div className="space-y-4 animate-slide-up">
            <div className="card flex items-start gap-3 p-4 border-l-4 border-risk-green">
              <CheckCircle2 className="mt-0.5 flex-shrink-0 text-risk-green" size={22} />
              <div>
                <h3 className="font-bold text-slate-800">Relato enviado com sucesso!</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Seu relato foi registrado com status "Pendente". A equipe
                  responsável irá analisar em breve.
                </p>
              </div>
            </div>

            <div className="card p-4 animate-slide-up">
              <div className="flex gap-3">
                {submitted.photoPreview ? (
                  <img
                    src={submitted.photoPreview}
                    alt={submitted.type}
                    className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <SimulatedPhoto color={submitted.color} label={submitted.type} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-800">{submitted.type}</h3>
                    <span className="flex-shrink-0 rounded-full bg-risk-yellow/10 px-2 py-0.5 text-[10px] font-semibold text-risk-yellow">
                      Pendente
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{submitted.location}</p>
                  <p className="mt-2 text-sm text-slate-600">{submitted.description}</p>
                  <p className="mt-2 text-xs text-slate-400">{submitted.time}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-primary flex-1" onClick={handleReset}>
                Enviar outro relato
              </button>
              <button
                className="flex-1 rounded-lg bg-slate-100 text-sm font-semibold text-slate-600"
                onClick={() => navigate('/relatos')}
              >
                Ver meus relatos
              </button>
            </div>
          </div>
        ) : (
          // ---------- FORMULÁRIO ----------
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Tipo de ocorrência */}
            <div className="card p-4">
              <label className="mb-2 block text-sm font-bold text-slate-800" htmlFor="type">
                Tipo de ocorrência
              </label>
              <select
                id="type"
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-300 ${
                  errors.type ? 'border-risk-red' : 'border-slate-200'
                }`}
                value={type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}
              >
                <option value="">Selecione...</option>
                {accidentTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-risk-red">
                  <AlertCircle size={12} /> {errors.type}
                </p>
              )}
            </div>

            {/* Localização (opcional) */}
            <div className="card p-4">
              <label className="mb-2 block text-sm font-bold text-slate-800" htmlFor="location">
                Localização <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                id="location"
                type="text"
                placeholder="Ex: Rua das Flores, próximo ao nº 123"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-300"
                value={location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
              />
            </div>

            {/* Foto (obrigatória) — captura ao vivo pela câmera, sem opção de galeria */}
            <div className="card p-4">
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Foto do local <span className="font-normal text-risk-red">*</span>
              </label>

              <CameraCapture
                photoPreview={photoPreview}
                onCapture={(dataUrl) => {
                  setPhotoPreview(dataUrl)
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.photo
                    return next
                  })
                }}
                onRetake={() => setPhotoPreview(null)}
              />

              {errors.photo && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-risk-red">
                  <AlertCircle size={12} /> {errors.photo}
                </p>
              )}
            </div>

            {/* Descrição (mínimo 100 caracteres) */}
            <div className="card p-4">
              <label className="mb-2 block text-sm font-bold text-slate-800" htmlFor="description">
                Descrição
              </label>
              <textarea
                id="description"
                rows={5}
                placeholder="Descreva com detalhes o que está acontecendo, há quanto tempo e quais os riscos..."
                className={`w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-300 ${
                  errors.description ? 'border-risk-red' : 'border-slate-200'
                }`}
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              />
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className={descOk ? 'text-risk-green' : 'text-slate-400'}>
                  {descLength}/{MIN_DESCRIPTION_LENGTH} caracteres mínimos
                </span>
                {descOk && <CheckCircle2 size={14} className="text-risk-green" />}
              </div>
              {errors.description && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-risk-red">
                  <AlertCircle size={12} /> {errors.description}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2">
              <Send size={16} />
              Enviar Relato
            </button>
          </form>
        )}
      </div>
    </div>
  )
}