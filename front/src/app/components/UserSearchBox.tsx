"use client"
import { useState, useEffect } from "react"
import { Search, UserPlus, X, Loader2 } from 'lucide-react'
import { useFriendsStore, type Friend } from "../context/FriendsContext"
import { useClienteStore } from "../context/ClienteContext"
import { toast } from "sonner"

export function UserSearchBox() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [allUsers, setAllUsers] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set())
  const { friends, sendFriendRequest, friendRequests } = useFriendsStore()
  const { cliente } = useClienteStore()

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/clientes`)

        if (!response.ok) {
          throw new Error("Erro ao carregar usuários")
        }

        const data = await response.json()

        let users: Friend[] = []
        if (Array.isArray(data)) {
          users = data
        } else if (data.clientes && Array.isArray(data.clientes)) {
          users = data.clientes
        } else if (data.data && Array.isArray(data.data)) {
          users = data.data
        } else {
          throw new Error("Formato de resposta inválido")
        }

        setAllUsers(users)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar usuários")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filteredUsers = Array.isArray(allUsers)
    ? allUsers.filter(
        (user) =>
          user.id !== cliente.id &&
          !friends.some((f) => f.id === user.id) &&
          (user.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : []

  const isFriendRequestSent = (userId: string) => {
    return friendRequests.some((r) => r.receiverId === userId && r.status === "pending") || pendingRequests.has(userId)
  }

  const handleAddFriend = async (user: Friend) => {
    setPendingRequests((prev) => new Set([...prev, user.id]))
    try {
      await sendFriendRequest(user.id, user.nome, user.email)
      setSearchQuery("")
      toast.success(`Pedido de amizade enviado para ${user.nome}!`, {
        style: {
          background: "#00c950",
          color: "#ffffff",
        },
      })
    } catch (error) {
      setPendingRequests((prev) => {
        const next = new Set(prev)
        next.delete(user.id)
        return next
      })
      toast.error("Erro ao enviar pedido de amizade.")
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Procurar usuários..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          disabled={loading}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
        {searchQuery && !loading && (
          <button
            onClick={() => {
              setSearchQuery("")
              setIsOpen(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="absolute z-50 w-full mt-2 bg-red-50 rounded-lg shadow-lg border border-red-200 p-4 text-center text-red-600">
          {error}
        </div>
      )}

      {isOpen && searchQuery && !loading && !error && filteredUsers.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                  {user.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.nome}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleAddFriend(user)}
                disabled={isFriendRequestSent(user.id) || pendingRequests.has(user.id)}
                className={`p-2 rounded-lg text-white transition-colors ${
                  isFriendRequestSent(user.id) || pendingRequests.has(user.id)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                title={isFriendRequestSent(user.id) ? "Pedido de amizade enviado" : "Enviar pedido de amizade"}
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isOpen && searchQuery && !loading && !error && filteredUsers.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-center text-gray-500">
          Nenhum usuário encontrado
        </div>
      )}
    </div>
  )
}
