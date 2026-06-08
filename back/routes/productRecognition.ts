import { Router } from "express"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { z } from "zod"
import { verificaToken } from "../middlewares/verificaToken"
import type { Request } from "express"
import { PrismaClient } from "@prisma/client"

export interface AuthenticatedRequest extends Request {
  clienteLogadoId?: string
  clienteLogadoNome?: string
}

const router = Router()
const prisma = new PrismaClient()

// Inicializar Gemini
const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(geminiApiKey)
const visionModelCandidates = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
const maxRetriesPerModel = 2
const retryBaseDelayMs = 800

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getGeminiErrorStatus = (error: unknown): number | undefined => {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status
    if (typeof status === "number") {
      return status
    }
  }
  return undefined
}

const isModelNotFoundError = (error: unknown) => {
  const status = getGeminiErrorStatus(error)
  if (status === 404) {
    return true
  }

  const errorMessage = String(error)
  return (
    errorMessage.includes("is not found") ||
    errorMessage.includes("not supported for generateContent")
  )
}

const isRetryableGeminiError = (error: unknown) => {
  const status = getGeminiErrorStatus(error)
  if (status && [429, 500, 502, 503, 504].includes(status)) {
    return true
  }

  const errorMessage = String(error).toLowerCase()
  return (
    errorMessage.includes("high demand") ||
    errorMessage.includes("service unavailable") ||
    errorMessage.includes("temporarily unavailable") ||
    errorMessage.includes("timed out") ||
    errorMessage.includes("timeout")
  )
}

// Schema de validação para análise de imagem
const analyzeImageSchema = z.object({
  image: z.string().min(10, { message: "Imagem inválida" }),
  dispensaId: z.number().min(1, { message: "ID da despensa inválido" }),
})

// Schema para criar produto do post
const createProductSchema = z.object({
  nome: z.string().min(2, { message: "Nome do produto obrigatório" }),
  peso: z.number().optional(),
  unidade: z.string().optional().default("KG"),
  validade: z.string().optional(),
  marca: z.string().optional(),
  ingredientes: z.string().optional(),
  nutrientes: z.any().optional(),
  imagemUrl: z.string().optional(),
  confianca: z.number().optional().default(0.95),
  dispensaId: z.number().min(1),
  usuarioId: z.string().min(1),
})

/**
 * POST /productRecognition/analyze
 * Analisa uma imagem de embalagem e extrai informações do produto
 */
router.post("/analyze", verificaToken, async (req, res) => {
  try {
    if (!geminiApiKey) {
      return res.status(500).json({ erro: "Chave da API Gemini não configurada" })
    }

    const { image, dispensaId } = analyzeImageSchema.parse(req.body)

    // Validar se a despensa existe e pertence ao usuário
    const dispensa = await prisma.dispensa.findUnique({
      where: { id: dispensaId },
    })

    if (!dispensa) {
      return res.status(404).json({ erro: "Despensa não encontrada" })
    }

    // Remover prefixo data:image se existir
    let base64Image = image
    if (image.includes("base64,")) {
      base64Image = image.split("base64,")[1]
    }

    // Preparar imagem para Gemini
    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ]

    // Criar prompt específico para análise de embalagens de alimentos
    const analysisPrompt = `
Você é um especialista em análise de embalagens de produtos alimentares. 
Analise a imagem fornecida e extraia as seguintes informações da embalagem:

1. Nome do produto
2. Marca
3. Peso/Volume (número e unidade)
4. Data de validade (formato YYYY-MM-DD ou deixe vazio se não encontrar)
5. Lista de ingredientes (se visível)
6. Informação nutricional por 100g (se visível)
7. Código de barras/EAN (se visível)

IMPORTANTE: Retorne APENAS um JSON válido, sem explicações adicionais. Use este formato exatamente:
{
  "nome": "string",
  "marca": "string ou null",
  "peso": número ou null,
  "unidade": "KG, G, ML, L, PCT, REDE, DUZIA, Unid ou outro",
  "validade": "YYYY-MM-DD ou null",
  "ingredientes": "string ou null",
  "nutrientes": {
    "calorias": número ou null,
    "proteinas": número ou null,
    "carboidratos": número ou null,
    "gorduras": número ou null,
    "fibras": número ou null,
    "sodio": número ou null
  },
  "codigoBarras": "string ou null",
  "confianca": 0.0 a 1.0 (confiança na análise)
}

Se não conseguir identificar o produto ou a imagem não mostrar uma embalagem clara, retorne confiança baixa (< 0.5).
    `

    // Chamar Gemini Vision com fallback de modelos suportados
    let responseText = ""
    let lastModelError: unknown

    for (const modelName of visionModelCandidates) {
      for (let attempt = 1; attempt <= maxRetriesPerModel + 1; attempt++) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName })
          const result = await model.generateContent([analysisPrompt, ...imageParts])
          responseText = result.response.text()
          break
        } catch (modelError) {
          lastModelError = modelError

          if (isModelNotFoundError(modelError)) {
            console.warn(
              `Modelo Gemini indisponivel para analise (${modelName}), tentando proximo.`,
            )
            break
          }

          const retryableError = isRetryableGeminiError(modelError)
          const hasAttemptsLeft = attempt <= maxRetriesPerModel

          if (retryableError && hasAttemptsLeft) {
            const delayMs = retryBaseDelayMs * attempt
            console.warn(
              `Falha temporaria no Gemini (${modelName}), tentativa ${attempt}/${maxRetriesPerModel + 1}. Novo retry em ${delayMs}ms.`,
            )
            await wait(delayMs)
            continue
          }

          if (retryableError && !hasAttemptsLeft) {
            console.warn(
              `Modelo Gemini com alta demanda (${modelName}) apos ${maxRetriesPerModel + 1} tentativas, tentando proximo.`,
            )
            break
          }

          throw modelError
        }
      }

      if (responseText) {
        break
      }
    }

    if (!responseText) {
      throw lastModelError ?? new Error("Nenhum modelo Gemini disponivel para analise")
    }

    // Parse da resposta JSON
    let extractedData
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Nenhum JSON encontrado na resposta")
      }
      extractedData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("Erro ao fazer parse da resposta do Gemini:", responseText)
      return res.status(400).json({
        erro: "Não foi possível analisar a embalagem. Tente com melhor iluminação ou ângulo.",
        detalhes: responseText,
      })
    }

    // Validar confiança
    if (extractedData.confianca < 0.5) {
      return res.status(400).json({
        erro: "Confiança baixa na análise. Tente fotografar a embalagem novamente com melhor ângulo.",
        dados: extractedData,
        confianca: extractedData.confianca,
      })
    }

    // Normalizar peso se necessário
    if (extractedData.peso) {
      extractedData.peso = parseFloat(extractedData.peso)
    }

    res.status(200).json({
      sucesso: true,
      dados: extractedData,
    })
  } catch (error) {
    console.error("Erro ao analisar imagem:", error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ erro: "Dados inválidos", detalhes: error.errors })
    }

    const geminiStatus = getGeminiErrorStatus(error)
    if (geminiStatus === 429 || geminiStatus === 503) {
      return res.status(503).json({
        erro: "Servico Gemini com alta demanda no momento. Tente novamente em alguns segundos.",
      })
    }

    res.status(500).json({ erro: "Erro ao processar imagem", detalhes: String(error) })
  }
})

