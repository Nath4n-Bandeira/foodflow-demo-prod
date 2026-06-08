"use client"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import React from "react"

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

interface ProductConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  data: ExtractedProductData | null
  loading: boolean
  dispensaId: number
  usuarioId: string
  onProductCreated?: () => void
}

export function ProductConfirmationModal({
  isOpen,
  onClose,
  data,
  loading,
  dispensaId,
  usuarioId,
  onProductCreated,
}: ProductConfirmationModalProps) {
  const [formData, setFormData] = useState<ExtractedProductData>(data ?? { nome: "" })
  const [submitting, setSubmitting] = useState(false)
  const [confianca, setConfianca] = useState(data?.confianca || 0.95)

  // Atualizar formData quando data mudar
  React.useEffect(() => {
    if (data) {
      setFormData(data)
      setConfianca(data.confianca || 0.95)
    }
  }, [data])

  const handleInputChange = (
    field: keyof ExtractedProductData,
    value: string | number | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || null,
    }))
  }

  const handleSubmit = async () => {
    try {
      if (!formData.nome || formData.nome.trim() === "") {
        toast.error("Nome do produto é obrigatório")
        return
      }

      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      if (!token) {
        toast.error("Sessão expirada. Faça login novamente.")
        return
      }

      setSubmitting(true)

      // Preparar dados para envio
      const produtoData = {
        nome: formData.nome,
        marca: formData.marca || null,
        peso: formData.peso ? Number(formData.peso) : null,
        unidade: formData.unidade || "KG",
        validade: formData.validade || null,
        ingredientes: formData.ingredientes || null,
        nutrientes: formData.nutrientes || null,
        imagemUrl: null,
        confianca: confianca,
        dispensaId: Number(dispensaId),
        usuarioId: usuarioId,
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_URL_API}/productRecognition/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(produtoData),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.erro || error.error || "Erro ao criar produto")
      }

      const result = await response.json()
      toast.success("Produto criado com sucesso!")
      onProductCreated?.()
      onClose()
    } catch (error) {
      console.error("Erro:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao criar produto")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar Dados do Produto</DialogTitle>
          <DialogDescription>
            Revise os dados extraídos da embalagem. Edite se necessário.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2">Analisando embalagem...</span>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Confiança da análise */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {confianca >= 0.8 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : confianca >= 0.5 ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  Confiança da Análise: {(confianca * 100).toFixed(0)}%
                </CardTitle>
              </CardHeader>
              {confianca < 0.8 && (
                <CardContent className="text-xs text-gray-600">
                  A confiança é relativamente baixa. Verifique bem os dados extraídos.
                </CardContent>
              )}
            </Card>

            {/* Formulário de edição */}
            <div className="space-y-4">
              {/* Nome do Produto */}
              <div>
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={formData.nome || ""}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  placeholder="Ex: Arroz Integral 1kg"
                  className="mt-1"
                />
              </div>

              {/* Marca */}
              <div>
                <Label htmlFor="marca">Marca</Label>
                <Input
                  id="marca"
                  value={formData.marca || ""}
                  onChange={(e) => handleInputChange("marca", e.target.value)}
                  placeholder="Ex: Marca X"
                  className="mt-1"
                />
              </div>

              {/* Peso e Unidade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="peso">Peso</Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.01"
                    value={formData.peso || ""}
                    onChange={(e) => handleInputChange("peso", e.target.value ? Number(e.target.value) : null)}
                    placeholder="1000"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="unidade">Unidade</Label>
                  <select
                    id="unidade"
                    value={formData.unidade || "KG"}
                    onChange={(e) => handleInputChange("unidade", e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="KG">KG</option>
                    <option value="G">G</option>
                    <option value="ML">ML</option>
                    <option value="L">L</option>
                    <option value="PCT">PCT</option>
                    <option value="REDE">REDE</option>
                    <option value="DUZIA">DUZIA</option>
                    <option value="Unid">Unid</option>
                  </select>
                </div>
              </div>

              {/* Validade */}
              <div>
                <Label htmlFor="validade">Data de Validade</Label>
                <Input
                  id="validade"
                  type="date"
                  value={formData.validade || ""}
                  onChange={(e) => handleInputChange("validade", e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Ingredientes */}
              <div>
                <Label htmlFor="ingredientes">Ingredientes</Label>
                <Textarea
                  id="ingredientes"
                  value={formData.ingredientes || ""}
                  onChange={(e) => handleInputChange("ingredientes", e.target.value)}
                  placeholder="Lista de ingredientes"
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Código de Barras */}
              {formData.codigoBarras && (
                <div>
                  <Label>Código de Barras</Label>
                  <Input
                    type="text"
                    value={formData.codigoBarras}
                    readOnly
                    className="mt-1 bg-gray-100"
                  />
                </div>
              )}

              {/* Nutrientes (resumo) */}
              {formData.nutrientes && Object.keys(formData.nutrientes).length > 0 && (
                <Card className="bg-gray-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Informação Nutricional (por 100g)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(formData.nutrientes).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize text-gray-600">{key}:</span>
                          <span className="font-medium">{value || "-"}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            Nenhum dado disponível
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !data} className="gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar Produto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
