import type {
  Alert,
  DashboardRisk,
  EmergencyContact,
  MapLayer,
  MapOccurrence,
  MapShelter,
  Report,
  RiskZone,
  WeatherData,
} from '../types'

export const SENTO_SE_COORDS: [number, number] = [-9.7436, -42.2564]

export const weatherData: WeatherData = {
  temperature: 28,
  condition: 'Parcialmente Nublado',
  humidity: 72,
  windSpeed: 32,
  city: 'Sento Sé',
  state: 'BA',
  riskLevel: 'laranja',
  lastUpdate: '11/06/2026 às 14:32',
}

// Pontuação de risco do dashboard (0-100), na mesma escala de 5 níveis usada no mapa
// (0-20 Normal, 21-40 Atenção, 41-60 Moderado, 61-80 Alto, 81-100 Crítico).
// Mock organizado para futura substituição pela API de cálculo de risco.
export const dashboardRisk: DashboardRisk = {
  region: 'Centro, Sento Sé - BA',
  score: 68,
  confidence: 87,
  dataAvailability: 'parcial',
  lastUpdate: '11/06/2026 às 14:32',
  factors: [
    {
      id: 'fator-1',
      label: 'Chuva intensa prevista',
      impact: 'alto',
      points: 27,
      description: 'Volume estimado de 40-60mm nas próximas 2 horas.',
    },
    {
      id: 'fator-2',
      label: 'Proximidade de rios monitorados',
      impact: 'moderado',
      points: 18,
      description: 'Distância média de 850m das margens do Rio Piauí e do Rio do Peixe.',
    },
    {
      id: 'fator-3',
      label: 'Histórico recente de alagamentos',
      impact: 'moderado',
      points: 14,
      description: '3 ocorrências registradas nos últimos 30 dias na região central.',
    },
    {
      id: 'fator-4',
      label: 'Baixa capacidade de absorção do solo',
      impact: 'baixo',
      points: 9,
      description: 'Área urbanizada do centro reduz a infiltração de água da chuva.',
    },
  ],
}

export const alerts: Alert[] = [
  {
    id: '1',
    category: 'Alagamento',
    level: 'laranja',
    region: 'Centro',
    period: '18h – 21h',
    reason: 'Chuva intensa prevista (40-60mm) e relatos recentes de alagamento na região central.',
    recommendation: 'Evite deslocamentos pela região durante o período indicado. Prefira rotas alternativas.',
    time: 'Válido até 21:00',
  },
  {
    id: '2',
    category: 'Ventania',
    level: 'amarelo',
    region: 'Zona Central',
    period: '15h – 18h',
    reason: 'Rajadas de vento de até 45 km/h previstas, com risco de queda de galhos e objetos soltos.',
    recommendation: 'Evite permanecer próximo a árvores de grande porte e estruturas soltas.',
    time: 'Válido até 18:00',
  },
  {
    id: '3',
    category: 'Deslizamento',
    level: 'verde',
    region: 'Morro do Cruzeiro',
    period: 'Próximas 24h',
    reason: 'Encosta monitorada após relato pontual, sem sinais de instabilidade adicional no momento.',
    recommendation: 'Nenhuma ação necessária. Situação sob monitoramento de rotina.',
    time: 'Atualizado agora',
  },
  {
    id: '4',
    category: 'Rio Piauí',
    level: 'vermelho',
    region: 'Margem do Rio Piauí',
    period: '18h – 06h',
    reason: 'Nível do rio elevado (2,4m) combinado com previsão de chuva intensa nas próximas horas.',
    recommendation: 'Moradores próximos à margem devem se preparar para deslocamento a um abrigo, se necessário.',
    time: 'Válido até 06:00',
  },
]

