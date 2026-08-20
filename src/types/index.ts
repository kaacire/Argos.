export type RiskLevel = 'verde' | 'amarelo' | 'laranja' | 'vermelho'

export interface WeatherData {
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  city: string
  state: string
  riskLevel: RiskLevel
  lastUpdate: string
}

export interface Alert {
  id: string
  category: string
  level: RiskLevel
  region: string
  period: string
  reason: string
  recommendation: string
  time: string
}

export interface Report {
  id: string
  type: string
  location: string
  time: string
  status: 'pendente' | 'verificado' | 'resolvido'
  imageColor: string
}

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  hours: string
  icon: string
  color: string
}

export interface MapLayer {
  id: string
  name: string
  icon: string
  color: string
}

export type RiskZoneLevel = 'normal' | 'atencao' | 'moderado' | 'alto' | 'critico'

export interface RiskZone {
  id: string
  name: string
  level: RiskZoneLevel
  center: [number, number]
  radiusMeters: number
  description: string
}

export interface MapOccurrence {
  id: string
  type: string
  location: string
  time: string
  description: string
  lat: number
  lng: number
}

export interface MapShelter {
  id: string
  name: string
  address: string
  capacity: number
  lat: number
  lng: number
}

export interface RiskFactor {
  id: string
  label: string
  impact: 'baixo' | 'moderado' | 'alto'
  description: string
  points: number
}

export type DataAvailability = 'completa' | 'parcial' | 'limitada'

export interface DashboardRisk {
  region: string
  score: number
  confidence: number
  dataAvailability: DataAvailability
  lastUpdate: string
  factors: RiskFactor[]
}

export interface ChartDataPoint {
  label: string
  value: number
}

export interface AIRiskResult {
  rain: number
  flood: number
  landslide: number
  explanation: string
}
