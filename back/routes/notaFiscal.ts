import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { z } from "zod"
import { verificaToken } from "../middlewares/verificaToken"
import {
  buildComparisonTokens,
  buildInventoryAmount,
  compareProductSimilarity,
  normalizeProductName,
  parseReceiptHtml,
  parseReceiptText,
  type ParsedReceipt,
  type ReceiptItem,
} from "../utils/notaFiscalParser"

const prisma = new PrismaClient()
const router = Router()
const FISCAL_PAGE_TIMEOUT_MS = 15000

const sourceBaseSchema = z
  .object({
    qrCodeUrl: z.string().trim().optional(),
    receiptText: z.string().trim().optional(),
  })

const sourceSchema = sourceBaseSchema
  .refine((data) => data.qrCodeUrl || data.receiptText, {
    message: "Informe uma URL de QR code ou o texto da nota fiscal.",
  })

const importSchema = sourceBaseSchema
  .extend({
    dispensaId: z.number(),
  })
  .refine((data) => data.qrCodeUrl || data.receiptText, {
    message: "Informe uma URL de QR code ou o texto da nota fiscal.",
  })

router.post("/analisar", verificaToken, async (req, res) => {
  const parsed = sourceSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error })
  }

  try {
    const receipt = await parseReceiptFromSource(parsed.data)
    res.status(200).json(buildReceiptResponse(receipt))
  } catch (error) {
    console.error("Erro ao analisar nota fiscal:", error)
    res.status(400).json({ error: getReceiptErrorMessage(error) })
  }
})

router.post("/importar", verificaToken, async (req, res) => {
  const parsed = importSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error })
  }

  try {
    const receipt = await parseReceiptFromSource(parsed.data)
    const foodItems = receipt.itens.filter((item) => item.isAlimento)

    if (receipt.chaveAcesso) {
      const previous = await prisma.notaFiscalCompra.findFirst({
        where: {
          chaveAcesso: receipt.chaveAcesso,
          dispensaId: parsed.data.dispensaId,
        },
        include: { itens: true },
      })

      if (previous) {
        return res.status(200).json({
          duplicada: true,
          notaFiscalId: previous.id,
          adicionados: 0,
          ignorados: previous.itens.filter((item) => !item.isAlimento).length,
          receipt: buildReceiptResponse(receipt),
        })
      }
    }

    const saved = await prisma.$transaction(async (tx) => {
      const compra = await tx.notaFiscalCompra.create({
        data: {
          chaveAcesso: receipt.chaveAcesso,
          qrCodeUrl: receipt.qrCodeUrl,
          mercadoNome: receipt.mercadoNome,
          mercadoCnpj: receipt.mercadoCnpj,
          dataCompra: receipt.dataCompra ? new Date(receipt.dataCompra) : undefined,
          valorTotal: receipt.valorTotal,
          dispensaId: parsed.data.dispensaId,
        },
      })

      let addedFoods = 0

      for (const item of receipt.itens) {
        let alimentoCriadoId: number | undefined

        if (item.isAlimento) {
          const amount = buildInventoryAmount(item)
          const alimento = await tx.alimentos.create({
            data: {
              nome: item.nomeOriginal,
              peso: amount.peso,
              unidadeTipo: amount.unidadeTipo as any,
              perecivel: inferPerecivel(item.nomeOriginal) as any,
              dispensaId: parsed.data.dispensaId,
            },
          })
          alimentoCriadoId = alimento.id
          addedFoods++
        }

        await tx.notaFiscalItem.create({
          data: {
            notaFiscalId: compra.id,
            codigo: item.codigo,
            nomeOriginal: item.nomeOriginal,
            nomeNormalizado: item.nomeNormalizado,
            quantidade: item.quantidade,
            unidade: item.unidade,
            valorUnitario: item.valorUnitario,
            valorTotal: item.valorTotal,
            isAlimento: item.isAlimento,
            motivoClasse: item.motivoClasse,
            alimentoCriadoId,
          },
        })
      }

      return { compra, addedFoods }
    })

    res.status(201).json({
      duplicada: false,
      notaFiscalId: saved.compra.id,
      adicionados: saved.addedFoods,
      ignorados: receipt.itens.length - foodItems.length,
      receipt: buildReceiptResponse(receipt),
    })
  } catch (error) {
    console.error("Erro ao importar nota fiscal:", error)
    res.status(400).json({ error: getReceiptErrorMessage(error) })
  }
})

