"use client"

import { useMemo } from "react"
import type { AlimentosItf } from "@/src/app/utils/types/AlimentosItf"
import {
  AlertTriangle,
  CalendarClock,
  ExternalLink,
  PackageSearch,
  Sparkles,
  Store,
  Truck,
  TrendingUp,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RestockInsightsModalProps {
  isOpen: boolean
  onClose: () => void
  alimentos: AlimentosItf[]
  dispensaNome: string
}

interface SupplierRecommendation {
  name: string
  url: string
  description: string
}

interface ExpiringItemInsight {
  alimento: AlimentosItf
  daysUntilExpiry: number
}

interface RestockInsights {
  validItemsCount: number
  expiredCount: number
  criticalCount: number
  soonCount: number
  mediumCount: number
  lateCount: number
  suggestedWindowLabel: string
  recommendedRestockDate: string | null
  primaryReason: string
  expiringItems: ExpiringItemInsight[]
  suppliers: Array<SupplierRecommendation & { category: string }>
}

const dayMs = 1000 * 60 * 60 * 24

const supplierCatalog: Record<string, SupplierRecommendation[]> = {
  secos: [
    {
      name: "Assaí Atacadista",
      url: "https://www.assai.com.br",
      description: "Bom para repor arroz, feijão, farinha e itens de giro alto em volume.",
    },
    {
      name: "Atacadão",
      url: "https://www.atacadao.com.br",
      description: "Útil para compras grandes de básicos com preço de atacado.",
    },
    {
      name: "Mercado Livre",
      url: "https://www.mercadolivre.com.br",
      description: "Prático para achar marcas variadas e reposição rápida de itens embalados.",
    },
  ],
  pereciveis: [
    {
      name: "Pão de Açúcar",
      url: "https://www.paodeacucar.com",
      description: "Boa opção para laticínios, ovos e reposição com foco em variedade.",
    },
    {
      name: "Carrefour",
      url: "https://www.carrefour.com.br",
      description: "Cobertura ampla para perecíveis e compras mistas do dia a dia.",
    },
    {
      name: "Natural da Terra",
      url: "https://www.naturaldaterra.com.br",
      description: "Indicado para hortifruti e produtos frescos com mais frequência de reposição.",
    },
  ],
  hortifruti: [
    {
      name: "Natural da Terra",
      url: "https://www.naturaldaterra.com.br",
      description: "Forte em frutas, legumes e verduras, com foco em frescor.",
    },
    {
      name: "Carrefour",
      url: "https://www.carrefour.com.br",
      description: "Boa alternativa para hortifruti junto com outros itens da cesta.",
    },
    {
      name: "Atacadão",
      url: "https://www.atacadao.com.br",
      description: "Pode valer para compras em volume quando há consumo recorrente.",
    },
  ],
  geral: [
    {
      name: "Amazon Brasil",
      url: "https://www.amazon.com.br",
      description: "Boa para itens embalados, secos e compras com entrega prática.",
    },
    {
      name: "Mercado Livre",
      url: "https://www.mercadolivre.com.br",
      description: "Ajuda a comparar vendedores e preços rapidamente.",
    },
    {
      name: "Carrefour",
      url: "https://www.carrefour.com.br",
      description: "Opção versátil para repor o mix de alimentos da dispensa.",
    },
  ],
}

const categoryKeywords: Record<string, string[]> = {
  secos: [
    "arroz",
    "feij",
    "farinha",
    "macarr",
    "acucar",
    "açúcar",
    "sal",
    "oleo",
    "óleo",
    "aveia",
    "cereal",
    "milho",
    "lentilha",
    "grao",
    "grão",
    "cafe",
    "café",
    "biscoito",
    "pasta",
    "molho",
  ],
  pereciveis: [
    "leite",
    "iogurte",
    "queijo",
    "manteiga",
    "requeijao",
    "requeijão",
    "ovo",
    "carne",
    "frango",
    "peixe",
    "presunto",
    "salsicha",
    "creme",
    "refrigerado",
  ],
  hortifruti: [
    "banana",
    "maca",
    "maç",
    "tomate",
    "alface",
    "cebola",
    "batata",
    "cenoura",
    "alho",
    "verdura",
    "legume",
    "abac",
    "laranja",
    "uva",
    "limao",
    "limão",
  ],
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function getDaysUntilExpiry(validade: string) {
  const validityDate = new Date(validade)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  validityDate.setHours(0, 0, 0, 0)
  return Math.ceil((validityDate.getTime() - today.getTime()) / dayMs)
}

function getCategoryForProduct(productName: string) {
  const normalizedName = normalizeText(productName)

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => normalizedName.includes(keyword))) {
      return category
    }
  }

  return "geral"
}

