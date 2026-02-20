"use client"

import { MessageCircle } from "lucide-react"
import { useChatbotStore } from "@/src/app/context/ChatBotContext"
import { useEffect, useState } from "react"

export function ChatbotIcon() {
  const { isOpen, setIsOpen, messages } = useChatbotStore()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token")
    setIsLoggedIn(!!token)
  }, [])

  if (!isLoggedIn) return null

  const unreadCount = messages.length > 0 ? 1 : 0

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="fixed left-6 bottom-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-40"
      aria-label="Abrir chatbot"
    >
      <MessageCircle className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  )
}
