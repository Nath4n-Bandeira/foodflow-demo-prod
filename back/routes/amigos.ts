import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { verificaToken } from "../middlewares/verificaToken"

const prisma = new PrismaClient()
const router = Router()

router.get("/", verificaToken, async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string

    if (!userId) {
      res.status(400).json({ erro: "User ID is required" })
      return
    }

    const friendships = await prisma.amizade.findMany({
      where: {
        OR: [
          { usuario1Id: userId },
          { usuario2Id: userId },
        ],
      },
      include: {
        usuario1: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        usuario2: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    })

    const friends = friendships.map((friendship) => {
      const friend = friendship.usuario1Id === userId ? friendship.usuario2 : friendship.usuario1
      return {
        id: friend.id,
        nome: friend.nome,
        email: friend.email,
      }
    })

    res.status(200).json(friends)
  } catch (error) {
    console.error("Error fetching friends:", error)
    res.status(400).json(error)
  }
})

export default router
