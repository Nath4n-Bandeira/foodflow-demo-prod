"use client"

import { useFriendsStore } from "@/src/app/context/FriendsContext"
import { useClienteStore } from "@/src/app/context/ClienteContext"
import { useEffect, useState } from "react"
import { UserPlus, UserX } from 'lucide-react'
import Cookies from "js-cookie"

interface PendingRequest {
  id: string
  solicitanteId: string
  solicitante: {
    id: string
    nome: string
    email: string
  }
  status: "pending"
  createdAt: string
}

export default function PendingFriendRequests() {
  const { friendRequests, acceptFriendRequest, rejectFriendRequest } = useFriendsStore()
  const { cliente } = useClienteStore()
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (cliente?.id) {
      loadPendingRequests()
    }
  }, [cliente?.id])

  const loadPendingRequests = async () => {
    try {
      setIsLoading(false)
      const token = Cookies.get("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/friendRequests/${cliente?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPendingRequests(data)
      }
    } catch (error) {
      setIsLoading(false)
    }
  }

  const handleAccept = async (request: PendingRequest) => {
    try {
      await acceptFriendRequest(request.id, {
        id: request.solicitante.id,
        nome: request.solicitante.nome,
        email: request.solicitante.email,
      })
      setPendingRequests(pendingRequests.filter((r) => r.id !== request.id))
    } catch (error) {
    }
  }

  const handleReject = async (request: PendingRequest) => {
    try {
      await rejectFriendRequest(request.id)
      setPendingRequests(pendingRequests.filter((r) => r.id !== request.id))
    } catch (error) {
    }
  }

  if (isLoading) {
    return null
  }

  if (pendingRequests.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="p-4 border-b border-gray-200 bg-green-50">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-green-600" />
          Solicitações de Amizade ({pendingRequests.length})
        </h2>
      </div>

      <div className="divide-y divide-gray-100">
        {pendingRequests.map((request) => (
          <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-lg">
                {request.solicitante.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{request.solicitante.nome}</p>
                <p className="text-sm text-gray-500">{request.solicitante.email}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(request.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAccept(request)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium text-sm"
              >
                Aceitar
              </button>
              <button
                onClick={() => handleReject(request)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors font-medium text-sm flex items-center gap-2"
              >
                <UserX className="w-4 h-4" />
                Rejeitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
