// -----------------------------------------------------------------------
// Parser XML minúsculo e DEFENSIVO para o webservice legado da ANA
// (telemetriaws1.ana.gov.br/ServiceANA.asmx), que devolve um ADO.NET
// DataSet: uma sequência de elementos "linha" repetidos, cada um com
// filhos-folha simples (sem atributos, sem aninhamento profundo).
//
// IMPORTANTE - leia antes de mexer aqui:
// Este arquivo foi escrito consultando a documentação pública da ANA
// (nomes dos PARÂMETROS de entrada) e relatos de terceiros sobre o
// FORMATO da resposta (ex.: o node de cada leitura de HidroSerieHistorica
// se chama "SerieHistorica"). Não foi possível fazer uma chamada real ao
// serviço a partir deste ambiente (rede do sandbox não alcança domínios
// .gov.br) para confirmar ao vivo os nomes exatos das colunas retornadas.
// Por isso, em vez de fixar nomes de campo exatos e quebrar (ou pior,
// inventar valor) se algum vier diferente, o parser:
//   1) não assume o nome do elemento-linha - pega QUALQUER elemento
//      repetido cujos filhos sejam todos folhas de texto simples;
//      2) para os campos que a aplicação precisa (código da estação,
//      nome, latitude/longitude, valor da cota etc.), tenta várias
//      variações plausíveis de nome de coluna em vez de uma só.
// Se, na prática, a ANA devolver nomes de coluna diferentes dos
// previstos aqui, o resultado é "no-data" (nunca um valor inventado) -
// ver riverService.ts. Se isso acontecer, o ideal é capturar uma resposta
// real (ex.: `curl` no endpoint HTTP GET) e ajustar as listas de
// candidatos abaixo.
// -----------------------------------------------------------------------

export type AnaXmlRow = Record<string, string>

// Remove acentos e baixa a caixa, para comparar nomes de coluna sem
// depender de acentuação/capitalização exatas.
function normalizeKey(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// Extrai todos os elementos-linha do XML. Estratégia: qualquer tag que
// apareça mais de uma vez no documento E cujo conteúdo não contenha outra
// tag aninhada de mesmo padrão é tratada como "linha"; dentro dela, cada
// filho <Campo>valor</Campo> vira uma entrada do registro.
export function parseAdoNetRows(xml: string): AnaXmlRow[] {
  // Remove declaração XML, comentários e o envelope externo do DataSet -
  // não precisamos dele, só das linhas de dado.
  const cleaned = xml.replace(/<\?xml[^>]*\?>/g, '').replace(/<!--[\s\S]*?-->/g, '')

  // Encontra candidatos a "tag de linha": nomes de tag que se repetem.
  const tagCounts = new Map<string, number>()
  const tagRegex = /<([A-Za-z_][\w.-]*)[^>/]*>/g
  let match: RegExpExecArray | null
  while ((match = tagRegex.exec(cleaned))) {
    const tag = match[1]
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  }

  const repeatedTags = [...tagCounts.entries()]
    .filter(([tag, count]) => count > 1 && !/^(xsd|xs|schema|dataset)/i.test(tag))
    .sort((a, b) => b[1] - a[1])

  for (const [tag] of repeatedTags) {
    const rowRegex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'g')
    const rows: AnaXmlRow[] = []
    let rowMatch: RegExpExecArray | null
    while ((rowMatch = rowRegex.exec(cleaned))) {
      const inner = rowMatch[1]
      // Se o conteúdo interno tiver outra tag repetida dentro (ou seja,
      // este é um contêiner e não a própria linha), pula - queremos o
      // nível mais interno que só tem campos-folha.
      if (new RegExp(`<${tag}(?:\\s[^>]*)?>`).test(inner)) continue

      const fieldRegex = /<([A-Za-z_][\w.-]*)(?:\s[^>]*)?>([^<]*)<\/\1>/g
      const record: AnaXmlRow = {}
      let fieldMatch: RegExpExecArray | null
      let fieldCount = 0
      while ((fieldMatch = fieldRegex.exec(inner))) {
        const [, fieldName, fieldValue] = fieldMatch
        record[fieldName] = decodeXmlEntities(fieldValue.trim())
        fieldCount++
      }
      if (fieldCount > 0) rows.push(record)
    }
    if (rows.length > 0) return rows
  }

  return []
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

// Procura, num registro já parseado, o valor da primeira coluna cujo nome
// (normalizado) bate com algum dos candidatos - em ordem de preferência.
// `excludeContains` filtra colunas que contenham certos termos (ex.: para
// não confundir "CodigoRio" com "Codigo" da própria estação).
export function pickField(
  row: AnaXmlRow,
  candidates: string[],
  excludeContains: string[] = []
): string | null {
  const normalizedRow = Object.entries(row).map(([key, value]) => ({
    key,
    normalized: normalizeKey(key),
    value,
  }))

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeKey(candidate)
    const hit = normalizedRow.find(
      (entry) =>
        entry.normalized === normalizedCandidate &&
        !excludeContains.some((term) => entry.normalized.includes(normalizeKey(term)))
    )
    if (hit && hit.value !== '') return hit.value
  }

  // Segunda passada, mais frouxa: contém o candidato em vez de ser igual.
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeKey(candidate)
    const hit = normalizedRow.find(
      (entry) =>
        entry.normalized.includes(normalizedCandidate) &&
        !excludeContains.some((term) => entry.normalized.includes(normalizeKey(term)))
    )
    if (hit && hit.value !== '') return hit.value
  }

  return null
}

export function pickNumberField(
  row: AnaXmlRow,
  candidates: string[],
  excludeContains: string[] = []
): number | null {
  const raw = pickField(row, candidates, excludeContains)
  if (raw === null) return null
  const normalized = raw.replace(',', '.')
  const value = Number(normalized)
  return Number.isNaN(value) ? null : value
}
