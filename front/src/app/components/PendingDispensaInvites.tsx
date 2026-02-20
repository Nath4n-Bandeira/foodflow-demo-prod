"use client"

import { useClienteStore } from "@/src/app/context/ClienteContext"
import { useEffect, useState } from "react"
import { PackagePlus, PackageX } from "lucide-react"
import Cookies from "js-cookie"
import { toast } from "sonner"

interface PendingInvite {
  id: string
  dispensaId: number
  convidadoPorId: string
  convidadoId: string
  status: "pending"
  createdAt: string
  dispensa: {
    id: number
    nome: string
  }
  convidadoPor: {
    id: string
    nome: string
    email: string
  }
}

export default function PendingDispensaInvites() {
  const { cliente } = useClienteStore()
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (cliente?.id) {
      loadPendingInvites()
    }
  }, [cliente?.id])

  const loadPendingInvites = async () => {
    try {
      setIsLoading(true)
      const token = Cookies.get("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/dispensaInvites/${cliente?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPendingInvites(data)
      }
    } catch (error) {
      console.error("Erro ao carregar convites:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async (invite: PendingInvite) => {
    try {
      const token = Cookies.get("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/dispensaInvites/${invite.id}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success(`Você agora é membro da dispensa "${invite.dispensa.nome}"!`)
        setPendingInvites(pendingInvites.filter((i) => i.id !== invite.id))
      } else {
        toast.error("Erro ao aceitar convite")
      }
    } catch (error) {
      console.error("Erro ao aceitar convite:", error)
      toast.error("Erro ao aceitar convite")
    }
  }

  const handleReject = async (invite: PendingInvite) => {
    try {
      const token = Cookies.get("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/dispensaInvites/${invite.id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success("Convite rejeitado")
        setPendingInvites(pendingInvites.filter((i) => i.id !== invite.id))
      } else {
        toast.error("Erro ao rejeitar convite")
      }
    } catch (error) {
      console.error("Erro ao rejeitar convite:", error)
      toast.error("Erro ao rejeitar convite")
    }
  }

  if (isLoading) {
    return null
  }

  if (pendingInvites.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-4 border-b border-gray-200 bg-green-50">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-green-600" />
          Convites para Dispensas ({pendingInvites.length})
        </h2>
      </div>

      <div className="divide-y divide-gray-100">
        {pendingInvites.map((invite) => (
          <div key={invite.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-lg">
                    {invite.dispensa.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{invite.dispensa.nome}</p>
                    <p className="text-sm text-gray-600">
                      Convidado por <span className="font-medium">{invite.convidadoPor.nome}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(invite.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAccept(invite)}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  Aceitar
                </button>
                <button
                  onClick={() => handleReject(invite)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors font-medium text-sm flex items-center gap-2"
                >
                  <PackageX className="w-4 h-4" />
                  Rejeitar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
