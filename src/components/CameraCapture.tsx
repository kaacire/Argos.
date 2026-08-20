import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Camera, RotateCcw, ShieldCheck } from 'lucide-react'
import { SENTO_SE_COORDS } from '../data/mockData'

interface CameraCaptureProps {
  photoPreview: string | null
  onCapture: (dataUrl: string) => void
  onRetake: () => void
}

type CameraStatus = 'idle' | 'starting' | 'ready' | 'denied' | 'unsupported'

// MVP: sem backend, então a "verificação de origem" acontece no cliente.
// A foto só pode vir da câmera ao vivo (nunca da galeria) e recebe uma
// marca d'água com data/hora e coordenadas gravada nos pixels da imagem,
// dificultando o reaproveitamento de fotos antigas ou de outro local.
// Uma verificação real (hash, EXIF assinado, checagem no servidor) fica
// para quando o backend existir.
export default function CameraCapture({ photoPreview, onCapture, onRetake }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')

  useEffect(() => {
    if (photoPreview) {
      stopStream()
      return
    }
    startCamera()
    return () => stopStream()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoPreview])

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      return
    }
    setStatus('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('ready')
    } catch {
      setStatus('denied')
    }
  }

  function getApproxCoords(): Promise<string> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(`${SENTO_SE_COORDS[0].toFixed(4)}, ${SENTO_SE_COORDS[1].toFixed(4)} (aprox.)`)
        return
      }
      const timeout = setTimeout(
        () => resolve(`${SENTO_SE_COORDS[0].toFixed(4)}, ${SENTO_SE_COORDS[1].toFixed(4)} (aprox.)`),
        2500,
      )
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeout)
          resolve(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
        },
        () => {
          clearTimeout(timeout)
          resolve(`${SENTO_SE_COORDS[0].toFixed(4)}, ${SENTO_SE_COORDS[1].toFixed(4)} (aprox.)`)
        },
        { timeout: 2500 },
      )
    })
  }

  async function handleCapture() {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const coords = await getApproxCoords()
    const timestamp = new Date().toLocaleString('pt-BR')
    const barHeight = Math.max(36, canvas.height * 0.08)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight)
    ctx.fillStyle = '#ffffff'
    const fontSize = Math.max(12, Math.floor(barHeight * 0.32))
    ctx.font = `600 ${fontSize}px sans-serif`
    ctx.textBaseline = 'middle'
    ctx.fillText(`ARGOS • Captura ao vivo • ${timestamp} • ${coords}`, 10, canvas.height - barHeight / 2)

    onCapture(canvas.toDataURL('image/jpeg', 0.85))
  }

  if (photoPreview) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <img src={photoPreview} alt="Foto capturada do ocorrido" className="max-h-64 w-full object-cover" />
        <button
          type="button"
          onClick={onRetake}
          className="flex w-full items-center justify-center gap-1.5 border-t border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw size={14} />
          Tirar outra foto
        </button>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
      {status === 'ready' ? (
        <div className="relative">
          <video ref={videoRef} playsInline muted className="max-h-64 w-full bg-black object-cover" />
          <button
            type="button"
            onClick={handleCapture}
            aria-label="Tirar foto"
            className="absolute bottom-3 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-white/30 shadow-lg"
          >
            <span className="h-11 w-11 rounded-full bg-white" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
          {status === 'denied' || status === 'unsupported' ? (
            <>
              <AlertTriangle size={22} className="text-risk-red" />
              <p className="text-sm font-medium text-slate-700">
                {status === 'unsupported'
                  ? 'Este navegador não tem suporte à câmera.'
                  : 'Permissão da câmera negada.'}
              </p>
              <p className="text-xs leading-relaxed text-slate-500">
                O ARGOS só aceita fotos tiradas na hora, direto pela câmera, para evitar o
                envio de imagens falsas ou de outra fonte. Habilite o acesso à câmera nas
                configurações do navegador e tente novamente.
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Tentar novamente
              </button>
            </>
          ) : (
            <>
              <Camera size={22} className="text-slate-400" />
              <p className="text-sm font-medium text-slate-700">
                {status === 'starting' ? 'Abrindo câmera...' : 'Ativar câmera para tirar a foto'}
              </p>
              <p className="flex items-center gap-1 text-xs text-slate-400">
                <ShieldCheck size={12} />
                Não é possível anexar fotos da galeria
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