export const reports: Report[] = [
  {
    id: '1',
    type: 'Rua alagada',
    location: 'Rua da Matriz, Centro',
    time: 'Há 15 min',
    status: 'verificado',
    imageColor: '#3b82f6',
  },
  {
    id: '2',
    type: 'Árvore caída',
    location: 'Av. Principal, Bairro Novo',
    time: 'Há 42 min',
    status: 'pendente',
    imageColor: '#22c55e',
  },
  {
    id: '3',
    type: 'Falta de energia',
    location: 'Rua do Comércio, Centro',
    time: 'Há 1h',
    status: 'verificado',
    imageColor: '#eab308',
  },
  {
    id: '4',
    type: 'Acidente',
    location: 'BR-235, Km 12',
    time: 'Há 2h',
    status: 'resolvido',
    imageColor: '#ef4444',
  },
  {
    id: '5',
    type: 'Ponte interditada',
    location: 'Ponte sobre o Rio Piauí',
    time: 'Há 3h',
    status: 'verificado',
    imageColor: '#f97316',
  },
]

export const emergencyContacts: EmergencyContact[] = [
  {
    id: '1',
    name: 'Defesa Civil',
    phone: '199',
    hours: '24 horas',
    icon: 'shield',
    color: 'from-blue-600 to-blue-700',
  },
  {
    id: '2',
    name: 'Bombeiros',
    phone: '193',
    hours: '24 horas',
    icon: 'flame',
    color: 'from-red-600 to-red-700',
  },
  {
    id: '3',
    name: 'SAMU',
    phone: '192',
    hours: '24 horas',
    icon: 'heart-pulse',
    color: 'from-emerald-600 to-emerald-700',
  },
  {
    id: '4',
    name: 'Polícia',
    phone: '190',
    hours: '24 horas',
    icon: 'shield-check',
    color: 'from-slate-700 to-slate-800',
  },
]

export const mapLayers: MapLayer[] = [
  { id: 'zonas', name: 'Áreas de Risco', icon: 'alert-triangle', color: '#f97316' },
  { id: 'chuva', name: 'Chuva', icon: 'cloud-rain', color: '#3b82f6' },
  { id: 'temperatura', name: 'Temperatura', icon: 'thermometer', color: '#ef4444' },
  { id: 'ventania', name: 'Ventania', icon: 'wind', color: '#8b5cf6' },
  { id: 'alagamentos', name: 'Alagamentos', icon: 'waves', color: '#06b6d4' },
  { id: 'deslizamentos', name: 'Deslizamentos', icon: 'mountain', color: '#f97316' },
  { id: 'relatos', name: 'Relatos', icon: 'message-square', color: '#22c55e' },
  { id: 'abrigos', name: 'Abrigos', icon: 'home', color: '#eab308' },
  { id: 'rios', name: 'Nível dos Rios', icon: 'droplets', color: '#1d4ed8' },
]

// Regiões/áreas de risco do mapa, na escala de 5 níveis: normal, atencao, moderado, alto, critico.
// Mock organizado para futura substituição por API de geointeligência de risco.
export const riskZones: RiskZone[] = [
  {
    id: 'zona-1',
    name: 'Centro',
    level: 'alto',
    center: [-9.7436, -42.2564],
    radiusMeters: 450,
    description: 'Histórico recente de alagamentos e proximidade de área baixa da cidade.',
  },
  {
    id: 'zona-2',
    name: 'Bairro Novo',
    level: 'moderado',
    center: [-9.746, -42.259],
    radiusMeters: 380,
    description: 'Chuva moderada prevista, sem ocorrências ativas no momento.',
  },
  {
    id: 'zona-3',
    name: 'Margem do Rio Piauí',
    level: 'critico',
    center: [-9.741, -42.262],
    radiusMeters: 300,
    description: 'Nível do rio elevado e previsão de chuva intensa nas próximas horas.',
  },
  {
    id: 'zona-4',
    name: 'Morro do Cruzeiro',
    level: 'atencao',
    center: [-9.748, -42.252],
    radiusMeters: 350,
    description: 'Encosta monitorada após relato de deslizamento pontual.',
  },
  {
    id: 'zona-5',
    name: 'Zona Sul',
    level: 'normal',
    center: [-9.739, -42.253],
    radiusMeters: 400,
    description: 'Sem indicadores de risco no momento.',
  },
]