router.get("/comparacao", verificaToken, async (req, res) => {
  const dispensaId = Number(req.query.dispensaId)

  if (!Number.isFinite(dispensaId)) {
    return res.status(400).json({ error: "ID da dispensa invalido." })
  }

  try {
    const items = await prisma.notaFiscalItem.findMany({
      where: {
        isAlimento: true,
        notaFiscal: {
          dispensaId,
        },
      },
      include: {
        notaFiscal: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const groups = clusterPriceItems(
      items.map((item) => {
        const quantidade = toNumber(item.quantidade) || 1
        const unitPrice = toNumber(item.valorUnitario) ?? (toNumber(item.valorTotal) ?? 0) / quantidade

        return {
          id: item.id,
          nomeOriginal: item.nomeOriginal,
          nomeNormalizado: item.nomeNormalizado,
          mercadoNome: item.notaFiscal.mercadoNome,
          mercadoCnpj: item.notaFiscal.mercadoCnpj,
          dataCompra: item.notaFiscal.dataCompra,
          quantidade,
          unidade: item.unidade,
          valorUnitario: unitPrice,
          valorTotal: toNumber(item.valorTotal),
        }
      }),
    )

    res.status(200).json(groups)
  } catch (error) {
    console.error("Erro ao comparar precos:", error)
    res.status(500).json({ error: "Erro ao buscar comparacao de precos." })
  }
})

async function parseReceiptFromSource(source: { qrCodeUrl?: string; receiptText?: string }) {
  if (source.receiptText) {
    return parseReceiptText(source.receiptText, source.qrCodeUrl)
  }

  const url = normalizeFiscalQrUrl(source.qrCodeUrl ?? "")
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("QR code sem URL http/https")
  }

  const firstPage = await fetchFiscalPage(url)
  const pointedUrl = extractPointedFiscalUrl(firstPage.html, firstPage.finalUrl)
  const page = pointedUrl && pointedUrl !== firstPage.finalUrl ? await fetchFiscalPage(pointedUrl) : firstPage
  const receipt = parseReceiptHtml(page.html, page.finalUrl)

  if (receipt.itens.length === 0) {
    const fallbackUrl = extractPointedFiscalUrl(page.html, page.finalUrl)
    if (fallbackUrl && fallbackUrl !== page.finalUrl) {
      const fallbackPage = await fetchFiscalPage(fallbackUrl)
      const fallbackReceipt = parseReceiptHtml(fallbackPage.html, fallbackPage.finalUrl)
      if (fallbackReceipt.itens.length > 0) return fallbackReceipt
    }

    throw new Error("A pagina da nota abriu, mas os itens nao foram encontrados no HTML retornado.")
  }

  return receipt
}

async function fetchFiscalPage(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FISCAL_PAGE_TIMEOUT_MS)

  const response = await fetch(url, {
    redirect: "follow",
    signal: controller.signal,
    headers: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 FoodFlow/1.0 NFCe reader",
    },
  }).finally(() => clearTimeout(timeout))

  if (!response.ok) {
    throw new Error(`Resposta fiscal invalida: ${response.status}`)
  }

  return {
    html: await response.text(),
    finalUrl: normalizeFiscalQrUrl(response.url || url),
  }
}

function normalizeFiscalQrUrl(value: string) {
  const raw = value.trim()
  if (!raw) return raw

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return raw
  }

  const lowerHost = parsed.hostname.toLowerCase()
  const lowerPath = parsed.pathname.toLowerCase()

  if (lowerHost.includes("sefaz.rs.gov.br") && lowerPath.includes("/nfce/nfce-com.aspx")) {
    const qrPayload = parsed.searchParams.get("p")
    if (qrPayload) {
      return `https://dfe-portal.svrs.rs.gov.br/Dfe/QrCodeNFce?p=${qrPayload}`
    }
  }

  return raw
}

