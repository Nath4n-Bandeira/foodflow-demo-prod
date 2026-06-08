"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { FolderPlus, ShieldCheck, Sparkles, X, Settings2 } from "lucide-react"

import Modal from "./modal"
import { useClienteStore } from "@/src/app/context/ClienteContext"

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
      router.refresh()
    } catch (error) {
      console.error("Erro de rede ou outra falha:", error)
      toast.error("Erro de rede ao tentar criar dispensa.")
    }
  }

  return (
    <>
      <button
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <FolderPlus className="w-4 h-4" />
        <span>Criar sua Dispensa</span>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} showCloseButton={false}>
        <form action="" onSubmit={handleSubmit(tryinput)} className="space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                <Sparkles className="w-3.5 h-3.5" />
                Nova dispensa
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Criar sua dispensa</h2>
              <p className="text-sm text-slate-500 max-w-xl">
                Defina um nome e escolha se esta dispensa vai acompanhar a temperatura dos alimentos.
              </p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome da dispensa</label>
                <input
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Ex: Cozinha central, estoque principal..."
                  {...register("nome")}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label htmlFor="monitorarTemperatura" className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="monitorarTemperatura"
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
                    {...register("monitorarTemperatura")}
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-slate-600" />
                      Ativar monitoramento de temperatura
                    </span>
                    <span className="block text-sm text-slate-500">
                      Indicado para depósitos com alimentos perecíveis ou controle mais rígido.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <Settings2 className="w-4 h-4 text-slate-600" />
                O que será criado
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-slate-700 mt-2 flex-shrink-0" />
                  <p>Uma nova área para organizar itens, controlar entradas e acompanhar movimentações.</p>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-slate-700 mt-2 flex-shrink-0" />
                  <p>Se ativado, o monitoramento de temperatura ajuda a evitar perdas em produtos sensíveis.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-sm transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              Criar Dispensa
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