export const mapOccurrences: MapOccurrence[] = [
  {
    id: 'oc-1',
    type: 'Árvore caída',
    location: 'Rua da Matriz, Centro',
    time: 'Há 15 min',
    description: 'Árvore de grande porte bloqueando parte da via.',
    lat: -9.74,
    lng: -42.257,
  },
  {
    id: 'oc-2',
    type: 'Falta de energia',
    location: 'Av. Principal, Bairro Novo',
    time: 'Há 42 min',
    description: 'Quarteirão sem energia após rajadas de vento.',
    lat: -9.744,
    lng: -42.26,
  },
]

export const mapShelters: MapShelter[] = [
  {
    id: 'abr-1',
    name: 'Ginásio Municipal',
    address: 'Rua Coronel Franklin, Centro',
    capacity: 120,
    lat: -9.743,
    lng: -42.256,
  },
  {
    id: 'abr-2',
    name: 'Escola Municipal',
    address: 'Av. das Acácias, Bairro Novo',
    capacity: 80,
    lat: -9.739,
    lng: -42.253,
  },
]

export const mapMarkers = {
  // "chuva" removido daqui: a camada Chuva agora usa dados reais da
  // Open-Meteo via GET /api/rain (backend/src/routes/rain.ts), com as
  // mesmas 3 coordenadas que estavam aqui. Ver src/data/mapApi.ts.
  alagamentos: [
    { lat: -9.742, lng: -42.255, name: 'Rua da Matriz' },
    { lat: -9.745, lng: -42.259, name: 'Av. Principal' },
  ],
  deslizamentos: [
    { lat: -9.748, lng: -42.252, name: 'Morro do Cruzeiro' },
  ],
  rios: [
    { lat: -9.741, lng: -42.262, name: 'Rio Piauí', level: 2.4 },
    { lat: -9.747, lng: -42.251, name: 'Rio do Peixe', level: 1.8 },
  ],
}

