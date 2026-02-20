import { Pereciveis, PrismaClient, Unidades } from "@prisma/client"
import { Router } from "express"
import { z } from "zod"
import { verificaToken } from "../middlewares/verificaToken"
import type { Request } from "express"
import type { Prisma } from "@prisma/client"
export interface AuthenticatedRequest extends Request {
  clienteLogadoId?: string
  clienteLogadoNome?: string
}

const prisma = new PrismaClient()

const router = Router()

const alimentoSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(2, { message: "artefato deve possuir, no mínimo, 2 caracteres" }),
  peso: z.number(),
  perecivel: z.nativeEnum(Pereciveis).optional(),
  dispensaId: z.number(),
  unidadeTipo: z.nativeEnum(Unidades).optional(),
  validade: z.string().optional(), // Added validade field to schema
})

router.get("/", verificaToken, async (req, res) => {
  try {
    const alimentos = await prisma.alimentos.findMany({})
    res.status(200).json(alimentos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.get("/dispensa/:dispensaId/alimentos", async (req, res) => {
  const { dispensaId } = req.params

  try {
    const alimentos = await prisma.alimentos.findMany({
      where: {
        dispensaId: Number(dispensaId),
      },
    })
    res.status(200).json(alimentos)
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar alimentos da dispensa" })
  }
})

router.get("/dispensa/:dispensaId/alimentos/:id", async (req, res) => {
  const { id } = req.params

  try {
    const alimento = await prisma.alimentos.findFirst({
      where: {
        id: Number(id),
      },
    })
    res.status(200).json(alimento)
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar alimento" })
  }
})

router.post("/dispensa/:dispensaId/alimentos", verificaToken, async (req, res) => {
  const valida = alimentoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, peso, unidadeTipo = "KG", perecivel = "NÃO", dispensaId, validade } = valida.data

  try {
    const carro = await prisma.alimentos.create({
      data: {
        nome,
        unidadeTipo,
        peso,
        perecivel,
        validade: validade ? new Date(validade) : null, // Convert validade string to Date
        dispensa: {
          connect: {
            id: dispensaId,
          },
        },
      },
    })
    res.status(201).json(carro)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.patch("/dispensa/:dispensaId/alimentos/:id", verificaToken, async (req, res) => {
  const { id } = req.params
  const { nome, peso, perecivel, validade } = req.body

  try {
    const alimentoAtualizado = await prisma.alimentos.update({
      where: { id: Number(id) },
      data: {
        nome,
        peso,
        perecivel,
        validade: validade ? new Date(validade) : null, // Convert validade to Date
      },
    })

    res.status(200).json(alimentoAtualizado)
  } catch (error) {
    console.error("Erro ao atualizar alimento:", error)
    res.status(500).json({ error: "Erro ao atualizar alimento." })
  }
})

router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params

  try {
    const carro = await prisma.alimentos.delete({
      where: { id: Number(id) },
    })
    res.status(200).json(carro)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.post("/relatorio", verificaToken, async (req: AuthenticatedRequest, res) => {
  const { alimentos, dispensaId } = req.body

  if (!Array.isArray(alimentos) || typeof dispensaId !== "number") {
    return res.status(400).json({ error: "Dados inválidos." })
  }

  try {
    const relatorio = await prisma.$transaction(async (tx) => {
      const atualizados: Prisma.AlimentosGetPayload<{}>[] = []

      for (const item of alimentos as { id: number; quantidade: number }[]) {
        const alimento = await tx.alimentos.findUnique({
          where: { id: item.id },
        })

        if (!alimento || alimento.dispensaId !== dispensaId) {
          throw new Error(`Alimento ID ${item.id} não encontrado ou não pertence à dispensa`)
        }

        const pesoAtual = (alimento.peso as any)?.toNumber?.() ?? Number(alimento.peso)
        const novoPeso = pesoAtual - item.quantidade

        if (novoPeso < 0) {
          throw new Error(`Alimento "${alimento.nome}" não possui quantidade suficiente`)
        }

        const atualizado = await tx.alimentos.update({
          where: { id: item.id },
          data: { peso: novoPeso },
        })

        await tx.usoAlimento.create({
          data: {
            alimentoId: item.id,
            quantidadeUsada: item.quantidade,
            usuarioId: req.clienteLogadoId ?? "",
            dispensaId: dispensaId,
          },
        })

        atualizados.push(atualizado)
      }

      return atualizados
    })

    res.status(201).json(relatorio)
  } catch (error) {
    console.error("Erro ao registrar uso:", error)
    res.status(500).json({ error: "Erro ao registrar uso dos alimentos." })
  }
})

router.get("/relatorio/:dispensaId", verificaToken, async (req: AuthenticatedRequest, res) => {
  const { dispensaId } = req.params

  if (isNaN(Number(dispensaId))) {
    return res.status(400).json({ error: "ID da dispensa inválido." })
  }

  try {
    const relatorios = await prisma.usoAlimento.findMany({
      where: {
        dispensaId: Number(dispensaId),
      },
      include: {
        alimento: {
          select: { nome: true, unidadeTipo: true },
        },
        usuario: {
          select: { nome: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formatado = relatorios.map((r) => ({
      alimento: r.alimento.nome,
      unidade: r.alimento.unidadeTipo,
      quantidade: r.quantidadeUsada,
      usuario: r.usuario.nome,
      data: r.createdAt,
    }))

    res.status(200).json(formatado)
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error)
    res.status(500).json({ error: "Erro ao buscar relatórios da dispensa." })
  }
})

export default router
