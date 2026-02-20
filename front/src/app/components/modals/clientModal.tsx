"use client"

import { useState } from "react"
import Modal from "./modal"

import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { useClienteStore } from "@/src/app/context/ClienteContext"
import { useRouter } from "next/navigation"

type inputs = { nome: string; usuarioID: string; monitorarTemperatura: boolean }

export default function ClientModal({ usuarioID }: { usuarioID: string }) {
  const { cliente } = useClienteStore()
  const [isOpen, setIsOpen] = useState(false)
  const { register, handleSubmit } = useForm<inputs>()
  const router = useRouter()

  async function tryinput(data: inputs) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/dispensa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: data.nome,
          usuarioID: usuarioID,
          monitorarTemperatura: data.monitorarTemperatura || false,
        }),
      })

      if (!response.ok) {
        toast.error("Erro ao criar dispensa. Tente novamente.")
        return
      }

      setIsOpen(false)
      toast.success("Dispensa criada com sucesso!", {
        style: {
          background: "#00c950",
          color: "#ffffff",
        },
      })
      window.location.reload()
    } catch (error) {
      console.error("Erro de rede ou outra falha:", error)
      toast.error("Erro de rede ao tentar criar dispensa.")
    }
  }

  return (
    <>
      <button
        className="px-4 py-2 bg-[#2c2c2c] text-[#ffffff] rounded-md hover:bg-[#1e1e1e] font-medium"
        onClick={() => setIsOpen(true)}
      >
        Criar sua Dispensa
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form action="" onSubmit={handleSubmit(tryinput)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Nome da dispensa</label>
            <input
              className="mt-1 block w-full rounded-md border border-input bg-background text-foreground shadow-sm focus:border-green-500 focus:ring focus:ring-green-500 focus:ring-opacity-50"
              {...register("nome")}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md border border-input">
            <input
              type="checkbox"
              id="monitorarTemperatura"
              className="w-4 h-4 rounded border-input text-green-600 focus:ring-green-500"
              {...register("monitorarTemperatura")}
            />
            <label htmlFor="monitorarTemperatura" className="text-sm font-medium text-foreground cursor-pointer">
              Ativar monitoramento de temperatura
            </label>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            Criar Dispensa
          </button>
        </form>
      </Modal>
    </>
  )
}
