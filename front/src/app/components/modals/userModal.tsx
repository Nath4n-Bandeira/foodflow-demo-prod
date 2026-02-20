"use client"

import { LucideUserPlus2, Search, X } from "lucide-react"
import { useEffect, useState } from "react"
import Modal from "./modal"
import type { ClienteItf } from "@/src/app/utils/types/ClienteItf"
import { toast } from "sonner"
import Cookies from "js-cookie"

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
        className="px-4 py-2 bg-[#2c2c2c] text-[#ffffff] rounded-md hover:bg-[#1e1e1e] font-medium flex items-center gap-2 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <span>Convidar usuário</span>
        <LucideUserPlus2 size={16} />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Convidar Usuário</h2>
              <p className="text-sm text-gray-500 mt-1">Envie um convite para participar da dispensa</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

        
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
            />
          </div>

         
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {usuariosFiltradosPorBusca.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LucideUserPlus2 size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Nenhum usuário encontrado</p>
                <p className="text-sm text-gray-400 mt-1">Tente buscar por outro nome ou email</p>
              </div>
            ) : (
              usuariosFiltradosPorBusca.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => handleSelecionarUsuario(cliente)}
                  className="w-full bg-white rounded-lg border border-gray-200 hover:border-green-500 hover:shadow-md transition-all duration-200 flex items-center p-4 gap-4 text-left group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-transform">
                    <span className="text-xl font-bold text-white select-none">{getInitial(cliente?.nome)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {cliente?.nome || "Nome do Usuário"}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{cliente.email}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <LucideUserPlus2 size={20} className="text-green-600" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
