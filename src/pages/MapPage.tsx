import { useEffect, useRef, useState } from 'react'
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
  Activity,
  LocateFixed,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { SENTO_SE_COORDS, mapLayers, mapMarkers, mapOccurrences, mapShelters, riskZones } from '../data/mockData'
import {
  fetchRealWeather,
  fetchRealRainLayer,
  fetchRealRivers,
  fetchRealEarthquakes,
  fetchRealLandslideSusceptibility,
  type MapApiState,
  type RealWeatherData,
  type RealRainPoint,
  type RealRiver,
  type RealEarthquakeEvent,
  type LandslideApiResponse,
} from '../data/mapApi'
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
  activity: Activity,
}

const shelterIcon = new L.DivIcon({
  html: `<div style="background:#eab308;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
  </div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

// Ícone de pin para a localização real do usuário (via navigator.geolocation).
const userLocationIcon = new L.DivIcon({
  html: `<div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(59,130,246,0.25)"></div>
    <div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>
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

// Captura a instância do mapa Leaflet (via useMap, só funciona dentro do
// MapContainer) e repassa pro componente pai através de callback, para que
// o botão "Minha localização" (renderizado fora do MapContainer, como
// overlay HTML normal) consiga chamar flyTo nela.
function MapInstanceCapture({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap()
  useEffect(() => {
    onReady(map)
  }, [map, onReady])
  return null
}

export default function MapPage() {
  // Nenhuma camada vem ativada por padrão - o usuário decide o que quer ver.
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Some depois de 5s: quando uma camada é ativada, a mensagem de status
  // que aparece embaixo do mapa (loading/erro/sucesso/mock) deve
  // desaparecer sozinha após 5 segundos - evita poluir o mapa com uma
  // caixa de texto grudada na tela indefinidamente. Se a camada for
  // desativada e reativada, a mensagem volta a aparecer do zero.
  const [hiddenMessageLayers, setHiddenMessageLayers] = useState<Set<string>>(new Set())
  const messageTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    activeLayers.forEach((layerId) => {
      if (messageTimersRef.current.has(layerId)) return
      setHiddenMessageLayers((prev) => {
        if (!prev.has(layerId)) return prev
        const next = new Set(prev)
        next.delete(layerId)
        return next
      })
      const timer = setTimeout(() => {
        setHiddenMessageLayers((prev) => new Set(prev).add(layerId))
        messageTimersRef.current.delete(layerId)
      }, 5000)
      messageTimersRef.current.set(layerId, timer)
    })

    messageTimersRef.current.forEach((timer, layerId) => {
      if (activeLayers.has(layerId)) return
      clearTimeout(timer)
      messageTimersRef.current.delete(layerId)
      setHiddenMessageLayers((prev) => {
        if (!prev.has(layerId)) return prev
        const next = new Set(prev)
        next.delete(layerId)
        return next
      })
    })
  }, [activeLayers])

  useEffect(() => {
    const timers = messageTimersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  // Instância do mapa Leaflet, capturada via MapInstanceCapture - usada
  // pelo botão "Minha localização" para centralizar (flyTo) sem mudar o
  // center/zoom padrão do MapContainer, que continua fixo em Sento Sé.
  const mapInstanceRef = useRef<L.Map | null>(null)

  // Localização real do usuário, via API de geolocalização do navegador.
  // Não depende do backend - é lida direto do dispositivo.
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não é suportada neste navegador.')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude])
        setLocationError(null)
      },
      (err) => {
        setLocationError(err.message || 'Não foi possível obter sua localização.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Camadas de temperatura e ventania passam a vir de dados reais
  // (Open-Meteo, via backend ARGOS). As demais camadas do mapa continuam
  // vindo de mockData.ts - ver src/data/mapApi.ts para o motivo.
  const [weatherState, setWeatherState] = useState<MapApiState<RealWeatherData>>({ status: 'loading' })

  // Camada "Chuva": precipitação real da Open-Meteo para 3 pontos fixos
  // (GET /api/rain no backend). Ver src/data/mapApi.ts.
  const [rainState, setRainState] = useState<MapApiState<RealRainPoint[]>>({ status: 'loading' })
  const [riverState, setRiverState] = useState<MapApiState<RealRiver[]>>({ status: 'loading' })

  // Camada "Terremotos": eventos sísmicos reais da USGS (GET /api/earthquakes,
  // bounding box do Brasil inteiro por padrão). Ver src/data/mapApi.ts.
  const [earthquakeState, setEarthquakeState] = useState<MapApiState<RealEarthquakeEvent[]>>({ status: 'loading' })

  // Camada "Deslizamentos": suscetibilidade real do SGB/CPRM para o ponto
  // de Sento Sé (GET /api/landslide-susceptibility). Ver src/data/mapApi.ts.
  const [landslideState, setLandslideState] = useState<MapApiState<LandslideApiResponse>>({ status: 'loading' })

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

  useEffect(() => {
    let cancelled = false
    setRiverState({ status: 'loading' })
    fetchRealRivers(SENTO_SE_COORDS[0], SENTO_SE_COORDS[1])
      .then((result) => {
        if (cancelled) return
        setRiverState({ status: 'success', data: result.status === 'no-data' || !result.data ? [] : [result.data] })
      })
      .catch((err: unknown) => {
        if (!cancelled) setRiverState({ status: 'error', message: err instanceof Error ? err.message : 'Não foi possível carregar os dados dos rios.' })
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setEarthquakeState({ status: 'loading' })
    fetchRealEarthquakes()
      .then((result) => {
        if (!cancelled) setEarthquakeState({ status: 'success', data: result.events })
      })
      .catch((err: unknown) => {
        if (!cancelled) setEarthquakeState({ status: 'error', message: err instanceof Error ? err.message : 'Não foi possível carregar os dados de terremotos.' })
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLandslideState({ status: 'loading' })
    fetchRealLandslideSusceptibility(SENTO_SE_COORDS[0], SENTO_SE_COORDS[1])
      .then((result) => {
        if (!cancelled) setLandslideState({ status: 'success', data: result })
      })
      .catch((err: unknown) => {
        if (!cancelled) setLandslideState({ status: 'error', message: err instanceof Error ? err.message : 'Não foi possível carregar a suscetibilidade a deslizamento.' })
      })
    return () => { cancelled = true }
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
          className={isFullscreen ? 'relative h-full' : 'card relative overflow-hidden map-hide-attribution'}
          style={isFullscreen ? undefined : { height: '340px' }}
        >
          {isFullscreen ? (
            <>
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
              {userLocation && (
                <button
                  onClick={() => mapInstanceRef.current?.flyTo(userLocation, 16)}
                  title="Centralizar na minha localização"
                  className="absolute right-2 top-2 z-[1000] flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 shadow-md transition-colors hover:bg-slate-50"
                >
                  <LocateFixed size={14} className="text-blue-600" />
                  Minha localização
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setIsFullscreen(true)}
                className="absolute right-2 top-2 z-[1000] flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 shadow-md transition-colors hover:bg-slate-50"
              >
                <Maximize2 size={14} />
                Tela cheia
              </button>
              {userLocation && (
                <button
                  onClick={() => mapInstanceRef.current?.flyTo(userLocation, 16)}
                  title="Centralizar na minha localização - o mapa fica em Sento Sé por padrão, então sua posição real pode estar fora da área visível"
                  className="absolute right-2 top-12 z-[1000] flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 shadow-md transition-colors hover:bg-slate-50"
                >
                  <LocateFixed size={14} className="text-blue-600" />
                  Minha localização
                </button>
              )}
            </>
          )}

          {activeLayers.has('zonas') && !hiddenMessageLayers.has('zonas') && (
            <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium italic text-slate-500 shadow-md">
              Mock - Dados não reais.
            </div>
          )}

          {activeLayers.has('temperatura') && !hiddenMessageLayers.has('temperatura') && (
            <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium shadow-md">
              {weatherState.status === 'loading' && (
                <span className="text-slate-600">Carregando dados reais de temperatura (Open-Meteo)...</span>
              )}
              {weatherState.status === 'error' && (
                <span className="text-red-600">Não foi possível atualizar a temperatura. {weatherState.message}</span>
              )}
              {weatherState.status === 'success' && (
                <span className="text-emerald-700">Temperatura atualizada com dados reais (Open-Meteo).</span>
              )}
            </div>
          )}

          {activeLayers.has('ventania') && !hiddenMessageLayers.has('ventania') && (
            <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium shadow-md">
              {weatherState.status === 'loading' && (
                <span className="text-slate-600">Carregando dados reais de ventania (Open-Meteo)...</span>
              )}
              {weatherState.status === 'error' && (
                <span className="text-red-600">Não foi possível atualizar a ventania. {weatherState.message}</span>
              )}
              {weatherState.status === 'success' && (
                <span className="text-emerald-700">Ventania atualizada com dados reais (Open-Meteo).</span>
              )}
            </div>
          )}

          {activeLayers.has('chuva') && !hiddenMessageLayers.has('chuva') && (
            <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium shadow-md">
              {rainState.status === 'loading' && (
                <span className="text-slate-600">Carregando dados reais de chuva (Open-Meteo)...</span>
              )}
              {rainState.status === 'error' && (
                <span className="text-red-600">Não foi possível atualizar a chuva. {rainState.message}</span>
              )}
              {rainState.status === 'success' && rainState.data.length === 0 && (
                <span className="text-amber-700">Não existem dados de chuva disponíveis para esta região.</span>
              )}
              {rainState.status === 'success' && rainState.data.length > 0 && (
                <span className="text-emerald-700">Chuva atualizada com dados reais (Open-Meteo).</span>
              )}
            </div>
          )}

          {activeLayers.has('alagamentos') && !hiddenMessageLayers.has('alagamentos') && (
            <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium italic text-slate-500 shadow-md">
              Mock - Dados não reais.
            </div>
          )}

          {activeLayers.has('rios') && !hiddenMessageLayers.has('rios') && (
            <div className="absolute bottom-2 left-2 z-[1000] max-w-[calc(100%-1rem)] rounded-lg bg-white/95 px-3 py-2 text-xs font-medium shadow-md backdrop-blur">
              {riverState.status === 'loading' && <span className="text-slate-600">Carregando dados reais dos rios...</span>}
              {riverState.status === 'error' && <span className="text-red-600">Não foi possível atualizar os níveis dos rios. {riverState.message}</span>}
              {riverState.status === 'success' && riverState.data.length === 0 && <span className="text-amber-700">Não existem dados de nível dos rios disponíveis para esta região.</span>}
              {riverState.status === 'success' && riverState.data.length > 0 && <span className="text-emerald-700">Níveis dos rios atualizados com dados reais.</span>}
            </div>
          )}

          {activeLayers.has('sismos') && !hiddenMessageLayers.has('sismos') && (
            <div className="absolute bottom-2 left-2 z-[1000] max-w-[calc(100%-1rem)] rounded-lg bg-white/95 px-3 py-2 text-xs font-medium shadow-md backdrop-blur">
              {earthquakeState.status === 'loading' && <span className="text-slate-600">Carregando dados reais de sismos (USGS)...</span>}
              {earthquakeState.status === 'error' && <span className="text-red-600">Não foi possível atualizar os sismos. {earthquakeState.message}</span>}
              {earthquakeState.status === 'success' && earthquakeState.data.length === 0 && <span className="text-amber-700">Nenhum sismo registrado no período/janela consultada.</span>}
              {earthquakeState.status === 'success' && earthquakeState.data.length > 0 && <span className="text-emerald-700">Sismos atualizados com dados reais (USGS).</span>}
            </div>
          )}

          {activeLayers.has('relatos') && !hiddenMessageLayers.has('relatos') && (
            <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium italic text-slate-500 shadow-md">
              Mock - Dados não reais.
            </div>
          )}

          {activeLayers.has('abrigos') && !hiddenMessageLayers.has('abrigos') && (
            <div className="absolute bottom-2 left-2 z-[1000] rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium italic text-slate-500 shadow-md">
              Mock - Dados não reais.
            </div>
          )}

          {locationError && (
            <div className="absolute bottom-2 left-2 z-[1000] max-w-[calc(100%-1rem)] rounded-lg bg-white/95 px-3 py-2 text-xs font-medium shadow-md backdrop-blur">
              <span className="text-red-600">Localização: {locationError}</span>
            </div>
          )}

          {activeLayers.has('deslizamentos') && !hiddenMessageLayers.has('deslizamentos') && (
            <div className="absolute bottom-2 left-2 z-[1000] max-w-[calc(100%-1rem)] rounded-lg bg-white/95 px-3 py-2 text-xs font-medium shadow-md backdrop-blur">
              {landslideState.status === 'loading' && <span className="text-slate-600">Carregando suscetibilidade real a deslizamento (SGB/CPRM)...</span>}
              {landslideState.status === 'error' && <span className="text-red-600">Não foi possível atualizar a suscetibilidade a deslizamento. {landslideState.message}</span>}
              {landslideState.status === 'success' && landslideState.data.status === 'no-data' && <span className="text-amber-700">Sem carta de suscetibilidade a deslizamento publicada para esta região.</span>}
              {landslideState.status === 'success' && landslideState.data.status === 'ok' && <span className="text-emerald-700">Suscetibilidade a deslizamento atualizada com dados reais (SGB/CPRM).</span>}
            </div>
          )}

          <MapContainer center={SENTO_SE_COORDS} zoom={14} scrollWheelZoom={isFullscreen} style={{ height: '100%', width: '100%' }}>
            <MapResizeHandler trigger={isFullscreen} />
            <MapInstanceCapture onReady={(map) => { mapInstanceRef.current = map }} />
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
                // Não marca o círculo se a chuva real for insignificante (região
                // semiárida - a maior parte do tempo não há chuva de verdade, e
                // marcar um círculo mesmo assim passa a impressão errada).
                if (point.precipitation < 0.2) return null
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

            {activeLayers.has('temperatura') && weatherState.status === 'success' && (
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
                </Popup>
              </CircleMarker>
            )}

            {activeLayers.has('ventania') &&
              weatherState.status === 'success' &&
              weatherState.data.windSpeed >= 3 && (
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
                    {`Vento atual: ${weatherState.data.windSpeed} km/h (Open-Meteo${weatherState.data.cached ? ', em cache' : ''}, ${new Date(weatherState.data.lastUpdate).toLocaleTimeString('pt-BR')})`}
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
              landslideState.status === 'success' &&
              landslideState.data.status === 'ok' &&
              // Só marca o círculo de risco se pelo menos uma área retornada
              // pela CPRM/SGB tiver classificação relevante. Se a classe real
              // for "Baixa"/"Nula" (ou não informada), marcar um círculo
              // grande de risco no mapa passaria uma informação falsa.
              landslideState.data.data.areas.some(
                (area) => area.classe && !/baixa|nula|nenhuma/i.test(area.classe)
              ) && (
                <CircleMarker
                  center={SENTO_SE_COORDS}
                  radius={30}
                  pathOptions={{
                    color: '#f97316',
                    fillColor: '#f97316',
                    fillOpacity: 0.3,
                  }}
                >
                  <Popup>
                    <div className="space-y-1 text-sm">
                      <div className="font-semibold">Suscetibilidade a deslizamento</div>
                      {landslideState.data.data.areas.map((area, i) => (
                        <div key={i}>
                          {area.municipio ?? 'Município não informado'}
                          {area.uf ? ` - ${area.uf}` : ''}: classe {area.classe ?? 'não informada'}
                        </div>
                      ))}
                      <div className="text-xs text-gray-500">
                        SGB/CPRM{landslideState.data.data.cached ? ', em cache' : ''}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              )}

            {activeLayers.has('sismos') &&
              earthquakeState.status === 'success' &&
              earthquakeState.data
                .filter((quake) => quake.magnitude !== null && quake.magnitude > 0)
                .map((quake) => {
                  const magnitude = quake.magnitude as number
                  const radius = Math.max(6, Math.min(24, magnitude * 4))
                  return (
                    <CircleMarker
                      key={quake.id}
                      center={[quake.latitude, quake.longitude]}
                      radius={radius}
                      pathOptions={{
                        color: '#dc2626',
                        fillColor: '#dc2626',
                        fillOpacity: 0.4,
                      }}
                    >
                      <Popup>
                        <div className="space-y-1 text-sm">
                          <div className="font-semibold">
                            Magnitude {quake.magnitude} {quake.magType ?? ''}
                          </div>
                          <div>{quake.place ?? 'Local não informado'}</div>
                          {quake.depthKm !== null && <div>Profundidade: {quake.depthKm} km</div>}
                          {quake.time && <div>Horário: {new Date(quake.time).toLocaleString('pt-BR')}</div>}
                          <div className="text-xs text-gray-500">USGS Earthquake Catalog</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )
                })}

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

            {userLocation && (
              <Marker position={userLocation} icon={userLocationIcon}>
                <Popup>Você está aqui</Popup>
              </Marker>
            )}

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

            {activeLayers.has('rios') && riverState.status === 'success' && riverState.data.map((river, i) => (
              <CircleMarker
                key={`rio-${river.station}-${i}`}
                center={[river.latitude ?? SENTO_SE_COORDS[0], river.longitude ?? SENTO_SE_COORDS[1]]}
                radius={14}
                pathOptions={{ color: '#1d4ed8', fillColor: '#1d4ed8', fillOpacity: 0.4 }}
              >
                <Popup>
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold">Estação: {river.station}</div>
                    <div>Nível: {river.level} {river.unit}</div>
                    <div>Horário: {new Date(river.timestamp).toLocaleString('pt-BR')}</div>
                    <div className="text-xs text-gray-500">Fonte: {river.source}{river.cached ? ' — cache' : ' — atual'}</div>
                  </div>
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
