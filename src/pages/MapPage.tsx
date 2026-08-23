import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Circle, CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  AlertTriangle,
  CloudRain,
  Thermometer,
  Wind,
  Waves,
  Mountain,
  MessageSquare,
  Home,
  Droplets,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { SENTO_SE_COORDS, mapLayers, mapMarkers, mapOccurrences, mapShelters, riskZones } from '../data/mockData'
import { fetchRealWeather, fetchRealRainLayer, type MapApiState, type RealWeatherData, type RealRainPoint } from '../data/mapApi'
import { riskZoneConfig } from '../utils/riskColors'
import 'leaflet/dist/leaflet.css'

const iconMap: Record<string, typeof CloudRain> = {
  'alert-triangle': AlertTriangle,
  'cloud-rain': CloudRain,
  thermometer: Thermometer,
  wind: Wind,
  waves: Waves,
  mountain: Mountain,
  'message-square': MessageSquare,
  home: Home,
  droplets: Droplets,
}

const shelterIcon = new L.DivIcon({
  html: `<div style="background:#eab308;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
  </div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

// Força o Leaflet a recalcular as dimensões do mapa sempre que o container
// muda de tamanho (ex: ao entrar/sair da tela cheia), evitando tiles cortados.
function MapResizeHandler({ trigger }: { trigger: boolean }) {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 250)
    return () => clearTimeout(id)
  }, [trigger, map])
  return null
}

export default function MapPage() {
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['zonas', 'relatos', 'abrigos']))
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Camadas de temperatura e ventania passam a vir de dados reais
  // (Open-Meteo, via backend ARGOS). As demais camadas do mapa continuam
  // vindo de mockData.ts - ver src/data/mapApi.ts para o motivo.
  const [weatherState, setWeatherState] = useState<MapApiState<RealWeatherData>>({ status: 'loading' })

  // Camada "Chuva": precipitação real da Open-Meteo para 3 pontos fixos
  // (GET /api/rain no backend). Ver src/data/mapApi.ts.
  const [rainState, setRainState] = useState<MapApiState<RealRainPoint[]>>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setWeatherState({ status: 'loading' })

    fetchRealWeather(SENTO_SE_COORDS[0], SENTO_SE_COORDS[1])
      .then((data) => {
        if (!cancelled) setWeatherState({ status: 'success', data })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setWeatherState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Não foi possível carregar os dados do clima.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setRainState({ status: 'loading' })

    fetchRealRainLayer()
      .then((points) => {
        if (!cancelled) setRainState({ status: 'success', data: points })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRainState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Não foi possível carregar a camada de chuva.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const toggleLayer = (id: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-[9999] flex flex-col bg-white' : 'page-container animate-fade-in'}>
      {isFullscreen ? (
        <div className="flex items-center justify-between bg-primary-700 px-4 py-3 text-white">
          <div>
            <h1 className="text-base font-bold">Mapa de Riscos</h1>
            <p className="text-xs text-white/80">Sento Sé - BA</p>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/30"
          >
            <Minimize2 size={16} />
            Sair da tela cheia
          </button>
        </div>
      ) : (
        <PageHeader title="Mapa de Riscos" subtitle="Sento Sé - BA" />
      )}

      <div className={isFullscreen ? 'relative min-h-0 flex-1' : 'px-4 pt-4'}>
        <div
          className={isFullscreen ? 'relative h-full' : 'card relative overflow-hidden'}
          style={isFullscreen ? undefined : { height: '340px' }}
        >
          {isFullscreen ? (
            <div className="absolute left-3 top-3 z-[1000] flex max-h-[calc(100%-1.5rem)] flex-col gap-1.5 overflow-y-auto rounded-2xl bg-white/95 p-2 shadow-lg backdrop-blur">
              {mapLayers.map((layer) => {
                const Icon = iconMap[layer.icon]
                const isActive = activeLayers.has(layer.id)
                return (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    title={layer.name}
                    className={`flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 text-left text-xs font-medium transition-all duration-300 ${
                      isActive
                        ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                        : 'border-transparent bg-white text-slate-600 hover:border-slate-200'
                    }`}
                  >
                    <Icon size={16} style={{ color: isActive ? layer.color : undefined }} />
                    <span className="whitespace-nowrap">{layer.name}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute right-2 top-2 z-[1000] flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 shadow-md transition-colors hover:bg-slate-50"
            >
              <Maximize2 size={14} />
              Tela cheia
            </button>
          )}

          {(activeLayers.has('temperatura') || activeLayers.has('ventania')) && weatherState.status !== 'success' && (
            <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium shadow-md">
              {weatherState.status === 'loading' && (
                <span className="text-slate-600">Carregando dados reais do clima (Open-Meteo)...</span>
              )}
              {weatherState.status === 'error' && (
                <span className="text-red-600">Erro ao carregar clima: {weatherState.message}</span>
              )}
            </div>
          )}

          {activeLayers.has('chuva') && rainState.status !== 'success' && (
            <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium shadow-md">
              {rainState.status === 'loading' && (
                <span className="text-slate-600">Carregando dados reais de chuva (Open-Meteo)...</span>
              )}
              {rainState.status === 'error' && (
                <span className="text-red-600">Erro ao carregar chuva: {rainState.message}</span>
              )}
            </div>
          )}

          <MapContainer center={SENTO_SE_COORDS} zoom={14} scrollWheelZoom={isFullscreen} style={{ height: '100%', width: '100%' }}>
            <MapResizeHandler trigger={isFullscreen} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {activeLayers.has('zonas') &&
              riskZones.map((zone) => {
                const config = riskZoneConfig[zone.level]
                return (
                  <Circle
                    key={zone.id}
                    center={zone.center}
                    radius={zone.radiusMeters}
                    pathOptions={{
                      color: config.color,
                      fillColor: config.color,
                      fillOpacity: 0.25,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <strong>{zone.name}</strong>
                      <br />
                      Nível de risco: {config.label}
                      <br />
                      {zone.description}
                    </Popup>
                  </Circle>
                )
              })}

            {activeLayers.has('chuva') &&
              rainState.status === 'success' &&
              rainState.data.map((point, i) => {
                if ('error' in point) {
                  return (
                    <CircleMarker
                      key={`chuva-${i}`}
                      center={[point.lat, point.lng]}
                      radius={6}
                      pathOptions={{ color: '#94a3b8', fillColor: '#94a3b8', fillOpacity: 0.4 }}
                    >
                      <Popup>Sem dado de chuva disponível para este ponto no momento.</Popup>
                    </CircleMarker>
                  )
                }
                // Raio proporcional à precipitação real (mm), limitado a uma faixa visível no mapa.
                const radius = Math.max(8, Math.min(30, 8 + point.precipitation * 3))
                return (
                  <CircleMarker
                    key={`chuva-${i}`}
                    center={[point.lat, point.lng]}
                    radius={radius}
                    pathOptions={{
                      color: '#3b82f6',
                      fillColor: '#3b82f6',
                      fillOpacity: 0.4,
                    }}
                  >
                    <Popup>
                      <div className="space-y-1 text-sm">
                        <div className="font-semibold">Precipitação: {point.precipitation} mm</div>
                        <div>{point.condition}</div>
                        <div className="text-xs text-gray-500">
                          Open-Meteo{point.cached ? ', em cache' : ''} — atualizado em{' '}
                          {new Date(point.lastUpdate).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}

            {activeLayers.has('temperatura') && (
              <CircleMarker
                center={SENTO_SE_COORDS}
                radius={40}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.15,
                }}
              >
                <Popup>
                  {weatherState.status === 'loading' && 'Carregando temperatura...'}
                  {weatherState.status === 'error' && 'Erro ao carregar temperatura.'}
                  {weatherState.status === 'success' && (
                    <div className="space-y-1 text-sm">
                      <div className="font-semibold">
                        {weatherState.data.temperature}°C — {weatherState.data.condition}
                      </div>
                      <div>Umidade: {weatherState.data.humidity >= 0 ? `${weatherState.data.humidity}%` : 'indisponível'}</div>
                      <div>
                        Precipitação atual:{' '}
                        {weatherState.data.precipitation >= 0 ? `${weatherState.data.precipitation} mm` : 'indisponível'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Open-Meteo{weatherState.data.cached ? ', em cache' : ''} — atualizado em{' '}
                        {new Date(weatherState.data.lastUpdate).toLocaleString('pt-BR')}
                      </div>
                      {weatherState.data.forecast.length > 0 && (
                        <div className="mt-2 border-t pt-1">
                          <div className="text-xs font-semibold">Previsão (Open-Meteo)</div>
                          {weatherState.data.forecast.slice(0, 5).map((day) => (
                            <div key={day.date} className="text-xs">
                              {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                              : {day.temperatureMin}°–{day.temperatureMax}°C, chuva {day.precipitationSum}mm ({day.condition})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Popup>
              </CircleMarker>
            )}

            {activeLayers.has('ventania') && (
              <CircleMarker
                center={SENTO_SE_COORDS}
                radius={25}
                pathOptions={{
                  color: '#8b5cf6',
                  fillColor: '#8b5cf6',
                  fillOpacity: 0.2,
                }}
              >
                <Popup>
                  {weatherState.status === 'loading' && 'Carregando vento...'}
                  {weatherState.status === 'error' && 'Erro ao carregar vento.'}
                  {weatherState.status === 'success' &&
                    `Vento atual: ${weatherState.data.windSpeed} km/h (Open-Meteo${weatherState.data.cached ? ', em cache' : ''}, ${new Date(weatherState.data.lastUpdate).toLocaleTimeString('pt-BR')})`}
                </Popup>
              </CircleMarker>
            )}

            {activeLayers.has('alagamentos') &&
              mapMarkers.alagamentos.map((m, i) => (
                <CircleMarker
                  key={`alag-${i}`}
                  center={[m.lat, m.lng]}
                  radius={10}
                  pathOptions={{
                    color: '#06b6d4',
                    fillColor: '#06b6d4',
                    fillOpacity: 0.6,
                  }}
                >
                  <Popup>Alagamento: {m.name}</Popup>
                </CircleMarker>
              ))}

            {activeLayers.has('deslizamentos') &&
              mapMarkers.deslizamentos.map((m, i) => (
                <CircleMarker
                  key={`desl-${i}`}
                  center={[m.lat, m.lng]}
                  radius={12}
                  pathOptions={{
                    color: '#f97316',
                    fillColor: '#f97316',
                    fillOpacity: 0.5,
                  }}
                >
                  <Popup>Deslizamento: {m.name}</Popup>
                </CircleMarker>
              ))}

            {activeLayers.has('relatos') &&
              mapOccurrences.map((o) => (
                <CircleMarker
                  key={o.id}
                  center={[o.lat, o.lng]}
                  radius={8}
                  pathOptions={{
                    color: '#22c55e',
                    fillColor: '#22c55e',
                    fillOpacity: 0.7,
                  }}
                >
                  <Popup>
                    <strong>{o.type}</strong>
                    <br />
                    {o.location}
                    <br />
                    {o.description}
                    <br />
                    <em>{o.time}</em>
                  </Popup>
                </CircleMarker>
              ))}

            {activeLayers.has('abrigos') &&
              mapShelters.map((s) => (
                <Marker key={s.id} position={[s.lat, s.lng]} icon={shelterIcon}>
                  <Popup>
                    <strong>{s.name}</strong>
                    <br />
                    {s.address}
                    <br />
                    Capacidade: {s.capacity} pessoas
                  </Popup>
                </Marker>
              ))}

            {activeLayers.has('rios') &&
              mapMarkers.rios.map((m, i) => (
                <CircleMarker
                  key={`rio-${i}`}
                  center={[m.lat, m.lng]}
                  radius={14}
                  pathOptions={{
                    color: '#1d4ed8',
                    fillColor: '#1d4ed8',
                    fillOpacity: 0.4,
                  }}
                >
                  <Popup>
                    {m.name}: nível {m.level}m
                  </Popup>
                </CircleMarker>
              ))}
          </MapContainer>
        </div>

        {!isFullscreen && (
          <>
            <div className="mt-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Camadas do Mapa</h3>
              <div className="grid grid-cols-2 gap-2">
                {mapLayers.map((layer) => {
                  const Icon = iconMap[layer.icon]
                  const isActive = activeLayers.has(layer.id)
                  return (
                    <button
                      key={layer.id}
                      onClick={() => toggleLayer(layer.id)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon size={18} style={{ color: isActive ? layer.color : undefined }} />
                      {layer.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 card p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Escala de Risco</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {(Object.keys(riskZoneConfig) as (keyof typeof riskZoneConfig)[]).map((level) => {
                  const config = riskZoneConfig[level]
                  return (
                    <div key={level} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      {config.label}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
