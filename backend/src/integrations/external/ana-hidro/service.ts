// -----------------------------------------------------------------------
// Chamadas HTTP GET ao webservice legado da ANA (ServiceANA.asmx). Não
// exige cadastro/token (diferente da HidroWebService nova) - ver
// backend/src/services/riverService.ts para o motivo da escolha e os
// riscos assumidos (serviço marcado como defasado pela própria ANA).
//
// Documentação oficial dos parâmetros:
// https://telemetriaws1.ana.gov.br/serviceana.asmx
// -----------------------------------------------------------------------

import { parseAdoNetRows, type AnaXmlRow } from './xml.js'

export const ANA_HIDRO_BASE_URL = 'https://telemetriaws1.ana.gov.br/ServiceANA.asmx'

export interface AnaHidroInventarioQuery {
  codEstDE?: string
  codEstATE?: string
  // 1-Flu (fluviométrica, mede nível/vazão) ou 2-Plu (pluviométrica, só chuva).
  // Para nível de rio, sempre usamos '1'.
  tpEst?: '1' | '2'
  nmEst?: string
  nmRio?: string
  codSubBacia?: string
  codBacia?: string
  nmMunicipio?: string
  nmEstado?: string
  sgResp?: string
  sgOper?: string
  telemetrica?: '0' | '1'
  [key: string]: string | undefined
}

export interface AnaHidroSerieQuery {
  codEstacao: string
  dataInicio?: string // dd/mm/aaaa
  dataFim?: string // dd/mm/aaaa
  // 1-Cotas, 2-Chuvas ou 3-Vazões. Para nível de rio, sempre '1'.
  tipoDados: '1' | '2' | '3'
  // 1-Bruto ou 2-Consistido. Bruto é o mais recente disponível (o
  // consistido passa por revisão manual e demora meses/anos a mais).
  nivelConsistencia?: '1' | '2'
  [key: string]: string | undefined
}

const ANA_TIMEOUT_MS = 10_000

async function fetchAnaXml(operation: string, params: Record<string, string | undefined>): Promise<string> {
  const url = new URL(`${ANA_HIDRO_BASE_URL}/${operation}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value ?? '')
  })

  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), ANA_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`ANA (${operation}): HTTP ${response.status} ${response.statusText}`)
    }
    return await response.text()
  } finally {
    clearTimeout(timeoutHandle)
  }
}

export async function fetchAnaHidroInventario(query: AnaHidroInventarioQuery): Promise<AnaXmlRow[]> {
  const xml = await fetchAnaXml('HidroInventario', query)
  return parseAdoNetRows(xml)
}

export async function fetchAnaHidroSerieHistorica(query: AnaHidroSerieQuery): Promise<AnaXmlRow[]> {
  const xml = await fetchAnaXml('HidroSerieHistorica', query)
  return parseAdoNetRows(xml)
}