function calculateRestockInsights(alimentos: AlimentosItf[]): RestockInsights {
  const expiringItems = alimentos
    .filter((item): item is AlimentosItf & { validade: string } => Boolean(item.validade))
    .map((item) => ({
      alimento: item,
      daysUntilExpiry: getDaysUntilExpiry(item.validade),
    }))
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)

  const validItemsCount = expiringItems.length

  if (validItemsCount === 0) {
    return {
      validItemsCount: 0,
      expiredCount: 0,
      criticalCount: 0,
      soonCount: 0,
      mediumCount: 0,
      lateCount: 0,
      suggestedWindowLabel: "Sem dados suficientes",
      recommendedRestockDate: null,
      primaryReason: "Cadastre datas de validade para liberar uma previsão de reposição mais precisa.",
      expiringItems: [],
      suppliers: supplierCatalog.geral.map((supplier) => ({ ...supplier, category: "Geral" })),
    }
  }

  const expiredCount = expiringItems.filter((item) => item.daysUntilExpiry < 0).length
  const criticalCount = expiringItems.filter((item) => item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 3).length
  const soonCount = expiringItems.filter((item) => item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7).length
  const mediumCount = expiringItems.filter((item) => item.daysUntilExpiry >= 8 && item.daysUntilExpiry <= 14).length
  const lateCount = expiringItems.filter((item) => item.daysUntilExpiry >= 15 && item.daysUntilExpiry <= 30).length

  const criticalRatio = criticalCount / validItemsCount
  const soonRatio = soonCount / validItemsCount
  const mediumRatio = mediumCount / validItemsCount
  const expiredOrCritical = expiredCount + criticalCount

  let suggestedWindowLabel = "Em até 3 semanas"
  let restockOffsetDays = 21
  let primaryReason = "Os vencimentos estão distribuídos ao longo das próximas semanas."

  if (expiredOrCritical >= 3 || criticalRatio >= 0.35) {
    suggestedWindowLabel = "Agora"
    restockOffsetDays = 0
    primaryReason = "Há itens vencidos ou vencendo imediatamente, então a reposição deve começar agora."
  } else if (soonRatio >= 0.35) {
    suggestedWindowLabel = "Nos próximos 3 dias"
    restockOffsetDays = 3
    primaryReason = "Uma fatia importante do estoque vence em até 7 dias."
  } else if (mediumRatio >= 0.5) {
    suggestedWindowLabel = "Na próxima semana"
    restockOffsetDays = 7
    primaryReason = "A maior parte dos itens entra na janela de risco de validade em até 14 dias."
  } else if (lateCount > 0) {
    suggestedWindowLabel = "Em até 2 semanas"
    restockOffsetDays = 14
    primaryReason = "Os itens têm folga maior, mas já vale planejar a próxima compra."
  }

  const restockDate = new Date()
  restockDate.setDate(restockDate.getDate() + restockOffsetDays)

  const categories = new Map<string, number>()
  expiringItems.forEach(({ alimento }) => {
    const category = getCategoryForProduct(alimento.nome)
    categories.set(category, (categories.get(category) || 0) + 1)
  })

  const suppliers = Array.from(categories.entries())
    .sort((a, b) => b[1] - a[1])
    .flatMap(([category]) =>
      (supplierCatalog[category] || supplierCatalog.geral).map((supplier) => ({
        ...supplier,
        category:
          category === "geral"
            ? "Geral"
            : category === "secos"
              ? "Secos"
              : category === "pereciveis"
                ? "Perecíveis"
                : "Hortifruti",
      })),
    )
    .filter((supplier, index, allSuppliers) => allSuppliers.findIndex((item) => item.url === supplier.url) === index)
    .slice(0, 6)

  if (suppliers.length === 0) {
    suppliers.push(...supplierCatalog.geral.map((supplier) => ({ ...supplier, category: "Geral" })))
  }

  return {
    validItemsCount,
    expiredCount,
    criticalCount,
    soonCount,
    mediumCount,
    lateCount,
    suggestedWindowLabel,
    recommendedRestockDate: formatDate(restockDate),
    primaryReason,
    expiringItems,
    suppliers,
  }
}