function extractPointedFiscalUrl(html: string, baseUrl: string) {
  const directDfeMatch = html.match(/https?:\/\/dfe-portal\.svrs\.rs\.gov\.br\/Dfe\/QrCodeNFce\?p=[^"' <>\r\n]+/i)
  if (directDfeMatch?.[0]) {
    return decodeHtmlUrl(directDfeMatch[0])
  }

  const metaRefreshMatch = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]+content=["'][^"']*url=([^"']+)["']/i)
  if (metaRefreshMatch?.[1]) {
    return normalizeFiscalQrUrl(resolveFiscalUrl(metaRefreshMatch[1], baseUrl))
  }

  const hrefMatches = [...html.matchAll(/(?:href|src|action)=["']([^"']+)["']/gi)]
  for (const match of hrefMatches) {
    const candidate = decodeHtmlUrl(match[1] ?? "")
    if (/QrCodeNFce|NFCE-COM\.aspx/i.test(candidate)) {
      return normalizeFiscalQrUrl(resolveFiscalUrl(candidate, baseUrl))
    }
  }

  return normalizeFiscalQrUrl(baseUrl)
}

function resolveFiscalUrl(value: string, baseUrl: string) {
  try {
    return new URL(decodeHtmlUrl(value), baseUrl).toString()
  } catch {
    return value
  }
}

function decodeHtmlUrl(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/g, "/")
    .trim()
}

function getReceiptErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "A consulta da SEFAZ demorou demais e foi cancelada. Tente novamente ou cole o texto da nota fiscal."
  }

  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "A consulta da SEFAZ demorou demais e foi cancelada. Tente novamente ou cole o texto da nota fiscal."
    }

    if (error.message.includes("fetch failed")) {
      return "Nao foi possivel acessar a pagina da SEFAZ pelo servidor. Verifique a URL do QR code ou tente colar o texto da nota."
    }

    return error.message
  }

  return "Nao foi possivel ler a nota fiscal informada."
}

function buildReceiptResponse(receipt: ParsedReceipt) {
  return {
    ...receipt,
    resumo: {
      totalItens: receipt.itens.length,
      alimentos: receipt.itens.filter((item) => item.isAlimento).length,
      ignorados: receipt.itens.filter((item) => !item.isAlimento).length,
    },
  }
}

function inferPerecivel(name: string) {
  const normalized = normalizeProductName(name)
  return ["carne", "leite", "iogurte", "queijo", "sanduiche", "pizza", "hamburguer", "salame"].some((term) =>
    normalized.includes(term),
  )
    ? "SIM"
    : "NÃƒO"
}

function toNumber(value: any) {
  if (value === null || value === undefined) return undefined
  const parsed = value?.toNumber?.() ?? Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

type PriceRecord = {
  id: number
  nomeOriginal: string
  nomeNormalizado: string
  mercadoNome: string
  mercadoCnpj: string | null
  dataCompra: Date | null
  quantidade: number
  unidade: string
  valorUnitario: number
  valorTotal?: number
}

function clusterPriceItems(items: PriceRecord[]) {
  const groups: Array<{
    nomeGrupo: string
    tokens: string[]
    representante: string
    menorPreco: number
    mercados: PriceRecord[]
  }> = []

  for (const item of items) {
    const target = groups.find((group) => compareProductSimilarity(group.representante, item.nomeOriginal) >= 0.58)

    if (target) {
      target.mercados.push(item)
      if (item.valorUnitario < target.menorPreco) {
        target.menorPreco = item.valorUnitario
        target.representante = item.nomeOriginal
      }
      continue
    }

    const tokens = buildComparisonTokens(item.nomeNormalizado)
    groups.push({
      nomeGrupo: buildGroupName(tokens, item.nomeOriginal),
      tokens,
      representante: item.nomeOriginal,
      menorPreco: item.valorUnitario,
      mercados: [item],
    })
  }

  return groups
    .map((group) => ({
      ...group,
      mercados: group.mercados.sort((left, right) => left.valorUnitario - right.valorUnitario),
      quantidadeMercados: new Set(group.mercados.map((item) => item.mercadoCnpj ?? item.mercadoNome)).size,
      economiaPossivel:
        group.mercados.length > 1
          ? Math.max(...group.mercados.map((item) => item.valorUnitario)) -
            Math.min(...group.mercados.map((item) => item.valorUnitario))
          : 0,
    }))
    .sort((left, right) => {
      if (right.quantidadeMercados !== left.quantidadeMercados) return right.quantidadeMercados - left.quantidadeMercados
      return left.nomeGrupo.localeCompare(right.nomeGrupo)
    })
}

function buildGroupName(tokens: string[], fallback: string) {
  if (tokens.length === 0) return fallback
  return tokens
    .slice(0, 4)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ")
}

export default router
