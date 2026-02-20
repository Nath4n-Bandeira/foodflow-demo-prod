"use client"
import React from 'react'
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useClienteStore } from "@/src/app/context/ClienteContext"
import { useRouter } from 'next/navigation'
import { Lock, Mail, User, ArrowRight } from 'lucide-react'


type Inputs = {
    nome: string
    email: string
    senha: string
}

export default function Registro() {
    const { register, handleSubmit } = useForm<Inputs>()    
    const router = useRouter()

    
    async function criaConta(data: Inputs) {
      try {
        const response = await 
        fetch(`${process.env.NEXT_PUBLIC_URL_API}/clientes`, {
          headers: {"Content-Type": "application/json"},
          method: "POST",
          body: JSON.stringify({ nome: data.nome, email: data.email, senha: data.senha })
        })
       if (response.status == 201 || response.status == 200) {
          toast.success("Conta criada com sucesso! Por favor, faça o login.")
          router.push("/login") // Redireciona para a página de login
      } else {
          toast.error("Erro... Não foi possível criar sua conta.", {
            style: {
              background: "#dc2626",
              color: "#ffffff",
            },
          })
      }
      } catch (error) {
        toast.error("Erro inesperado ao criar conta", {
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
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                        Crie sua Conta
                    </h1>
                    <p className="mt-2 text-slate-600">
                        É rápido e fácil. Vamos começar.
                    </p>
                </div>

                {/* FORM COMEÇA AQUI, FUNCIONA PLMDSS */}
                <form className="space-y-6" onSubmit={handleSubmit(criaConta)}>
                    
                    {/* NOMINHO */}
                    <div className="relative">
                        <label htmlFor="nome" className="sr-only">Seu nome</label>
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            id="nome"
                            type="text"
                            placeholder="Digite seu nome completo"
                            required
                            {...register("nome")}
                            className="w-full h-12 pl-12 pr-4 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                        />
                    </div>

                    {/* EMAILZINHO */}
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

                    {/* SENHAZINHA */}
                    <div className="relative">
                        <label htmlFor="password" className="sr-only">Crie uma Senha</label>
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            id="password"
                            type="password"
                            placeholder="A senha precisa ter no minimo 8 caracteres"
                            required
                            {...register("senha")}
                            className="w-full h-12 pl-12 pr-4 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                        />
                    </div>

                    {/* REGISTRA ESSA BAGAÇA*/}
                    <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 h-12 px-6 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                    >
                        <span>Criar Conta</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    {/* JA POSSUI UMA CONTA */}
                    <p className="text-center text-sm text-slate-600">
                        Já possui uma conta?{" "}
                        <a href="/login" className="font-semibold text-green-600 hover:underline">
                            Faça login
                        </a>
                    </p>
                </form>
            </div>
        </div>
    )
}
