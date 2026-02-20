"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import { Send, X } from "lucide-react"
import { useFriendsStore, type Friend } from "../context/FriendsContext"
import { useClienteStore } from "../context/ClienteContext"

interface ChatBoxProps {
  friend: Friend
  onClose: () => void
}

export function ChatBox({ friend, onClose }: ChatBoxProps) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false) // Added loading state
  const { cliente } = useClienteStore()
  const { sendMessage, getConversation, loadConversation } = useFriendsStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const conversation = getConversation(cliente.id, friend.id)

  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true)
      await loadConversation(cliente.id, friend.id)
      setIsLoading(false)
    }
    fetchMessages()
  }, [cliente.id, friend.id, loadConversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  if (!friend || !friend.id) {
    console.error("[v0] ChatBox received invalid friend object:", friend)
    return null
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      await sendMessage({
        senderId: cliente.id,
        receiverId: friend.id,
        content: message.trim(),
      })
      setMessage("")
    }
  }

  const friendName = friend.nome || friend.email || "Usuário"
  const friendInitial = friendName.charAt(0).toUpperCase()

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-green-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white text-green-600 flex items-center justify-center font-semibold">
            {friendInitial}
          </div>
          <div>
            <p className="font-semibold">{friendName}</p>
            <p className="text-xs text-green-100">Online</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-green-700 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Carregando mensagens...</p>
          </div>
        ) : conversation.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm">Envie uma mensagem para começar!</p>
          </div>
        ) : (
          conversation.map((msg) => {
            const isOwn = msg.senderId === cliente.id
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn ? "bg-green-600 text-white" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? "text-green-100" : "text-gray-500"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
