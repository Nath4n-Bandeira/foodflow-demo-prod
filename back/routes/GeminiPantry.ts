import { Router } from "express"
import { z } from "zod"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { verificaToken } from "../middlewares/verificaToken"
import type { Request } from "express"

export interface AuthenticatedRequest extends Request {
  clienteLogadoId?: string
  clienteLogadoNome?: string
}

const router = Router()

const geminiPantrySchema = z.object({
  userMessage: z.string(),
  dispensaId: z.number(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
})

router.post("/", verificaToken, async (req: AuthenticatedRequest, res) => {
  const valida = geminiPantrySchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { userMessage, dispensaId, conversationHistory = [] } = valida.data

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ erro: "GEMINI_API_KEY não configurada" })
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
    },
  })

  const systemPrompt = `Você é um assistente inteligente multifuncional para gerenciamento de dispensa. Você pode:
1. ADICIONAR alimentos à dispensa
2. REGISTRAR USO de alimentos existentes
3. AJUDAR com informações e funcionalidades do aplicativo

**IMPORTANTE**: Sempre identifique a intenção do usuário e retorne JSON válido com a ação apropriada.

## AÇÃO 1: ADICIONAR ALIMENTOS
Quando o usuário quiser adicionar novos itens à dispensa.

Formato de saída:
{
  "action": "add",
  "items": [
    {
      "nome": "nome do alimento",
      "peso": número (quantidade),
      "unidadeTipo": "KG" | "PCT" | "REDE" | "DUZIA" | "LT" | "Unid",
      "perecivel": "SIM" | "NÃO",
      "validade": "YYYY-MM-DD" ou null
    }
  ],
  "message": "mensagem confirmando adição"
}

## AÇÃO 2: REGISTRAR USO DE ALIMENTOS
Quando o usuário quiser registrar que usou/consumiu alimentos.

Formato de saída:
{
  "action": "register_usage",
  "items": [
    {
      "nome": "nome do alimento (deve existir na dispensa)",
      "quantidade": número (quantidade usada)
    }
  ],
  "message": "mensagem confirmando registro de uso"
}

## AÇÃO 3: AJUDA E INFORMAÇÕES
Para perguntas sobre o app, dúvidas, etc.

Formato de saída:
{
  "action": "help",
  "message": "resposta amigável e útil"
}

### Regras Gerais:
- SEMPRE retorne JSON válido, nada mais
- Identifique a intenção: palavras como "adicionar", "comprei", "coloquei" = ADD
- Palavras como "usei", "consumi", "gastei", "cozinhei com" = REGISTER_USAGE
- Perguntas, dúvidas = HELP
- Para perecíveis: frutas, verduras, carnes, laticínios = SIM; grãos, enlatados = NÃO
- Unidades: KG (sólidos peso), LT (líquidos), PCT (pacotes), Unid (unidades), DUZIA, REDE

### Exemplos:

Usuário: "Adiciona 2kg de arroz e 1 litro de leite"
Resposta: {"action": "add", "items": [{"nome": "Arroz", "peso": 2, "unidadeTipo": "KG", "perecivel": "NÃO", "validade": null}, {"nome": "Leite", "peso": 1, "unidadeTipo": "LT", "perecivel": "SIM", "validade": null}], "message": "Perfeito! Adicionei 2kg de arroz e 1 litro de leite."}

Usuário: "Usei 500g de arroz hoje para fazer almoço"
Resposta: {"action": "register_usage", "items": [{"nome": "Arroz", "quantidade": 0.5}], "message": "Registrado! Você usou 500g de arroz."}

Usuário: "Como funciona o monitoramento de temperatura?"
Resposta: {"action": "help", "message": "O monitoramento de temperatura é uma funcionalidade opcional que você pode ativar ao criar uma dispensa. Quando ativado, você pode acompanhar a temperatura da dispensa nos relatórios para garantir o armazenamento adequado dos alimentos!"}`

  try {
    let prompt = `${systemPrompt}\n\n=== CONTEXTO ===\nDispensa ID: ${dispensaId}\nUsuário ID: ${req.clienteLogadoId}\n\n`

    if (conversationHistory.length > 0) {
      prompt += "=== HISTÓRICO DA CONVERSA ===\n"
      conversationHistory.forEach((msg) => {
        prompt += `${msg.role === "user" ? "Usuário" : "Assistente"}: ${msg.content}\n`
      })
      prompt += "\n"
    }

    prompt += `=== MENSAGEM ATUAL ===\nUsuário: ${userMessage}\n\nAssistente:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // extrai o JSON do texto retornado
    let jsonText = text.trim()
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "").trim()
    }

    res.status(200).json({ response: jsonText })
  } catch (error) {
    console.error("Erro no Gemini Pantry:", error)
    res.status(500).json({ erro: "Erro ao processar a solicitação" })
  }
})

export default router
