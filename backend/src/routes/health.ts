import type { ServerResponse } from 'node:http'
import { sendJson } from '../lib/http.js'
import { checkDatabaseConnection } from '../db.js'

// GET /api/health
// Resposta: { status: 'ok' | 'degraded', database: { ok, error? }, timestamp }
export async function handleHealth(res: ServerResponse) {
  const database = await checkDatabaseConnection()
  sendJson(res, database.ok ? 200 : 503, {
    status: database.ok ? 'ok' : 'degraded',
    database,
    timestamp: new Date().toISOString(),
  })
}
