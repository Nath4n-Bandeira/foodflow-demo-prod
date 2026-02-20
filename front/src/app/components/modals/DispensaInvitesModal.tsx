"use client"
import { useState, useEffect } from "react"
import { X, PackagePlus, PackageCheck } from "lucide-react"
import { useClienteStore } from "@/src/app/context/ClienteContext"
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

export default function DispensaInvitesModal() {
  const [isOpen, setIsOpen] = useState(false)
  const { cliente } = useClienteStore()
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && cliente?.id) {
      loadPendingInvites()
    }
  }, [isOpen, cliente?.id])

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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium relative"
      >
        <PackagePlus className="w-5 h-5" />
        <span className="hidden sm:inline">Convites</span>
        {pendingInvites.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {pendingInvites.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <PackagePlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Convites de Dispensa</h2>
                  <p className="text-sm text-gray-500">{pendingInvites.length} convite(s) pendente(s)</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm text-gray-500">Carregando convites...</p>
                </div>
              ) : pendingInvites.length > 0 ? (
                <div className="space-y-3">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-white select-none">
                            {invite.dispensa.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <h3 className="text-base font-bold text-gray-900 truncate">{invite.dispensa.nome}</h3>
                          <p className="text-sm text-gray-600 truncate">
                            Convidado por <span className="font-medium">{invite.convidadoPor.nome}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(invite.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(invite)}
                          className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <PackageCheck className="w-4 h-4" />
                          Aceitar
                        </button>
                        <button
                          onClick={() => handleReject(invite)}
                          className="flex-1 px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors font-medium text-sm"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PackagePlus className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum convite pendente</h3>
                  <p className="text-sm text-gray-500">Você não tem convites de dispensa no momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
