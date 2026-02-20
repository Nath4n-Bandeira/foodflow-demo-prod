"use client"

import React from 'react'
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useClienteStore } from "@/src/app/context/ClienteContext"
import { useRouter } from 'next/navigation'
import { Lock, Mail, ArrowRight } from 'lucide-react'
import Cookies from "js-cookie"

type Inputs = {
  email: string
  senha: string
  manter: boolean
}

export default function Login() {
  const { register, handleSubmit } = useForm<Inputs>()    
  const { logaCliente } = useClienteStore()
  const router = useRouter()

  async function verificaLogin(data: Inputs) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/clientes/login`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          senha: data.senha
        })
      })

      if (response.status === 200) {
        const dados = await response.json()

        // token é settado aqui (cookie + storage para o frontend)
        Cookies.set("token", dados.token, {
          expires: data.manter ? 7 : undefined, // 7 dias
          secure: true,
          sameSite: 'Strict'
        })

        // Salva também no storage para que componentes client-side
        // (ex: ChatbotIcon) possam detectar autenticação.
        if (data.manter) {
          localStorage.setItem("token", dados.token)
          localStorage.setItem("clienteKey", dados.id)
        } else {
          sessionStorage.setItem("token", dados.token)
          localStorage.removeItem("clienteKey")
        }

        logaCliente(dados)
        toast.success("Login realizado com sucesso!")
        router.push("/perfil")
      } else {
        toast.error("Erro... Login ou senha incorretos", {
          style: {
            background: "#dc2626",
            color: "#ffffff",
          },
        })
      }
    } catch (error) {
      console.error("Erro de login:", error)
      toast.error("Erro inesperado ao fazer login", {
        style: {
          background: "#dc2626",
          color: "#ffffff",
        },
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Bem-vindo de volta!</h1>
          <p className="mt-2 text-slate-600">Acesse sua conta para continuar.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(verificaLogin)}>
          <div className="relative">
            <label htmlFor="email" className="sr-only">Seu e-mail</label>
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              id="email"
              type="email"
              placeholder="Digite seu e-mail"
              required
              {...register("email")}
              className="w-full h-12 pl-12 pr-4 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="sr-only">Senha de Acesso</label>
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              required
              {...register("senha")}
              className="w-full h-12 pl-12 pr-4 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600 select-none cursor-pointer hover:text-slate-800">
              <input
                id="manter"
                type="checkbox"
                {...register("manter")}
                className="h-4 w-4 rounded border-slate-300 bg-slate-100 text-green-600 focus:ring-green-600 focus:ring-offset-0"
              />
              <span>Manter conectado</span>
            </label>
            <a href="#" className="font-medium text-green-600 hover:underline">
              Esqueceu a senha?
            </a>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 h-12 px-6 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
          >
            <span>Entrar</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-sm text-slate-600">
            Ainda não possui uma conta?{" "}
            <a href="/register" className="font-semibold text-green-600 hover:underline">
              Cadastre-se
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