/**
 * POST /productRecognition/create
 * Cria um novo produto baseado nos dados analisados
 */
router.post("/create", verificaToken, async (req, res) => {
  try {
    const usuarioId = (req as AuthenticatedRequest).clienteLogadoId

    if (!usuarioId) {
      return res.status(401).json({ erro: "Usuário não autenticado" })
    }

    const produtoData = createProductSchema.parse({
      ...req.body,
      usuarioId,
    })

    // Validar se a despensa existe
    const dispensa = await prisma.dispensa.findUnique({
      where: { id: produtoData.dispensaId },
    })

    if (!dispensa) {
      return res.status(404).json({ erro: "Despensa não encontrada" })
    }

    // Converter validade para objeto Date se fornecida
    const valdadeDate = produtoData.validade ? new Date(produtoData.validade) : null

    // Criar o produto
    const novoProduto = await prisma.alimentoDoPost.create({
      data: {
        nome: produtoData.nome,
        peso: produtoData.peso || null,
        unidade: produtoData.unidade || "KG",
        validade: valdadeDate,
        marca: produtoData.marca || null,
        ingredientes: produtoData.ingredientes || null,
        nutrientes: produtoData.nutrientes || null,
        imagemUrl: produtoData.imagemUrl || null,
        confianca: produtoData.confianca || 0.95,
        dispensaId: produtoData.dispensaId,
        usuarioId: produtoData.usuarioId,
      },
    })

    res.status(201).json({
      sucesso: true,
      mensagem: "Produto criado com sucesso!",
      produto: novoProduto,
    })
  } catch (error) {
    console.error("Erro ao criar produto:", error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ erro: "Dados inválidos", detalhes: error.errors })
    }
    res.status(500).json({ erro: "Erro ao criar produto", detalhes: String(error) })
  }
})

/**
 * GET /productRecognition/dispensa/:dispensaId
 * Lista todos os produtos reconhecidos de uma despensa
 */
router.get("/dispensa/:dispensaId", async (req, res) => {
  try {
    const { dispensaId } = req.params

    const produtos = await prisma.alimentoDoPost.findMany({
      where: {
        dispensaId: Number(dispensaId),
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.status(200).json(produtos)
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    res.status(500).json({ erro: "Erro ao buscar produtos" })
  }
})

/**
 * DELETE /productRecognition/:id
 * Deleta um produto reconhecido
 */
router.delete("/:id", verificaToken, async (req, res) => {
  try {
    const usuarioId = (req as AuthenticatedRequest).clienteLogadoId
    const { id } = req.params

    if (!usuarioId) {
      return res.status(401).json({ erro: "Usuário não autenticado" })
    }

    // Verificar se o produto pertence ao usuário
    const produto = await prisma.alimentoDoPost.findUnique({
      where: { id: Number(id) },
    })

    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado" })
    }

    if (produto.usuarioId !== usuarioId) {
      return res.status(403).json({ erro: "Você não tem permissão para deletar este produto" })
    }

    // Deletar
    await prisma.alimentoDoPost.delete({
      where: { id: Number(id) },
    })

    res.status(200).json({
      sucesso: true,
      mensagem: "Produto deletado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar produto:", error)
    res.status(500).json({ erro: "Erro ao deletar produto" })
  }
})

export default router
