import { Router } from "express"
import { z } from "zod"
import { GoogleGenerativeAI } from "@google/generative-ai"

const router = Router()

const geminiSchema = z.object({
  userMessage: z.string().min(1, "A mensagem do usuario nao pode estar vazia"),
})

function getGeminiStatus(error: unknown) {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status
    return typeof status === "number" ? status : undefined
  }

  return undefined
}

function getGeminiMessage(error: unknown) {
  const status = getGeminiStatus(error)

  if (status === 400 || status === 401 || status === 403) {
    return "Chave Gemini invalida, sem permissao ou com API desativada."
  }

  if (status === 429) {
    return "Limite de uso do Gemini atingido. Tente novamente em alguns instantes."
  }

  if (status && status >= 500) {
    return "Servico Gemini indisponivel no momento. Tente novamente em alguns instantes."
  }

  return "Erro ao processar IA"
}

router.post("/", async (req, res) => {
  const valida = geminiSchema.safeParse(req.body)

  if (!valida.success) {
    return res.status(400).json({ erro: valida.error })
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ erro: "GEMINI_API_KEY nao configurada" })
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    })

    const systemPrompt = `
Voce e um assistente culinario especializado.
De sugestoes diretas, praticas e uteis a partir da mensagem enviada.
`

    const result = await model.generateContent(`${systemPrompt}\n\nUsuario: ${valida.data.userMessage}`)
    const text = result.response.text()

    return res.status(200).json({ resposta: text })
  } catch (error) {
    console.error("Erro no Gemini:", error)
    return res.status(getGeminiStatus(error) || 500).json({ erro: getGeminiMessage(error) })
  }
})

export default router
