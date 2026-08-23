import type { ServerResponse } from 'node:http'
import { CORS_ORIGIN } from '../config.js'

export function sendJson(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': CORS_ORIGIN,
  })
  res.end(payload)
}

export function applyCors(res: ServerResponse) {
  // CORS restrito à origem do Vite em desenvolvimento (ver .env.example /
  // CORS_ORIGIN). Para produção, ajuste CORS_ORIGIN para o domínio real -
  // não usamos "*" para não abrir a API para qualquer origem sem necessidade.
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export function errorToStatus(err: unknown): { status: number; message: string } {
  const name = err instanceof Error ? err.constructor.name : 'Error'
  const message = err instanceof Error ? err.message : 'Erro desconhecido'

  switch (name) {
    case 'InvalidCoordinatesError':
      return { status: 400, message }
    case 'InvalidParameterError':
      return { status: 400, message }
    case 'UpstreamUnavailableError':
      return { status: 502, message }
    case 'NotImplementedError':
      return { status: 501, message }
    default:
      return { status: 500, message: 'Erro interno do servidor.' }
  }
}
