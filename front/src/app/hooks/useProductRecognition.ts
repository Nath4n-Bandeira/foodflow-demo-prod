"use client"
import { useState, useCallback } from "react"
import { toast } from "sonner"

interface ExtractedProductData {
  nome: string
  marca?: string | null
  peso?: number | null
  unidade?: string
  validade?: string | null
  ingredientes?: string | null
  nutrientes?: Record<string, any>
  codigoBarras?: string | null
  confianca?: number
}

export function useProductRecognition(dispensaId: number) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ExtractedProductData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeImage = useCallback(
    async (imageData: string) => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem("token") || sessionStorage.getItem("token")
        if (!token) {
          throw new Error("Sessão expirada. Faça login novamente.")
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_URL_API}/productRecognition/analyze`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              image: imageData,
              dispensaId: Number(dispensaId),
            }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.erro || errorData.error || "Erro ao analisar imagem")
        }

        const result = await response.json()
        
        if (!result.sucesso) {
          throw new Error(result.erro || "Erro desconhecido")
        }

        setData(result.dados)
        toast.success("Embalagem analisada com sucesso!")
        return result.dados
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao analisar imagem"
        setError(errorMessage)
        toast.error(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [dispensaId]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    loading,
    data,
    error,
    analyzeImage,
    reset,
  }
}
