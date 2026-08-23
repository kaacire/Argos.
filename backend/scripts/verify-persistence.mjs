// Script de verificação REAL de persistência (INSERT -> SELECT) contra o
// PostgreSQL configurado em DATABASE_URL. Não usa nenhum stub/mensagem
// simulada - fala diretamente com o Prisma Client real.
//
// Uso (depois de `npm install` e `npx prisma migrate deploy`):
//   npm run verify:db
//
// O que ele faz, na ordem:
//   1. INSERT de um registro de teste em WeatherData
//   2. Fecha a "sessão" lógica (não reaproveita nenhuma variável em memória)
//   3. SELECT desse mesmo registro, buscando por latitude/longitude
//   4. Compara campo a campo o que foi inserido com o que foi lido de volta
//   5. Lista quantos registros existem no total na tabela (histórico real)
//   6. Remove o registro de teste ao final (não polui a tabela)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_LAT = -9.7436
const TEST_LNG = -42.2564

async function main() {
  console.log('--- Verificação real de persistência (WeatherData) ---\n')

  const testForecast = [
    { date: '2026-08-22', condition: 'Chuva fraca', temperatureMax: 31, temperatureMin: 22, precipitationSum: 4.2 },
  ]

  console.log('[1/5] INSERT...')
  const inserted = await prisma.weatherData.create({
    data: {
      latitude: TEST_LAT,
      longitude: TEST_LNG,
      temperature: 29.4,
      condition: 'Chuva fraca',
      humidity: 68,
      windSpeed: 14.2,
      precipitation: 2.3,
      forecast: testForecast,
      city: 'Sento Sé',
      state: 'BA',
      source: 'open-meteo',
    },
  })
  console.log(`   OK — id=${inserted.id}\n`)

  console.log('[2/5] SELECT (findUnique por id, sessão separada da inserção)...')
  const selected = await prisma.weatherData.findUnique({ where: { id: inserted.id } })
  if (!selected) {
    throw new Error('FALHA: o registro inserido não foi encontrado no SELECT. Persistência quebrada.')
  }
  console.log('   OK — registro encontrado de volta no banco\n')

  console.log('[3/5] Conferindo campo a campo...')
  const checks = [
    ['latitude', selected.latitude, TEST_LAT],
    ['longitude', selected.longitude, TEST_LNG],
    ['temperature', selected.temperature, 29.4],
    ['humidity', selected.humidity, 68],
    ['windSpeed', selected.windSpeed, 14.2],
    ['precipitation', selected.precipitation, 2.3],
    ['city', selected.city, 'Sento Sé'],
    ['state', selected.state, 'BA'],
  ]
  let allOk = true
  for (const [field, got, expected] of checks) {
    const ok = got === expected
    allOk = allOk && ok
    console.log(`   ${ok ? '✅' : '❌'} ${field}: esperado=${expected} obtido=${got}`)
  }
  const forecastOk = JSON.stringify(selected.forecast) === JSON.stringify(testForecast)
  console.log(`   ${forecastOk ? '✅' : '❌'} forecast (JSON): ${forecastOk ? 'igual ao inserido' : 'DIFERENTE'}`)
  allOk = allOk && forecastOk

  console.log(`\n[4/5] Histórico: contando registros totais na tabela...`)
  const total = await prisma.weatherData.count()
  console.log(`   Total de registros em WeatherData: ${total}`)

  console.log('\n[5/5] Limpando o registro de teste...')
  await prisma.weatherData.delete({ where: { id: inserted.id } })
  console.log('   OK — removido\n')

  if (!allOk) {
    console.error('RESULTADO: FALHA — algum campo não bateu. Ver detalhes acima.')
    process.exit(1)
  }
  console.log('RESULTADO: ✅ INSERT -> SELECT funcionando corretamente contra o PostgreSQL real.')
}

main()
  .catch((err) => {
    console.error('\nERRO ao verificar persistência:', err.message)
    console.error('Verifique se DATABASE_URL está correto e se `npx prisma migrate deploy` já rodou.')
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
