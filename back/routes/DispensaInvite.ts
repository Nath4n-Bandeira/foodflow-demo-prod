import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { verificaToken } from "../middlewares/verificaToken"

const prisma = new PrismaClient()
const router = Router()

// pending invites aquiii uwu
router.get("/:usuarioId", verificaToken, async (req, res) => {
  try {
    const { usuarioId } = req.params

    const invites = await prisma.dispensaInvite.findMany({
      where: {
        convidadoId: usuarioId,
        status: "pending",
      },
      include: {
        dispensa: {
          select: {
            id: true,
            nome: true,
          },
        },
        convidadoPor: {
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

    res.status(200).json(invites)
  } catch (error) {
    console.error("Error fetching pantry invites:", error)
    res.status(400).json(error)
  }
})

// envia o invitiiii uwu
router.post("/", verificaToken, async (req, res) => {
  try {
    const { dispensaId, convidadoId } = req.body
    const convidadoPorId = req.headers["x-user-id"] as string

    if (!convidadoPorId || !convidadoId || !dispensaId) {
      res.status(400).json({ erro: "Todos os campos são obrigatórios" })
      return
    }

    if (convidadoPorId === convidadoId) {
      res.status(400).json({ erro: "Você não pode convidar a si mesmo" })
      return
    }

    // da uma olhadinha se ele já é membro awa
    const existingMember = await prisma.usuarioNaDispensa.findFirst({
      where: {
        dispensaID: Number(dispensaId),
        usuarioID: convidadoId,
      },
    })

    if (existingMember) {
      res.status(400).json({ erro: "Usuário já é membro desta dispensa" })
      return
    }

    // da uma olhadinha se o convite já existe awa
    const existingInvite = await prisma.dispensaInvite.findUnique({
      where: {
        dispensaId_convidadoId: {
          dispensaId: Number(dispensaId),
          convidadoId: convidadoId,
        },
      },
    })

    if (existingInvite) {
      res.status(400).json({ erro: "Convite já foi enviado" })
      return
    }

    const invite = await prisma.dispensaInvite.create({
      data: {
        dispensaId: Number(dispensaId),
        convidadoPorId: convidadoPorId,
        convidadoId: convidadoId,
        status: "pending",
      },
      include: {
        dispensa: {
          select: {
            id: true,
            nome: true,
          },
        },
        convidadoPor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })

    res.status(201).json(invite)
  } catch (error) {
    console.error("Error sending pantry invite:", error)
    res.status(400).json(error)
  }
})

// aceitaaaaaa o invitiiii uwu
router.post("/:inviteId/accept", verificaToken, async (req, res) => {
  try {
    const { inviteId } = req.params
    const userId = req.headers["x-user-id"] as string

    const invite = await prisma.dispensaInvite.findUnique({
      where: { id: inviteId },
      include: {
        dispensa: true,
      },
    })

    if (!invite) {
      res.status(404).json({ erro: "Convite não encontrado" })
      return
    }

    if (invite.convidadoId !== userId) {
      res.status(403).json({ erro: "Você só pode aceitar convites para si mesmo" })
      return
    }

    // adiciona o usuário à dispensa
    await prisma.usuarioNaDispensa.create({
      data: {
        usuarioID: invite.convidadoId,
        dispensaID: invite.dispensaId,
      },
    })

    // atualiza o status do convite
    await prisma.dispensaInvite.update({
      where: { id: inviteId },
      data: { status: "accepted" },
    })

    res.status(200).json({
      message: "Convite aceito",
      dispensa: invite.dispensa,
    })
  } catch (error) {
    console.error("Error accepting pantry invite:", error)
    res.status(400).json(error)
  }
})

// rejeitaaaaaa o invitiiii uwu
router.post("/:inviteId/reject", verificaToken, async (req, res) => {
  try {
    const { inviteId } = req.params
    const userId = req.headers["x-user-id"] as string

    const invite = await prisma.dispensaInvite.findUnique({
      where: { id: inviteId },
    })

    if (!invite) {
      res.status(404).json({ erro: "Convite não encontrado" })
      return
    }

    if (invite.convidadoId !== userId) {
      res.status(403).json({ erro: "Você só pode rejeitar convites para si mesmo" })
      return
    }

    // atualiza o status do convite
    await prisma.dispensaInvite.update({
      where: { id: inviteId },
      data: { status: "rejected" },
    })

    res.status(200).json({ message: "Convite rejeitado" })
  } catch (error) {
    console.error("Error rejecting pantry invite:", error)
    res.status(400).json(error)
  }
})

export default router
