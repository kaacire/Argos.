import { PrismaClient } from '@prisma/client'

// Instância única do Prisma Client, reaproveitada em toda a aplicação.
// Evita abrir uma nova conexão com o PostgreSQL a cada requisição.
export const prisma = new PrismaClient()

export async function checkDatabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