export function getChartData(period: '7d' | '3m' | '1y') {
  const data = {
    '7d': {
      rain: [
        { label: 'Seg', value: 12 },
        { label: 'Ter', value: 45 },
        { label: 'Qua', value: 8 },
        { label: 'Qui', value: 62 },
        { label: 'Sex', value: 28 },
        { label: 'Sáb', value: 15 },
        { label: 'Dom', value: 38 },
      ],
      riverLevel: [
        { label: 'Seg', value: 2.1 },
        { label: 'Ter', value: 2.3 },
        { label: 'Qua', value: 2.0 },
        { label: 'Qui', value: 2.6 },
        { label: 'Sex', value: 2.4 },
        { label: 'Sáb', value: 2.2 },
        { label: 'Dom', value: 2.5 },
      ],
      temperature: [
        { label: 'Seg', value: 29 },
        { label: 'Ter', value: 31 },
        { label: 'Qua', value: 28 },
        { label: 'Qui', value: 27 },
        { label: 'Sex', value: 30 },
        { label: 'Sáb', value: 32 },
        { label: 'Dom', value: 28 },
      ],
      wind: [
        { label: 'Seg', value: 18 },
        { label: 'Ter', value: 32 },
        { label: 'Qua', value: 22 },
        { label: 'Qui', value: 45 },
        { label: 'Sex', value: 28 },
        { label: 'Sáb', value: 15 },
        { label: 'Dom', value: 38 },
      ],
      occurrences: [
        { label: 'Seg', value: 2 },
        { label: 'Ter', value: 5 },
        { label: 'Qua', value: 1 },
        { label: 'Qui', value: 8 },
        { label: 'Sex', value: 3 },
        { label: 'Sáb', value: 2 },
        { label: 'Dom', value: 6 },
      ],
    },
    '3m': {
      rain: [
        { label: 'Abr', value: 180 },
        { label: 'Mai', value: 320 },
        { label: 'Jun', value: 245 },
      ],
      riverLevel: [
        { label: 'Abr', value: 2.0 },
        { label: 'Mai', value: 2.8 },
        { label: 'Jun', value: 2.4 },
      ],
      temperature: [
        { label: 'Abr', value: 30 },
        { label: 'Mai', value: 28 },
        { label: 'Jun', value: 27 },
      ],
      wind: [
        { label: 'Abr', value: 25 },
        { label: 'Mai', value: 35 },
        { label: 'Jun', value: 28 },
      ],
      occurrences: [
        { label: 'Abr', value: 12 },
        { label: 'Mai', value: 28 },
        { label: 'Jun', value: 18 },
      ],
    },
    '1y': {
      rain: [
        { label: 'Jul', value: 45 },
        { label: 'Ago', value: 12 },
        { label: 'Set', value: 8 },
        { label: 'Out', value: 35 },
        { label: 'Nov', value: 78 },
        { label: 'Dez', value: 120 },
        { label: 'Jan', value: 95 },
        { label: 'Fev', value: 65 },
        { label: 'Mar', value: 42 },
        { label: 'Abr', value: 180 },
        { label: 'Mai', value: 320 },
        { label: 'Jun', value: 245 },
      ],
      riverLevel: [
        { label: 'Jul', value: 1.8 },
        { label: 'Ago', value: 1.6 },
        { label: 'Set', value: 1.5 },
        { label: 'Out', value: 1.9 },
        { label: 'Nov', value: 2.2 },
        { label: 'Dez', value: 2.6 },
        { label: 'Jan', value: 2.5 },
        { label: 'Fev', value: 2.3 },
        { label: 'Mar', value: 2.1 },
        { label: 'Abr', value: 2.0 },
        { label: 'Mai', value: 2.8 },
        { label: 'Jun', value: 2.4 },
      ],
      temperature: [
        { label: 'Jul', value: 26 },
        { label: 'Ago', value: 28 },
        { label: 'Set', value: 30 },
        { label: 'Out', value: 31 },
        { label: 'Nov', value: 29 },
        { label: 'Dez', value: 28 },
        { label: 'Jan', value: 30 },
        { label: 'Fev', value: 31 },
        { label: 'Mar', value: 30 },
        { label: 'Abr', value: 30 },
        { label: 'Mai', value: 28 },
        { label: 'Jun', value: 27 },
      ],
      wind: [
        { label: 'Jul', value: 15 },
        { label: 'Ago', value: 18 },
        { label: 'Set', value: 22 },
        { label: 'Out', value: 20 },
        { label: 'Nov', value: 28 },
        { label: 'Dez', value: 25 },
        { label: 'Jan', value: 30 },
        { label: 'Fev', value: 32 },
        { label: 'Mar', value: 28 },
        { label: 'Abr', value: 25 },
        { label: 'Mai', value: 35 },
        { label: 'Jun', value: 28 },
      ],
      occurrences: [
        { label: 'Jul', value: 5 },
        { label: 'Ago', value: 3 },
        { label: 'Set', value: 2 },
        { label: 'Out', value: 8 },
        { label: 'Nov', value: 15 },
        { label: 'Dez', value: 22 },
        { label: 'Jan', value: 18 },
        { label: 'Fev', value: 10 },
        { label: 'Mar', value: 8 },
        { label: 'Abr', value: 12 },
        { label: 'Mai', value: 28 },
        { label: 'Jun', value: 18 },
      ],
    },
  }
  return data[period]
}

export const aiInputs = {
  rainForecast: '40-60mm nas próximas 6h',
  humidity: '72%',
  regionHistory: '3 eventos de alagamento nos últimos 30 dias',
  riverProximity: 'Distância média de 850m dos rios monitorados',
}

export const aiResults = {
  rain: 78,
  flood: 52,
  landslide: 15,
  explanation:
    'Com base na previsão de chuva intensa (40-60mm), umidade elevada (72%) e histórico recente de alagamentos na região central de Sento Sé, o sistema identifica risco elevado de chuva (78%) e moderado de alagamento (52%). A proximidade dos rios Piauí e do Peixe amplifica o risco hidrológico. O risco de deslizamento permanece baixo (15%) devido à topografia plana predominante na área urbana.',
}
