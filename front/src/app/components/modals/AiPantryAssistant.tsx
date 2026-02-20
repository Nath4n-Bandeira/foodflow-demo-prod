"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { X, Send, Loader2, Sandwich } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AddItemsResponse {
  action: "add"
  items: Array<{
    nome: string
    peso: number
    unidadeTipo: string
    perecivel: string
    validade: string | null
  }>
  message: string
}

interface RegisterUsageResponse {
  action: "register_usage"
  items: Array<{
    nome: string
    quantidade: number
  }>
  message: string
}

interface HelpResponse {
  action: "help"
  message: string
}

type AIResponse = AddItemsResponse | RegisterUsageResponse | HelpResponse

interface AIPantryAssistantProps {
  dispensaId: number | null
  isOpen: boolean
  onClose: () => void
}

export function AIPantryAssistant({ dispensaId, isOpen, onClose }: AIPantryAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || !dispensaId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/geminiPantry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token") || "",
        },
        body: JSON.stringify({
          userMessage: inputValue,
          dispensaId: dispensaId,
          conversationHistory: conversationHistory,
        }),
      })

      if (!response.ok) throw new Error("Erro ao processar a solicitação")

      const data = await response.json()
      let aiResponse: AIResponse

      try {
        aiResponse = JSON.parse(data.response)
      } catch {
        throw new Error("Resposta inválida do servidor")
      }

      if (aiResponse.action === "add") {
        // adiciona items na dispensa pelo ia agent
        for (const item of aiResponse.items) {
          const payload = {
            nome: item.nome,
            peso: Number(item.peso),
            perecivel: item.perecivel,
            unidadeTipo: item.unidadeTipo,
            dispensaId: dispensaId,
            ...(item.validade && { validade: new Date(item.validade).toISOString() }),
          }

          await fetch(`${process.env.NEXT_PUBLIC_URL_API}/alimentos/dispensa/${dispensaId}/alimentos`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + Cookies.get("token") || "",
            },
            body: JSON.stringify(payload),
          })
        }

        toast.success(
          `${aiResponse.items.length} ${aiResponse.items.length === 1 ? "item adicionado" : "itens adicionados"}!`,
          {
            style: {
              background: "#00c950",
              color: "#ffffff",
            },
          },
        )
      } else if (aiResponse.action === "register_usage") {
        // Primeiro, obtemtodos os alimentos na dispensa para corresponder pelo nome
        const foodsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_URL_API}/alimentos/dispensa/${dispensaId}/alimentos`,
          {
            headers: {
              Authorization: "Bearer " + Cookies.get("token") || "",
            },
          },
        )

        if (!foodsResponse.ok) throw new Error("Erro ao buscar alimentos")

        const foods = await foodsResponse.json()

        // mapeia os ids dos alimentos pelos na dispensa para registrar o uso
        const itemsWithIds = aiResponse.items
          .map((item) => {
            const food = foods.find((f: any) => f.nome.toLowerCase() === item.nome.toLowerCase())
            if (!food) {
              console.warn(`Alimento "${item.nome}" não encontrado na dispensa`)
              return null
            }
            return {
              id: food.id,
              quantidade: item.quantidade,
            }
          })
          .filter((item) => item !== null)

        if (itemsWithIds.length === 0) {
          throw new Error("Nenhum alimento encontrado na dispensa")
        }

        // registra o uso dos alimentos (2 dia pra arrumar oq tava bugando mano...)
        const usageResponse = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/alimentos/relatorio`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token") || "",
          },
          body: JSON.stringify({
            alimentos: itemsWithIds,
            dispensaId: dispensaId,
          }),
        })

        if (!usageResponse.ok) throw new Error("Erro ao registrar uso")

        toast.success(
          `Uso de ${aiResponse.items.length} ${aiResponse.items.length === 1 ? "item registrado" : "itens registrados"}!`,
          {
            style: {
              background: "#00c950",
              color: "#ffffff",
            },
          },
        )
      } else if (aiResponse.action === "help") {
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (aiResponse.action === "add" || aiResponse.action === "register_usage") {
        setTimeout(() => {
          router.refresh()
        }, 1000)
      }
    } catch (error) {
      toast.error("Erro ao processar sua solicitação")
      console.error(error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-end z-50 p-4">
      <Card className="w-full max-w-md h-[600px] flex flex-col bg-white border border-slate-200 shadow-xl rounded-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Sandwich className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Assistente Inteligente</h3>
              <p className="text-xs text-slate-500">Adicione itens com IA</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="p-4 bg-green-50 rounded-full mb-4">
                <Sandwich className="w-12 h-12 text-green-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Bem-vindo ao Assistente Inteligente!</h4>
              <p className="text-slate-500 text-sm mb-4">
                Descreva os itens que deseja adicionar à sua dispensa e eu vou adicioná-los automaticamente usando
                inteligência artificial.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-slate-600 text-xs font-medium mb-2">Exemplo:</p>
                <p className="text-slate-500 text-xs italic">"Adicione 2kg de arroz, 1 litro de leite e 5 maçãs"</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    message.role === "user"
                      ? "bg-green-600 text-white rounded-br-none shadow-md"
                      : "bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200"
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
              <div className="bg-slate-100 text-slate-900 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                  <span className="text-sm text-slate-600">Processando sua solicitação...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ex: 2kg de arroz, 1 litro de leite..."
              className="flex-1 bg-white border-slate-200 text-slate-900 focus:ring-2 focus:ring-green-500"
              disabled={isLoading || !dispensaId}
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim() || !dispensaId}
              className="bg-green-600 hover:bg-green-700 text-white px-4 shadow-sm hover:shadow-md transition-all"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {!dispensaId && (
            <p className="text-xs text-slate-500 mt-2">Navegue até uma dispensa para usar o assistente</p>
          )}
        </form>
      </Card>
    </div>
  )
}
