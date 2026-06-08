export type ReceiptItem = {
  codigo?: string
  nomeOriginal: string
  nomeNormalizado: string
  quantidade: number
  unidade: string
  valorUnitario?: number
  valorTotal?: number
  isAlimento: boolean
  motivoClasse: string
}

export type ParsedReceipt = {
  chaveAcesso?: string
  qrCodeUrl?: string
  mercadoNome: string
  mercadoCnpj?: string
  dataCompra?: string
  valorTotal?: number
  itens: ReceiptItem[]
}

const foodTerms = [
  "acucar",
  "achocolat",
  "agua min",
  "agua mineral",
  "arroz",
  "azeite",
  "batata",
  "bebida energetica",
  "biscoito",
  "bombom",
  "cafe",
  "carne",
  "catchup",
  "choc",
  "chocolate",
  "coca cola",
  "creme leite",
  "doce",
  "energetico",
  "farinha",
  "farofa",
  "feijao",
  "hamburguer",
  "iogurte",
  "ketchup",
  "leite",
  "lentilha",
  "massa",
  "milho",
  "molho",
  "mostarda",
  "oleo",
  "pao",
  "pepsi",
  "pipoca",
  "pizza",
  "refri",
  "refrig",
  "salame",
  "salg",
  "sanduiche",
  "suco",
  "suspiro",
  "wafer",
]

const hygieneTerms = [
  "absorvente",
  "agua sanitaria",
  "amaciante",
  "antibacter",
  "bombril",
  "condicionador",
  "creme dental",
  "desod",
  "deterg",
  "esponja",
  "gel dent",
  "lava roupa",
  "limp",
  "papel hig",
  "papel higienico",
  "sabonete",
  "sab intimo",
  "shamp",
  "toalha umed",
]

const comparisonStopWords = new Set([
  "bebida",
  "congelado",
  "cong",
  "emb",
  "fd",
  "fd12",
  "garrafa",
  "kg",
  "l",
  "leve",
  "lt",
  "ml",
  "pct",
  "pet",
  "refrig",
  "refrigerante",
  "refri",
  "sc",
  "trad",
  "un",
])

export function normalizeProductName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b\d+(?:[,.]\d+)?\s*(kg|g|mg|l|lt|ml|un|und|pct|fd\d*|cx)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function classifyReceiptItem(nomeOriginal: string) {
  const normalized = normalizeProductName(nomeOriginal)
  const hygieneHit = hygieneTerms.find((term) => normalized.includes(term))

  if (hygieneHit) {
    return {
      isAlimento: false,
      motivoClasse: `Ignorado por termo de higiene/limpeza: ${hygieneHit}`,
    }
  }

  const foodHit = foodTerms.find((term) => normalized.includes(term))
  if (foodHit) {
    return {
      isAlimento: true,
      motivoClasse: `Alimento identificado por termo: ${foodHit}`,
    }
  }

  return {
    isAlimento: false,
    motivoClasse: "Ignorado por nao corresponder ao vocabulario alimenticio",
  }
}

export function buildComparisonTokens(nomeNormalizado: string) {
  return nomeNormalizado
    .split(" ")
    .filter((token) => token.length > 1)
    .filter((token) => !comparisonStopWords.has(token))
    .filter((token) => !/^\d+$/.test(token))
}

export function compareProductSimilarity(leftName: string, rightName: string) {
  const left = new Set(buildComparisonTokens(normalizeProductName(leftName)))
  const right = new Set(buildComparisonTokens(normalizeProductName(rightName)))

  if (left.size === 0 || right.size === 0) return 0

  const intersection = [...left].filter((token) => right.has(token)).length
  const union = new Set([...left, ...right]).size
  const containment = intersection / Math.min(left.size, right.size)
  const jaccard = intersection / union

  return Math.max(jaccard, containment * 0.8)
}

export function buildInventoryAmount(item: ReceiptItem) {
  const normalizedUnit = item.unidade.toUpperCase()
  const source = normalizeSearchText(item.nomeOriginal)
  const packageMatch = source.match(/(\d+(?:[,.]\d+)?)\s*(kg|g|l|lt|ml)\b/)

  if (packageMatch && (normalizedUnit === "UN" || normalizedUnit === "UNID" || normalizedUnit === "UND")) {
    const packageValue = parseDecimal(packageMatch[1] ?? "0") ?? 0
    const packageUnit = packageMatch[2] ?? ""

    if (packageUnit === "kg") return { peso: item.quantidade * packageValue, unidadeTipo: "KG" }
    if (packageUnit === "g") return { peso: (item.quantidade * packageValue) / 1000, unidadeTipo: "KG" }
    if (packageUnit === "l" || packageUnit === "lt") return { peso: item.quantidade * packageValue, unidadeTipo: "LT" }
    if (packageUnit === "ml") return { peso: (item.quantidade * packageValue) / 1000, unidadeTipo: "LT" }
  }

  if (normalizedUnit === "KG") return { peso: item.quantidade, unidadeTipo: "KG" }
  if (normalizedUnit === "G") return { peso: item.quantidade / 1000, unidadeTipo: "KG" }
  if (["L", "LT"].includes(normalizedUnit)) return { peso: item.quantidade, unidadeTipo: "LT" }
  if (normalizedUnit === "ML") return { peso: item.quantidade / 1000, unidadeTipo: "LT" }
  if (normalizedUnit === "PCT" || normalizedUnit === "PC") return { peso: item.quantidade, unidadeTipo: "PCT" }
  if (normalizedUnit === "DZ" || normalizedUnit === "DUZIA") return { peso: item.quantidade, unidadeTipo: "DUZIA" }

  return { peso: item.quantidade, unidadeTipo: "Unid" }
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim()
}

