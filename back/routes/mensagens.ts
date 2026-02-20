import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { z } from "zod"
import { verificaToken } from "../middlewares/verificaToken"
import { Request } from "express"


interface AuthenticatedRequest extends Request {
    clienteLogadoId?: string
}

const prisma = new PrismaClient()
const router = Router()

const mensagemSchema = z.object({
  destinatarioId: z.string().uuid({ message: "ID do destinatário inválido" }),
  conteudo: z.string().min(1, { message: "Conteúdo não pode estar vazio" }),
})

router.post("/", verificaToken, async (req: AuthenticatedRequest, res) => {
  const valida = mensagemSchema.safeParse(req.body)

  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    // verificaToken
    const remetenteId = req.clienteLogadoId
    const { destinatarioId, conteudo } = valida.data

    // Verifica se o destinatário existe
    const destinatario = await prisma.usuario.findUnique({
      where: { id: destinatarioId },
    })

    if (!destinatario) {
      res.status(404).json({ erro: "Destinatário não encontrado" })
      return
    }

    // Cria a mensagem
    const mensagem = await prisma.mensagem.create({
      data: {
    remetenteId: remetenteId ?? "", 
    destinatarioId,
    conteudo,
    lida: false,
      },
    })

    res.status(201).json(mensagem)
  } catch (error) {
    console.error("Erro ao criar mensagem:", error)
    res.status(400).json({ erro: "Erro ao criar mensagem" })
  }
})

// Buscar conversa entre usuário logado e outro usuário
router.get("/conversa/:destinatarioId", verificaToken, async (req: AuthenticatedRequest, res) => {
  const { destinatarioId } = req.params
  const remetenteId = req.clienteLogadoId

  try {
    // Busca todas as mensagens entre os dois usuários
    const mensagens = await prisma.mensagem.findMany({
      where: {
        OR: [
          { remetenteId, destinatarioId },
          { remetenteId: destinatarioId, destinatarioId: remetenteId },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    res.status(200).json(mensagens)
  } catch (error) {
    console.error("Erro ao buscar conversa:", error)
    res.status(400).json({ erro: "Erro ao buscar conversa" })
  }
})

router.put("/:id/lida", verificaToken, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params
  const usuarioId = req.clienteLogadoId

  try {
    // Verifica se a mensagem existe e se o usuário é o destinatário
    const mensagem = await prisma.mensagem.findUnique({
      where: { id },
    })

    if (!mensagem) {
      res.status(404).json({ erro: "Mensagem não encontrada" })
      return
    }

    if (mensagem.destinatarioId !== usuarioId) {
      res.status(403).json({ erro: "Você não tem permissão para marcar esta mensagem como lida" })
      return
    }

    const mensagemAtualizada = await prisma.mensagem.update({
      where: { id },
      data: { lida: true },
    })

    res.status(200).json(mensagemAtualizada)
  } catch (error) {
    console.error("Erro ao marcar mensagem como lida:", error)
    res.status(400).json({ erro: "Erro ao marcar mensagem como lida" })
  }
})

router.get("/", verificaToken, async (req: AuthenticatedRequest, res) => {
  const usuarioId = req.clienteLogadoId

  try {
    const mensagens = await prisma.mensagem.findMany({
      where: {
        OR: [{ remetenteId: usuarioId }, { destinatarioId: usuarioId }],
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.status(200).json(mensagens)
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error)
    res.status(400).json({ erro: "Erro ao buscar mensagens" })
  }
})

export default router;
