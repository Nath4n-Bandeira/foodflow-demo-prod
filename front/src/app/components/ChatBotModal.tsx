"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useChatbotStore, type SelectedItem } from "@/src/app/context/ChatBotContext"
import { X, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { chatWithGemini } from "@/lib/gemini"
import { toast } from "sonner"

export function ChatbotModal() {
  const {
    isOpen,
    setIsOpen,
    messages,
    addMessage,
    selectedItems,
    removeSelectedItem,
    clearSelectedItems,
    clearMessages,
    isLoading,
    setIsLoading,
  } = useChatbotStore()

  const [inputValue, setInputValue] = useState("")
  const [dispensaItems, setDispensaItems] = useState<SelectedItem[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: inputValue,
      timestamp: new Date(),
    }

    addMessage(userMessage)
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await chatWithGemini(inputValue, selectedItems)
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: response,
        timestamp: new Date(),
      }
      addMessage(assistantMessage)
    } catch (error) {
      toast.error("Erro ao gerar resposta do chatbot")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-end z-50 p-4">
      <Card className="w-full max-w-md h-[600px] flex flex-col bg-white border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Assistente Culinário</h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-slate-500 text-sm">
                Selecione itens de sua dispensa e faça perguntas sobre receitas, preparo ou combinações de alimentos.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-green-600 text-white rounded-br-none"
                      : "bg-slate-100 text-slate-900 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg rounded-bl-none">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {selectedItems.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600">ITENS SELECIONADOS ({selectedItems.length})</p>
              <button onClick={clearSelectedItems} className="text-xs text-slate-500 hover:text-slate-700">
                Limpar
              </button>
            </div>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-slate-50 p-2 rounded text-xs">
                  <span className="text-slate-700">
                    {item.nome} ({item.peso} {item.unidadeTipo})
                  </span>
                  <button onClick={() => removeSelectedItem(item.id)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Faça uma pergunta..."
            className="flex-1 bg-slate-50 border-slate-200 text-slate-900"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  )
}
