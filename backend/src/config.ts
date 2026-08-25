// Configuração central do backend. Lê variáveis de ambiente e reaproveita
// a coordenada de teste já existente no frontend (mockData.ts), conforme
// exigido: "NÃO invente novas coordenadas se as coordenadas existentes
// puderem ser reutilizadas."

export const PORT = Number(process.env.PORT ?? 3001)

export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

export const WEATHER_CACHE_MINUTES = Number(process.env.WEATHER_CACHE_MINUTES ?? 15)

// Cache da página Histórico (7d/3m/1y). Mais longo que o do clima atual
// porque são dados do passado (não mudam de um minuto para o outro) - só
// precisa ser atualizado algumas vezes por dia para a janela deslizante
// (7d/3m/1y) acompanhar o avanço do "hoje".
export const HISTORY_CACHE_HOURS = Number(process.env.HISTORY_CACHE_HOURS ?? 12)

// Cache de leitura de GET /api/rivers (nível de rio via ANA - webservice
// legado). Mesma lógica de WEATHER_CACHE_MINUTES: evita bater no
// webservice da ANA a cada requisição. Cobre também o caso "sem
// cobertura" (status "no-data"), para não repetir a mesma busca de
// estações sem resultado a cada requisição.
export const RIVER_CACHE_MINUTES = Number(process.env.RIVER_CACHE_MINUTES ?? 30)

// Mesma coordenada de src/data/mockData.ts (SENTO_SE_COORDS).
// Mantida em [lat, lng], igual ao frontend.
export const SENTO_SE_COORDS: [number, number] = [-9.7436, -42.2564]
export const SENTO_SE_CITY = 'Sento Sé'
export const SENTO_SE_STATE = 'BA'

// Pontos da camada "Chuva" do mapa - reaproveita EXATAMENTE as mesmas 3
// coordenadas que já existiam como mock em src/data/mockData.ts
// (mapMarkers.chuva), para não inventar geometria nova. Quantidade
// controlada de pontos (3), igual ao mock que está sendo substituído.
export const RAIN_LAYER_POINTS: Array<{ lat: number; lng: number }> = [
  { lat: -9.741, lng: -42.254 },
  { lat: -9.746, lng: -42.258 },
  { lat: -9.738, lng: -42.261 },
]

export const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast'

// Historical Weather API (dados reais do passado, ERA5/IFS) - endpoint
// diferente do forecast acima. Ver services/history/openMeteoHistorySource.ts.
export const OPEN_METEO_ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'

// Cache de leitura de GET /api/earthquakes (USGS Earthquake Catalog).
// Mesma lógica de WEATHER_CACHE_MINUTES/RIVER_CACHE_MINUTES: evita bater
// no catálogo da USGS a cada requisição para a mesma janela de busca.
export const EARTHQUAKE_CACHE_MINUTES = Number(process.env.EARTHQUAKE_CACHE_MINUTES ?? 30)

// Janela de tempo padrão (em dias) e magnitude mínima padrão usadas quando
// a rota não informa `days`/`minmagnitude`. 30 dias é uma janela razoável
// para não perder eventos recentes relevantes; magnitude 2.5 é o corte
// comum da própria USGS para separar ruído de sismos efetivamente sentidos
// ou registrados por múltiplas estações.
export const EARTHQUAKE_DEFAULT_DAYS = 30
export const EARTHQUAKE_DEFAULT_MIN_MAGNITUDE = 2.5

// Bounding box aproximado do território brasileiro (inclui parte do
// oceano ao redor, para não cortar eventos costeiros/de plataforma
// continental). Usado como default de GET /api/earthquakes: hoje o ARGOS
// está setado para Sento Sé (BA), mas atividade sísmica não é um dado
// "pontual" como chuva/rio - faz sentido já cobrir o país inteiro, já que
// esse dado será expandido para o Brasil todo no futuro.
export const BRAZIL_BBOX = {
  minLatitude: -34,
  maxLatitude: 6,
  minLongitude: -74,
  maxLongitude: -34,
} as const

// Cache de leitura de GET /api/landslide-susceptibility (CPRM/SGB - OGC API,
// coleção "Suscetibilidade a Movimento de Massa"). Mesma lógica das outras
// *_CACHE_MINUTES: este dado é uma cartografia (não muda de um minuto para
// o outro), então um cache bem mais longo que o de clima é aceitável -
// ainda assim mantido configurável.
export const LANDSLIDE_CACHE_MINUTES = Number(process.env.LANDSLIDE_CACHE_MINUTES ?? 720)

// ID da coleção no OGC API do SGB/CPRM foi removido daqui: a integração de
// deslizamento passou a usar o serviço ArcGIS REST da CPRM
// (geoportal.cprm.gov.br), cuja URL fica em
// integrations/external/cprm-movimento-massa/service.ts (mesmo padrão de
// USGS_EARTHQUAKE_CATALOG_BASE_URL). Ver histórico em landslideService.ts
// para o porquê da troca.

// "Raio" (em graus) do bounding box usado para consultar a coleção CPRM ao
// redor de um ponto [lat,lng] - a OGC API não tem uma busca "mais próximo
// de", só filtro por bbox (mesma limitação estrutural da ANA em
// riverService.ts, que filtra por estado em vez de bbox). ~0.05 grau é
// aproximadamente 5-6km no equador, suficiente para cobrir o município que
// contém o ponto sem trazer volume desnecessário de polígonos vizinhos.
export const LANDSLIDE_BBOX_BUFFER_DEGREES = 0.05

// CASCA - NÃO USADO AINDA. Reservado para a futura IA de planejamento de
// rotas seguras (ver services/routePlanningService.ts e
// integrations/external/google-routes/). Nenhuma chamada real é feita com
// isso agora. GOOGLE_MAPS_API_KEY precisa ser adicionada ao .env quando a
// integração for implementada de fato (Google Cloud Console, com
// faturamento habilitado - a Routes API não é gratuita).
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? ''