export function parseReceiptHtml(html: string, qrCodeUrl?: string): ParsedReceipt {
  const spanItems = parseSpanLayoutItems(html)
  const text = htmlToText(html)
  const plainItems = spanItems.length > 0 ? spanItems : parsePlainTextItems(text)
  const accessKey = extractAccessKey(qrCodeUrl ?? text)

  return {
    chaveAcesso: accessKey,
    qrCodeUrl,
    mercadoNome: extractMarketName(text) ?? "Mercado nao identificado",
    mercadoCnpj: extractCnpj(text),
    dataCompra: extractPurchaseDate(text),
    valorTotal: extractTotal(text),
    itens: plainItems,
  }
}

export function parseReceiptText(text: string, qrCodeUrl?: string): ParsedReceipt {
  return {
    chaveAcesso: extractAccessKey(qrCodeUrl ?? text),
    qrCodeUrl,
    mercadoNome: extractMarketName(text) ?? "Mercado nao identificado",
    mercadoCnpj: extractCnpj(text),
    dataCompra: extractPurchaseDate(text),
    valorTotal: extractTotal(text),
    itens: parsePlainTextItems(text),
  }
}

function parseSpanLayoutItems(html: string) {
  const items: ReceiptItem[] = []
  const productPattern =
    /<span[^>]*class=["'][^"']*txtTit[^"']*["'][^>]*>([\s\S]*?)<\/span>([\s\S]*?)(?=<span[^>]*class=["'][^"']*txtTit|<\/body>|<\/html>)/gi

  for (const match of html.matchAll(productPattern)) {
    const description = cleanField(match[1] ?? "")
    const block = match[2] ?? ""
    const code = cleanField(block.match(/class=["'][^"']*RCod[^"']*["'][^>]*>[\s\S]*?Codigo:?\s*([^<]+)/i)?.[1] ?? "")
      .replace(/\D/g, "")
    const quantity = parseDecimal(
      block.match(/class=["'][^"']*Rqtd[^"']*["'][^>]*>[\s\S]*?Qtde\.?:?<\/strong>\s*([^<]+)/i)?.[1] ?? "1",
    )
    const unit = cleanField(
      block.match(/class=["'][^"']*RUN[^"']*["'][^>]*>[\s\S]*?UN:?\s*<\/strong>\s*([^<]+)/i)?.[1] ?? "UN",
    )
    const unitPrice = parseDecimal(
      block.match(/class=["'][^"']*RvlUnit[^"']*["'][^>]*>[\s\S]*?Vl\. Unit\.?:?<\/strong>\s*([^<]+)/i)?.[1] ?? "",
    )
    const totalPrice = parseDecimal(block.match(/class=["'][^"']*valor[^"']*["'][^>]*>([^<]+)/i)?.[1] ?? "")

    if (description.length < 2 || quantity === undefined) continue
    items.push(makeReceiptItem({ code, description, quantity, unit, unitPrice, totalPrice }))
  }

  return items
}

function parsePlainTextItems(text: string) {
  const items: ReceiptItem[] = []
  const searchable = text
    .replace(/DESCONTO\s+-?\d+(?:[,.]\d+)?%?\s*(?:R\$)?\s*-?\d+(?:[,.]\d+)?/gi, " ")
    .replace(/\s+/g, " ")
  const itemPattern =
    /(\d{4,14})\s+([A-Z0-9À-Ü][A-Z0-9À-Ü\s.,/+%-]{3,170}?)\s+(\d+(?:[,.]\d{1,3})?)\s*(UNID|UND|UN|KG|G|LT|L|ML|PCT|PC|CX|DZ|DUZIA|FD\d*)\s+(\d+(?:[,.]\d{2,4})?)\s+(\d+(?:[,.]\d{2}))/gi

  for (const match of searchable.matchAll(itemPattern)) {
    const description = cleanProductDescription(match[2] ?? "")
    if (shouldSkipPlainTextDescription(description)) continue

    items.push(
      makeReceiptItem({
        code: match[1],
        description,
        quantity: parseDecimal(match[3] ?? "1") ?? 1,
        unit: match[4] ?? "UN",
        unitPrice: parseDecimal(match[5] ?? ""),
        totalPrice: parseDecimal(match[6] ?? ""),
      }),
    )
  }

  if (items.length > 0) return dedupeItems(items)

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (let index = 0; index < lines.length; index++) {
    const descriptionMatch = lines[index]?.match(/^(\d{4,14})\s+(.+)$/)
    if (!descriptionMatch) continue

    const description = cleanProductDescription(descriptionMatch[2] ?? "")
    if (shouldSkipPlainTextDescription(description)) continue

    for (let offset = 1; offset <= 3; offset++) {
      const quantityMatch = lines[index + offset]?.match(
        /(\d+(?:[,.]\d{1,3})?)\s*(UNID|UND|UN|KG|G|LT|L|ML|PCT|PC|CX|DZ|DUZIA|FD\d*)\s+(\d+(?:[,.]\d{2,4})?)\s+(\d+(?:[,.]\d{2}))/i,
      )
      if (!quantityMatch) continue

      items.push(
        makeReceiptItem({
          code: descriptionMatch[1],
          description,
          quantity: parseDecimal(quantityMatch[1] ?? "1") ?? 1,
          unit: quantityMatch[2] ?? "UN",
          unitPrice: parseDecimal(quantityMatch[3] ?? ""),
          totalPrice: parseDecimal(quantityMatch[4] ?? ""),
        }),
      )
      break
    }
  }

  return dedupeItems(items)
}

function makeReceiptItem(input: {
  code?: string
  description: string
  quantity: number
  unit: string
  unitPrice?: number
  totalPrice?: number
}) {
  const classification = classifyReceiptItem(input.description)

  return {
    codigo: input.code,
    nomeOriginal: input.description,
    nomeNormalizado: normalizeProductName(input.description),
    quantidade: input.quantity,
    unidade: input.unit.toUpperCase(),
    valorUnitario: input.unitPrice,
    valorTotal: input.totalPrice,
    ...classification,
  }
}

function dedupeItems(items: ReceiptItem[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.codigo ?? ""}-${item.nomeNormalizado}-${item.quantidade}-${item.valorTotal ?? ""}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function htmlToText(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|td|span|h\d)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s+/g, "\n")
  )
}

function cleanField(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
}

function cleanProductDescription(value: string) {
  return value
    .replace(/\bDESCONTO\b.*$/i, "")
    .replace(/\bR\$\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function shouldSkipPlainTextDescription(description: string) {
  const normalized = normalizeProductName(description)
  if (description.length < 3) return true
  return [
    "codigo descricao",
    "consulta pela chave",
    "consumidor",
    "documento auxiliar",
    "forma pagamento",
    "valor a pagar",
    "valor pago",
  ].some((term) => normalized.includes(term))
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

export function parseDecimal(value: string) {
  const raw = value?.toString().trim()
  if (!raw) return undefined
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".")
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : undefined
}

function extractAccessKey(value: string) {
  const decoded = decodeURIComponent(value)
  return decoded.match(/\b\d{44}\b/)?.[0]
}

function extractCnpj(text: string) {
  return text.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/)?.[0]
}

function extractMarketName(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const explicit = text.match(/(?:Raz[aã]o Social|Emitente)\s*:?\s*([^\n]+)/i)?.[1]?.trim()
  if (explicit && explicit.length > 3) return explicit.slice(0, 160)

  const firstCommerceLine = lines.find((line) => /mercado|comerc|super|atacad|zaffari|krolow/i.test(line))
  return firstCommerceLine?.slice(0, 160)
}

function extractPurchaseDate(text: string) {
  const dateMatch = text.match(/\b(\d{2})\/(\d{2})\/(\d{2,4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?\b/)
  if (!dateMatch) return undefined

  const day = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const year = Number(dateMatch[3]?.length === 2 ? `20${dateMatch[3]}` : dateMatch[3])
  const hour = Number(dateMatch[4] ?? "0")
  const minute = Number(dateMatch[5] ?? "0")
  const second = Number(dateMatch[6] ?? "0")
  const date = new Date(year, month - 1, day, hour, minute, second)

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function extractTotal(text: string) {
  const totalMatch =
    text.match(/Valor\s+a\s+Pagar\s*R?\$?\s*(\d+(?:[,.]\d{2}))/i) ??
    text.match(/Valor\s+Total\s*(?:da\s+Nota)?\s*R?\$?\s*(\d+(?:[,.]\d{2}))/i)

  return totalMatch ? parseDecimal(totalMatch[1] ?? "") : undefined
}
