import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { z } from "zod"
import { verificaToken } from "../middlewares/verificaToken"

const prisma = new PrismaClient()
const router = Router()

const dispensaSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  usuarioID: z.string(),
  monitorarTemperatura: z.boolean().optional().default(false),
})

const membroDispensaSchema = z.object({
  usuarioID: z.string().uuid({ message: "ID de usuário inválido (esperado UUID)." }),
})

router.get("/", verificaToken, async (req, res) => {
  try {
    const dispensas = await prisma.dispensa.findMany({
      include: {
        usuario: true,
        alimentos: true,
      },
    })
    res.status(200).json(dispensas)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/cliente/:usuarioID", async (req, res) => {
  const { usuarioID } = req.params

  try {
    const dispensas = await prisma.dispensa.findMany({
      where: { usuarioID },
      include: {
        alimentos: true,
      },
    })
    res.status(200).json(dispensas)
  } catch (error) {
    console.error("Erro ao buscar dispensas por cliente:", error)
    res.status(500).json({ error: "Erro ao buscar dispensas" })
  }
})

router.post("/", async (req, res) => {
  const valida = dispensaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, usuarioID, monitorarTemperatura } = valida.data

  try {
    const dispensa = await prisma.dispensa.create({
      data: {
        nome,
        monitorarTemperatura: monitorarTemperatura ?? false,
        usuario: {
          connect: {
            id: usuarioID,
          },
        },
      },
    })
    res.status(201).json(dispensa)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const dispensa = await prisma.dispensa.findUnique({
      where: { id: Number(id) },
      include: {
        usuario: true,
        alimentos: true,
        membros: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    })

    const membrosFormatados = dispensa?.membros.map((m) => m.usuario) || []

    res.status(200).json({ ...dispensa, membros: membrosFormatados })
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/membro/:usuarioID", async (req, res) => {
  const { usuarioID } = req.params

  try {
    const membros = await prisma.usuarioNaDispensa.findMany({
      where: { usuarioID },
      include: {
        dispensa: true,
      },
    })

    const dispensas = membros.map((m) => m.dispensa)
    res.status(200).json(dispensas)
  } catch (error) {
    console.error("Erro ao buscar dispensas como membro:", error)
    res.status(500).json({ error: "Erro ao buscar dispensas como membro." })
  }
})

router.patch("/:id", async (req, res) => {
  const { id } = req.params
  const valida = dispensaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, usuarioID, monitorarTemperatura } = valida.data

  try {
    const dispensa = await prisma.dispensa.update({
      where: { id: Number(id) },
      data: {
        nome,
        monitorarTemperatura: monitorarTemperatura ?? false,
        usuario: {
          connect: {
            id: usuarioID,
          },
        },
      },
    })
    res.status(200).json(dispensa)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.post("/:id/membro", async (req, res) => {
  const { id } = req.params

  const valida = membroDispensaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { usuarioID } = valida.data

  try {
    const membro = await prisma.usuarioNaDispensa.create({
      data: {
        usuarioID,
        dispensaID: Number(id),
      },
    })

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioID },
      select: { id: true, nome: true, email: true },
    })

    res.status(200).json(usuario)
  } catch (error) {
    console.error("Erro ao adicionar membro:", error)
    res.status(400).json({ error: "Erro ao adicionar usuário à dispensa." })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    await prisma.alimentos.deleteMany({
      where: { dispensaId: Number(id) },
    })

    const dispensa = await prisma.dispensa.delete({
      where: { id: Number(id) },
    })
    res.status(204).json(dispensa)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router
