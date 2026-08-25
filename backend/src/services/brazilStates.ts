// -----------------------------------------------------------------------
// A ANA (HidroInventario) não tem parâmetro de bbox/lat/lng - só filtros
// por nome (nmEstado, nmMunicipio, nmRio, codBacia...). Para reaproveitar
// a mesma entrada de lat/lng que o resto do backend usa (mesmo padrão de
// /api/weather, /api/history), aproximamos qual estado brasileiro contém
// a coordenada usando caixas delimitadoras (bounding boxes) aproximadas -
// não é uma divisão geográfica exata (estados não são retângulos), só o
// suficiente para escolher um filtro nmEstado razoável para a busca.
//
// Nomes em MAIÚSCULO porque é assim que o inventário da ANA cadastra o
// campo Estado (ex.: "BAHIA", não "Bahia" nem "BA").
// -----------------------------------------------------------------------

export interface BrazilStateBBox {
  name: string
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export const BRAZIL_STATE_BBOXES: BrazilStateBBox[] = [
  { name: 'ACRE', minLat: -11.14, maxLat: -7.35, minLng: -73.99, maxLng: -66.62 },
  { name: 'ALAGOAS', minLat: -10.5, maxLat: -8.81, minLng: -38.24, maxLng: -35.15 },
  { name: 'AMAPA', minLat: 2.33, maxLat: 4.44, minLng: -54.88, maxLng: -49.87 },
  { name: 'AMAZONAS', minLat: -9.82, maxLat: 2.25, minLng: -73.8, maxLng: -56.09 },
  { name: 'BAHIA', minLat: -18.35, maxLat: -8.53, minLng: -46.62, maxLng: -37.34 },
  { name: 'CEARA', minLat: -7.87, maxLat: -2.78, minLng: -41.42, maxLng: -37.25 },
  { name: 'DISTRITO FEDERAL', minLat: -16.05, maxLat: -15.5, minLng: -48.29, maxLng: -47.31 },
  { name: 'ESPIRITO SANTO', minLat: -21.3, maxLat: -17.89, minLng: -41.88, maxLng: -39.65 },
  { name: 'GOIAS', minLat: -19.5, maxLat: -12.39, minLng: -53.25, maxLng: -45.9 },
  { name: 'MARANHAO', minLat: -10.26, maxLat: -1.04, minLng: -48.76, maxLng: -41.79 },
  { name: 'MATO GROSSO', minLat: -18.04, maxLat: -7.35, minLng: -61.63, maxLng: -50.22 },
  { name: 'MATO GROSSO DO SUL', minLat: -24.07, maxLat: -17.17, minLng: -58.17, maxLng: -50.92 },
  { name: 'MINAS GERAIS', minLat: -22.92, maxLat: -14.23, minLng: -51.05, maxLng: -39.86 },
  { name: 'PARA', minLat: -9.84, maxLat: 2.59, minLng: -58.9, maxLng: -46.06 },
  { name: 'PARAIBA', minLat: -8.3, maxLat: -6.02, minLng: -38.77, maxLng: -34.79 },
  { name: 'PARANA', minLat: -26.72, maxLat: -22.51, minLng: -54.62, maxLng: -48.02 },
  { name: 'PERNAMBUCO', minLat: -9.47, maxLat: -7.26, minLng: -41.36, maxLng: -34.8 },
  { name: 'PIAUI', minLat: -10.93, maxLat: -2.74, minLng: -45.99, maxLng: -40.37 },
  { name: 'RIO DE JANEIRO', minLat: -23.37, maxLat: -20.76, minLng: -44.89, maxLng: -40.96 },
  { name: 'RIO GRANDE DO NORTE', minLat: -6.98, maxLat: -4.83, minLng: -38.58, maxLng: -34.97 },
  { name: 'RIO GRANDE DO SUL', minLat: -33.75, maxLat: -27.08, minLng: -57.65, maxLng: -49.69 },
  { name: 'RONDONIA', minLat: -13.69, maxLat: -7.97, minLng: -66.81, maxLng: -59.77 },
  { name: 'RORAIMA', minLat: 1.36, maxLat: 5.27, minLng: -64.82, maxLng: -58.87 },
  { name: 'SANTA CATARINA', minLat: -29.35, maxLat: -25.95, minLng: -53.83, maxLng: -48.35 },
  { name: 'SAO PAULO', minLat: -25.32, maxLat: -19.78, minLng: -53.11, maxLng: -44.16 },
  { name: 'SERGIPE', minLat: -11.57, maxLat: -9.51, minLng: -38.24, maxLng: -36.39 },
  { name: 'TOCANTINS', minLat: -13.47, maxLat: -5.17, minLng: -50.74, maxLng: -45.7 },
]

// Retorna o nome do estado cuja bbox contém [lat, lng]. Se a coordenada
// não cair em nenhuma bbox (ex.: fora do Brasil, ou numa faixa de
// sobreposição não coberta), retorna `null` - nesse caso a busca de
// estação segue sem filtro de estado (ver riverService.ts).
export function findBrazilStateForCoords(lat: number, lng: number): string | null {
  const match = BRAZIL_STATE_BBOXES.find(
    (state) => lat >= state.minLat && lat <= state.maxLat && lng >= state.minLng && lng <= state.maxLng
  )
  return match?.name ?? null
}
