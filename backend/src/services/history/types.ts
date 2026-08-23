import type { HistoryPoint } from '../../types.js'

// Contrato que qualquer fonte de dados históricos precisa implementar.
// Hoje só existe openMeteoHistorySource.ts, mas historyService.ts depende
// apenas desta interface - trocar de fonte, ou combinar várias no futuro
// (ex: uma fonte oficial de nível de rio), não deve exigir reescrever o
// serviço, só implementar um novo objeto deste tipo.
export interface HistoricalWeatherSource {
  id: string
  // Retorna um ponto por dia no intervalo [startDate, endDate] (inclusive),
  // já normalizado em HistoryPoint. Dias sem dado na fonte não devem ser
  // inventados - ou o dia é omitido, ou os campos vêm como null.
  fetchDailyHistory(lat: number, lng: number, startDate: string, endDate: string): Promise<HistoryPoint[]>
}
