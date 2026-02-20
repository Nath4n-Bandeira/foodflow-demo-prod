import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { verificaToken } from "../middlewares/verificaToken"

const prisma = new PrismaClient()
const router = Router()

//puxa os invites de amizade pendentes
router.get("/:usuarioId", verificaToken, async (req, res) => {
  try {
    const { usuarioId } = req.params

    const requests = await prisma.friendRequest.findMany({
      where: {
        destinatarioId: usuarioId,
        status: "pending",
      },
      include: {
        solicitante: {
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

    res.status(200).json(requests)
  } catch (error) {
    console.error("Error fetching friend requests:", error)
    res.status(400).json(error)
  }
})

router.post("/", verificaToken, async (req, res) => {
  try {
    const { receiverId } = req.body
    const senderId = req.headers["x-user-id"] as string // Now getting senderId from x-user-id header set by middleware

    if (!senderId || !receiverId) {
      res.status(400).json({ erro: "Sender ID and Receiver ID are required" })
      return
    }

    if (senderId === receiverId) {
      res.status(400).json({ erro: "Você não pode enviar uma solicitação de amizade para si mesmo" })
      return
    }

    const existingRequest = await prisma.friendRequest.findUnique({
      where: {
        solicitanteId_destinatarioId: {
          solicitanteId: senderId,
          destinatarioId: receiverId,
        },
      },
    })

    if (existingRequest) {
      res.status(400).json({ erro: "Solicitação de amizade já existe" })
      return
    }

    const sender = await prisma.usuario.findUnique({
      where: { id: senderId },
    })

    const friendRequest = await prisma.friendRequest.create({
      data: {
        solicitanteId: senderId,
        destinatarioId: receiverId,
        status: "pending",
      },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })

    res.status(201).json({
      id: friendRequest.id,
      senderId: friendRequest.solicitanteId,
      senderName: sender?.nome,
      senderEmail: sender?.email,
      receiverId: friendRequest.destinatarioId,
      status: friendRequest.status,
      createdAt: friendRequest.createdAt,
    })
  } catch (error) {
    console.error("Error sending friend request:", error)
    res.status(400).json(error)
  }
})

router.post("/:requestId/accept", verificaToken, async (req, res) => {
  try {
    const { requestId } = req.params
    const userId = req.headers["x-user-id"] as string

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        solicitante: true,
      },
    })

    if (!request) {
      res.status(404).json({ erro: "Friend request not found" })
      return
    }

    if (request.destinatarioId !== userId) {
      res.status(403).json({ erro: "You can only accept requests for yourself" })
      return
    }

    await prisma.amizade.create({
      data: {
        usuario1Id: request.solicitanteId,
        usuario2Id: request.destinatarioId,
      },
    })

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "accepted" },
    })

    res.status(200).json({ 
      message: "Friend request accepted",
      friendship: {
        usuario1Id: request.solicitanteId,
        usuario2Id: request.destinatarioId,
      }
    })
  } catch (error) {
    console.error("Error accepting friend request:", error)
    res.status(400).json(error)
  }
})

router.post("/:requestId/reject", verificaToken, async (req, res) => {
  try {
    const { requestId } = req.params
    const userId = req.headers["x-user-id"] as string

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      res.status(404).json({ erro: "Friend request not found" })
      return
    }

    if (request.destinatarioId !== userId) {
      res.status(403).json({ erro: "You can only reject requests for yourself" })
      return
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "rejected" },
    })

    res.status(200).json({ message: "Friend request rejected" })
  } catch (error) {
    console.error("Error rejecting friend request:", error)
    res.status(400).json(error)
  }
})

export default router
