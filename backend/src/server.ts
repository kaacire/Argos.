import http from 'node:http'
import { PORT } from './config.js'
import { applyCors, sendJson } from './lib/http.js'
import { handleHealth } from './routes/health.js'
import { handleWeather } from './routes/weather.js'
import { handleMap } from './routes/map.js'

// Servidor HTTP nativo (sem Express), seguindo a mesma abordagem de
// "módulos nativos" já usada em versões anteriores do backend ARGOS.
const server = http.createServer(async (req, res) => {
  applyCors(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      await handleHealth(res)
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/weather') {
      await handleWeather(res, url.searchParams)
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/map') {
      await handleMap(res)
      return
    }

    sendJson(res, 404, { error: `Rota não encontrada: ${req.method} ${url.pathname}` })
  } catch (err) {
    sendJson(res, 500, { error: 'Erro interno do servidor.' })
    console.error('[argos-backend] erro não tratado:', err)
  }
})

server.listen(PORT, () => {
  console.log(`[argos-backend] escutando em http://localhost:${PORT}`)
  console.log(`[argos-backend] endpoints: GET /api/health, GET /api/weather, GET /api/map`)
})
