// PLACEHOLDER - NÃO IMPLEMENTADO NESTA ETAPA.
//
// Estrutura reservada para consultas de histórico completo (gráficos de
// 7d/3m/1y hoje servidos por getChartData em mockData.ts). Nesta etapa,
// apenas o registro bruto de WeatherData é persistido a cada consulta à
// Open-Meteo (ver weatherService.ts); nenhuma agregação histórica ou
// endpoint de série temporal foi construído sobre esses dados ainda.
//
// Ver README, seção "O que NÃO foi implementado".

import { NotImplementedError } from '../types.js'

export async function getWeatherHistory(_latitude: number, _longitude: number): Promise<never> {
  throw new NotImplementedError('Histórico agregado (historyService)')
}
