import { Camera } from 'lucide-react'

interface SimulatedPhotoProps {
  color: string
  label?: string
}

export default function SimulatedPhoto({ color, label }: SimulatedPhotoProps) {
  return (
    <div
      className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{
        background: `linear-gradient(135deg, ${color}40, ${color}80)`,
      }}
    >
      <div className="absolute inset-0 opacity-30" style={{ backgroundColor: color }} />
      <Camera size={24} className="relative z-10 text-white/70" />
      {label && (
        <span className="absolute bottom-1 left-1 right-1 truncate text-center text-[8px] font-medium text-white/90">
          {label}
        </span>
      )}
    </div>
  )
}
