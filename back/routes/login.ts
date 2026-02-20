import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const router = Router();

router.post("/", async (req, res) => {
  const { email, senha } = req.body;
  const mensaPadrao = "Login ou senha incorretos";

  if (!email || !senha) {
    return res.status(400).json({ erro: mensaPadrao });
  }

  try {
    const cliente = await prisma.usuario.findFirst({ where: { email } });

    if (!cliente) {
      return res.status(400).json({ erro: mensaPadrao });
    }

    const senhaCorreta = await bcrypt.compare(senha, cliente.senha);
    if (!senhaCorreta) {
      return res.status(400).json({ erro: mensaPadrao });
    }

    const token = jwt.sign(
      {
        clienteLogadoId: cliente.id,
        clienteLogadoNome: cliente.nome,
      },
      process.env.JWT_KEY as string,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      token,
    });
  } catch (error) {
    console.error("Erro interno de login:", error);
    return res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

export default router;
