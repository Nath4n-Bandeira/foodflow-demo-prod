"use client"

import type React from "react"
import { useState } from "react"
import { usePantryAssistantStore } from "@/src/app/context/PantryAssistantContext"
import { X, Plus, Trash2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

interface ProductItem {
  nome: string
  peso: number
  perecivel: string
  unidadeTipo: string
  validade: string
}

export function PantryAssistantModal() {
  const { isOpen, setIsOpen, dispensaId } = usePantryAssistantStore()

  const [products, setProducts] = useState<ProductItem[]>([
    {
      nome: "",
      peso: 0,
      perecivel: "NÃO",
      unidadeTipo: "KG",
      validade: "",
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const addProduct = () => {
    setProducts([
      ...products,
      {
        nome: "",
        peso: 0,
        perecivel: "NÃO",
        unidadeTipo: "KG",
        validade: "",
      },
    ])
  }

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index))
    }
  }

  const updateProduct = (index: number, field: keyof ProductItem, value: string | number) => {
    const newProducts = [...products]
    newProducts[index] = { ...newProducts[index], [field]: value }
    setProducts(newProducts)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dispensaId) {
      toast.error("Selecione uma dispensa primeiro")
      return
    }

    const invalidProducts = products.filter((p) => !p.nome.trim() || p.peso <= 0)
    if (invalidProducts.length > 0) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setIsLoading(true)

    try {
      // E VAI PRO DB
      for (const product of products) {
        const payload = {
          nome: product.nome,
          peso: Number(product.peso),
          perecivel: product.perecivel,
          unidadeTipo: product.unidadeTipo,
          dispensaId: dispensaId,
          ...(product.validade && { validade: new Date(product.validade).toISOString() }),
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/alimentos/dispensa/${dispensaId}/alimentos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + Cookies.get("token") || "",
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Erro ao adicionar ${product.nome}`)
        }
      }

      toast.success(
        `${products.length} ${products.length === 1 ? "item adicionado" : "itens adicionados"} com sucesso!`,
        {
          style: {
            background: "#00c950",
            color: "#ffffff",
          },
        },
      )
      // formulário reset
      setProducts([
        {
          nome: "",
          peso: 0,
          perecivel: "NÃO",
          unidadeTipo: "KG",
          validade: "",
        },
      ])

      setIsOpen(false)

      // refreshizinhop pq as vezes n atualiza a lista
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (error) {
      toast.error("Erro ao adicionar itens")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Adicionar Itens à Dispensa</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {products.map((product, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-900">Produto {index + 1}</h4>
                  {products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nome do Item <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={product.nome}
                      onChange={(e) => updateProduct(index, "nome", e.target.value)}
                      placeholder="Ex: Arroz, Feijão, Maçã"
                      className="bg-white border-slate-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Quantidade/Peso <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={product.peso || ""}
                      onChange={(e) => updateProduct(index, "peso", Number(e.target.value))}
                      placeholder="Ex: 2.5"
                      className="bg-white border-slate-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Unidade <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={product.unidadeTipo}
                      onChange={(e) => updateProduct(index, "unidadeTipo", e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white text-slate-900 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="KG">Quilograma (KG)</option>
                      <option value="PCT">Pacote (PCT)</option>
                      <option value="REDE">Rede (REDE)</option>
                      <option value="DUZIA">Dúzia (DUZIA)</option>
                      <option value="LT">Litro (LT)</option>
                      <option value="Unid">Unidade (Unid)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Perecível <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={product.perecivel}
                      onChange={(e) => updateProduct(index, "perecivel", e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white text-slate-900 shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="NÃO">Não</option>
                      <option value="SIM">Sim</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Data de Validade <span className="text-slate-500 text-xs">(opcional)</span>
                    </label>
                    <Input
                      type="date"
                      value={product.validade}
                      onChange={(e) => updateProduct(index, "validade", e.target.value)}
                      className="bg-white border-slate-200"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              onClick={addProduct}
              variant="outline"
              className="w-full border-dashed border-2 border-slate-300 hover:border-green-600 hover:bg-green-50 text-slate-700 hover:text-green-700 bg-transparent"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar outro produto
            </Button>
          </div>

          <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="border-slate-200 text-slate-700"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
            >
              {isLoading
                ? "Adicionando..."
                : `Adicionar ${products.length} ${products.length === 1 ? "Item" : "Itens"}`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
