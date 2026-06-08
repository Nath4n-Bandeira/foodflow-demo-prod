"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Cookies from "js-cookie"
import { ArrowLeft, BadgeDollarSign, Loader2, Search, Store } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type PriceMarket = {
  id: number
  nomeOriginal: string
  mercadoNome: string
  mercadoCnpj?: string
  dataCompra?: string
  quantidade: number
  unidade: string
  valorUnitario: number
  valorTotal?: number
}

type PriceGroup = {
  nomeGrupo: string
  representante: string
  menorPreco: number
  quantidadeMercados: number
  economiaPossivel: number
  mercados: PriceMarket[]
}

export default function PriceComparisonPage() {
  return (
    <Suspense fallback={<PriceComparisonFallback />}>
      <PriceComparisonContent />
    </Suspense>
  )
}

function PriceComparisonContent() {
  const searchParams = useSearchParams()
  const dispensaId = searchParams.get("dispensaId")
  const [groups, setGroups] = useState<PriceGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchPrices() {
      if (!dispensaId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/notasFiscais/comparacao?dispensaId=${dispensaId}`, {
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error ?? "Erro ao buscar comparacao.")
        }

        setGroups(data)
      } catch (error) {
        console.error("Erro ao buscar precos:", error)
        toast.error(error instanceof Error ? error.message : "Erro ao buscar comparacao de precos.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrices()
  }, [dispensaId])

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return groups

    return groups.filter((group) => {
      const groupText = `${group.nomeGrupo} ${group.representante}`.toLowerCase()
      const marketText = group.mercados.map((item) => `${item.nomeOriginal} ${item.mercadoNome}`).join(" ").toLowerCase()
      return groupText.includes(term) || marketText.includes(term)
    })
  }, [groups, searchTerm])

  return (
    <main className="min-h-screen bg-[#f8fafc] px-3 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={dispensaId ? `/dispensa/${dispensaId}` : "/perfil"} className="mb-3 inline-flex">
              <Button variant="outline" className="h-9">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-[#1d293d]">Comparacao de precos</h1>
            <p className="mt-1 text-sm text-[#62748e]">Itens alimenticios importados por NFC-e, agrupados por nomes parecidos.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-80">
            <SummaryCard label="Grupos" value={String(groups.length)} />
            <SummaryCard
              label="Mercados"
              value={String(new Set(groups.flatMap((group) => group.mercados.map((item) => item.mercadoNome))).size)}
            />
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-md border border-[#e2e8f0] bg-white p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90a1b9]" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar produto ou mercado..."
              className="h-10 border-[#dbe4ef] pl-10"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-[#62748e]">
            <BadgeDollarSign className="h-4 w-4 text-green-600" />
            {filteredGroups.filter((group) => group.quantidadeMercados > 1).length} comparacoes entre mercados
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-96 items-center justify-center rounded-md border border-[#e2e8f0] bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          </div>
        ) : !dispensaId ? (
          <EmptyState text="Abra esta pagina a partir de uma dispensa para comparar os precos importados." />
        ) : filteredGroups.length === 0 ? (
          <EmptyState text="Nenhum historico de nota fiscal encontrado para comparar." />
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <section key={`${group.nomeGrupo}-${group.representante}`} className="rounded-md border border-[#e2e8f0] bg-white">
                <div className="flex flex-col gap-3 border-b border-[#e2e8f0] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-[#1d293d]">{group.nomeGrupo}</h2>
                    <p className="mt-1 truncate text-sm text-[#62748e]">{group.representante}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:w-72">
                    <SummaryCard label="Menor preco" value={formatCurrency(group.menorPreco)} highlight />
                    <SummaryCard label="Economia" value={formatCurrency(group.economiaPossivel)} />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-[#f8fafc] text-xs uppercase text-[#62748e]">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Mercado</th>
                        <th className="px-4 py-3 text-left font-semibold">Nome na nota</th>
                        <th className="px-4 py-3 text-right font-semibold">Preco unit.</th>
                        <th className="px-4 py-3 text-right font-semibold">Qtd.</th>
                        <th className="px-4 py-3 text-left font-semibold">Compra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.mercados.map((market) => {
                        const isBest = market.valorUnitario === group.menorPreco

                        return (
                          <tr key={market.id} className="border-t border-[#f1f5f9]">
                            <td className="px-4 py-3 text-[#1d293d]">
                              <div className="flex min-w-0 items-center gap-2">
                                <Store className="h-4 w-4 shrink-0 text-[#62748e]" />
                                <span className="truncate">{market.mercadoNome}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#334155]">{market.nomeOriginal}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${isBest ? "text-green-700" : "text-[#334155]"}`}>
                              {formatCurrency(market.valorUnitario)}
                            </td>
                            <td className="px-4 py-3 text-right text-[#334155]">
                              {market.quantidade} {market.unidade}
                            </td>
                            <td className="px-4 py-3 text-[#64748b]">{formatDate(market.dataCompra)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function PriceComparisonFallback() {
  return (
    <main className="min-h-screen bg-[#f8fafc] px-3 py-6 sm:px-6">
      <div className="mx-auto flex min-h-96 max-w-7xl items-center justify-center rounded-md border border-[#e2e8f0] bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    </main>
  )
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${highlight ? "border-green-200 bg-green-50" : "border-[#e2e8f0] bg-white"}`}>
      <p className="text-xs font-medium uppercase text-[#62748e]">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${highlight ? "text-green-700" : "text-[#1d293d]"}`}>{value}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-96 items-center justify-center rounded-md border border-dashed border-[#cbd5e1] bg-white px-6 text-center">
      <p className="max-w-md text-sm text-[#62748e]">{text}</p>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0)
}

function formatDate(value?: string) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value))
}
