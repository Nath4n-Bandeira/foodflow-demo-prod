"use client"

import { useEffect, useState } from "react"
import Modal from "./modal"
import type { ClienteItf } from "@/src/app/utils/types/ClienteItf"
import { toast } from "sonner"
import Cookies from "js-cookie"
import { Search, X, UserPlus2, Mail, UsersRound, Send, CheckCircle2 } from "lucide-react"

interface UserModalProps {
  dispensaId: number
  onUserAdded?: (user: ClienteItf) => void
}

export default function UserModal({ dispensaId, onUserAdded }: UserModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [clientes, setClientes] = useState<ClienteItf[]>([])
  const [membros, setMembros] = useState<ClienteItf[]>([])
  const [clientesFiltrados, setClientesFiltrados] = useState<ClienteItf[]>([])
  const [usuarioLogadoId, setUsuarioLogadoId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const getInitial = (name: string | undefined): string => {
    return name?.charAt(0).toUpperCase() || "U"
  }

  useEffect(() => {
    const carregarDados = async () => {
      if (!isOpen) return

      try {
        const usuarioRes = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/clientes`, {
          headers: {
            Authorization: "Bearer " + (Cookies.get("token") || ""),
          },
        })

        if (!usuarioRes.ok) throw new Error("Erro ao buscar usuário logado")

        const usuarioLogado = await usuarioRes.json()
        setUsuarioLogadoId(usuarioLogado.id)

        const [clientesRes, dispensaRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_URL_API}/clientes`),
          fetch(`${process.env.NEXT_PUBLIC_URL_API}/dispensa/${dispensaId}`),
        ])

        const todosClientes: ClienteItf[] = await clientesRes.json()
        const dadosDispensa = await dispensaRes.json()
        const membrosDaDispensa: ClienteItf[] = dadosDispensa?.membros || []

        setClientes(todosClientes)
        setMembros(membrosDaDispensa)

        const idsExcluidos = new Set([...membrosDaDispensa.map((m) => m.id), usuarioLogado.id])

        const disponiveis = todosClientes.filter((c) => !idsExcluidos.has(c.id))
        setClientesFiltrados(disponiveis)
      } catch (err) {
        console.error("Erro ao buscar dados:", err)
        toast.error("Erro ao carregar usuários.")
      }
    }

    carregarDados()
  }, [isOpen, dispensaId])

  const handleSelecionarUsuario = async (user: ClienteItf) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/dispensaInvites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (Cookies.get("token") || ""),
        },
        body: JSON.stringify({
          dispensaId: dispensaId,
          convidadoId: user.id,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        toast.error(`Erro ao enviar convite: ${error?.erro || "Erro desconhecido"}`)
        return
      }

      toast.success(`Convite enviado para "${user.nome}"!`)
      setIsOpen(false)
    } catch (err) {
      console.error("Erro na requisição de convite:", err)
      toast.error("Erro de rede ao enviar convite.")
    }
  }

  const usuariosFiltradosPorBusca = clientesFiltrados.filter(
    (cliente) =>
      cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      <button
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <UserPlus2 size={16} />
        <span>Convidar funcionário</span>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} showCloseButton={false}>
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                <UsersRound className="w-3.5 h-3.5" />
                Convite de acesso
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Convidar funcionário</h2>
              <p className="text-sm text-slate-500 max-w-2xl">
                Selecione um usuário para enviar o convite e permitir que ele participe desta dispensa.
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="max-h-[58vh] overflow-y-auto pr-1">
                {usuariosFiltradosPorBusca.length === 0 ? (
                  <div className="text-center py-14 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                      <UserPlus2 size={32} className="text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">Nenhum funcionário encontrado</p>
                    <p className="text-sm text-slate-400 mt-1">Tente buscar por outro nome ou email</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {usuariosFiltradosPorBusca.map((cliente) => (
                      <button
                        key={cliente.id}
                        onClick={() => handleSelecionarUsuario(cliente)}
                        className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center shadow-sm flex-shrink-0">
                            <span className="text-lg font-bold text-white select-none">{getInitial(cliente?.nome)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-base font-semibold text-slate-900 truncate">
                                {cliente?.nome || "Nome do Usuário"}
                              </h3>
                              <Send size={16} className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 truncate">
                              <Mail size={14} />
                              <span className="truncate">{cliente.email}</span>
                            </div>
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              <CheckCircle2 size={12} />
                              Disponível para convite
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold">
                <UsersRound className="w-4 h-4 text-slate-600" />
                Resumo do convite
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-xl bg-white border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Funcionários encontrados</p>
                  <p className="text-lg font-semibold text-slate-900">{usuariosFiltradosPorBusca.length}</p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Já na dispensa</p>
                  <p className="text-lg font-semibold text-slate-900">{membros.length}</p>
                </div>
                <div className="rounded-xl bg-white border border-slate-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Fluxo</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Clique em um cartão para enviar o convite e liberar o acesso à dispensa.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Modal>
    </>
  )
}
