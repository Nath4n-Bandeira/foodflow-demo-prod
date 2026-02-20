import { Router } from "express"
import { z } from "zod"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { Request } from "express"

const router = Router()

const geminiSchema = z.object({
  userMessage: z.string().min(1, "A mensagem do usuário não pode estar vazia"),
})

router.post("/", async (req, res) => {
  const valida = geminiSchema.safeParse(req.body)

  if (!valida.success) {
    return res.status(400).json({ erro: valida.error })
  }

  try {
   const { userMessage } = valida.data

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ erro: "GEMINI_API_KEY não configurada" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    })
     // prompt do gemini, ele virou o master chef, thats crazyyyyy
    const systemPrompt = `
      Você é um assistente culinário especializado.
      Dê sugestões diretas, práticas e úteis a partir da mensagem enviada.
    `
    const result = await model.generateContent(
      `${systemPrompt}\n\nUsuário: ${userMessage}`
    )

    const text = result.response.text()

    return res.status(200).json({ resposta: text })
  } catch (error) {
    console.error("Erro no Gemini:", error)
    return res.status(500).json({ erro: "Erro ao processar IA" })
  }
})

export default router