export function RestockInsightsModal({ isOpen, onClose, alimentos, dispensaNome }: RestockInsightsModalProps) {
  const insights = useMemo(() => calculateRestockInsights(alimentos), [alimentos])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[80vw] sm:max-w-[80vw] p-0 overflow-hidden border-[#e2e8f0] bg-white">
        <div className="max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                  <PackageSearch className="h-3.5 w-3.5" />
                  Planejamento de reposição
                </div>
                <DialogTitle className="text-[#1d293d] text-2xl sm:text-3xl">
                  Quando repor os itens de {dispensaNome}
                </DialogTitle>
                <DialogDescription className="text-[#62748e] max-w-3xl">
                  A leitura abaixo cruza todas as datas de validade disponíveis, destaca os itens mais críticos e sugere
                  fornecedores para você repor com antecedência.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6 bg-[#f8fafc]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white border-[#e2e8f0]">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-[#90a1b9] mb-1">Janela sugerida</p>
                  <p className="text-xl font-bold text-[#1d293d]">{insights.suggestedWindowLabel}</p>
                  <p className="text-sm text-[#62748e] mt-2">{insights.recommendedRestockDate || "Sem previsão"}</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-[#e2e8f0]">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-[#90a1b9] mb-1">Itens com validade</p>
                  <p className="text-xl font-bold text-[#1d293d]">{insights.validItemsCount}</p>
                  <p className="text-sm text-[#62748e] mt-2">Itens considerados no cálculo</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-[#e2e8f0]">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-[#90a1b9] mb-1">Críticos</p>
                  <p className="text-xl font-bold text-red-600">{insights.expiredCount + insights.criticalCount}</p>
                  <p className="text-sm text-[#62748e] mt-2">Vencidos ou até 3 dias</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-[#e2e8f0]">
                <CardContent className="p-4">
                  <p className="text-xs uppercase tracking-wide text-[#90a1b9] mb-1">Próximos a vencer</p>
                  <p className="text-xl font-bold text-amber-600">{insights.soonCount + insights.mediumCount}</p>
                  <p className="text-sm text-[#62748e] mt-2">Entre 4 e 14 dias</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border-[#e2e8f0]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[#1d293d] text-lg flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-amber-600" />
                  Melhor hora para repor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <p className="text-2xl font-bold text-[#1d293d]">{insights.suggestedWindowLabel}</p>
                    <p className="text-sm text-[#62748e] max-w-2xl">{insights.primaryReason}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">Data estimada</p>
                    <p className="text-lg font-bold text-amber-900">{insights.recommendedRestockDate || "Sem previsão"}</p>
                  </div>
                </div>

                {insights.expiringItems.length > 0 ? (
                  <div className="space-y-2">
                    {insights.expiringItems.slice(0, 6).map(({ alimento, daysUntilExpiry }) => {
                      const isCritical = daysUntilExpiry <= 3
                      return (
                        <div
                          key={alimento.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-[#e2e8f0] p-3"
                        >
                          <div>
                            <p className="font-medium text-[#1d293d]">{alimento.nome}</p>
                            <p className="text-sm text-[#62748e]">
                              {alimento.peso} {alimento.unidadeTipo}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={isCritical ? "destructive" : "secondary"}>
                              {daysUntilExpiry < 0
                                ? "Vencido"
                                : daysUntilExpiry === 0
                                  ? "Vence hoje"
                                  : daysUntilExpiry === 1
                                    ? "Vence amanhã"
                                    : `${daysUntilExpiry} dias`}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="bg-white border-[#e2e8f0]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[#1d293d] text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Distribuição de validade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-red-600">Vencidos</p>
                    <p className="text-2xl font-bold text-red-700">{insights.expiredCount}</p>
                  </div>
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-red-600">Até 3 dias</p>
                    <p className="text-2xl font-bold text-red-700">{insights.criticalCount}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-amber-600">4 a 7 dias</p>
                    <p className="text-2xl font-bold text-amber-700">{insights.soonCount}</p>
                  </div>
                  <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-yellow-700">8 a 14 dias</p>
                    <p className="text-2xl font-bold text-yellow-800">{insights.mediumCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="bg-white border-[#e2e8f0]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#1d293d] text-lg flex items-center gap-2">
                    <Store className="h-5 w-5 text-[#432dd7]" />
                    Fornecedores sugeridos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights.suppliers.map((supplier) => (
                    <a
                      key={supplier.url}
                      href={supplier.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-[#e2e8f0] p-4 transition-colors hover:border-[#c6d2ff] hover:bg-[#f8fafc]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-[#1d293d]">{supplier.name}</p>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                              {supplier.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#62748e]">{supplier.description}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-[#90a1b9] flex-shrink-0" />
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white border-[#e2e8f0]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#1d293d] text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#00c950]" />
                    Como interpretar a reposição
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-[#444444]">
                  <div className="flex items-start gap-3 rounded-xl bg-[#f8fafc] p-4 border border-[#e2e8f0]">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p>
                      Se muitos itens entram em janela crítica ao mesmo tempo, faça a compra agora para evitar ruptura
                      e desperdício.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-[#f8fafc] p-4 border border-[#e2e8f0]">
                    <Truck className="h-5 w-5 text-[#432dd7] mt-0.5 flex-shrink-0" />
                    <p>
                      Para itens secos, use atacadistas e compare preço por volume. Para perecíveis e hortifruti,
                      priorize entrega rápida e frequência de compra menor.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-[#f8fafc] p-4 border border-[#e2e8f0]">
                    <PackageSearch className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p>
                      A lista de fornecedores foi montada a partir do tipo de item mais próximo do vencimento, para
                      facilitar a reposição de insumos parecidos.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
