"use client"
import {
  Search,
  Settings,
  BarChart3,
  History,
  ChevronLeft,
  ChevronRight,
  Camera,
  QrCode,
  BadgeDollarSign,
  CalendarDays,
  Package,
  Scale,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import EditItemModal from "@/src/app/components/modals/editItemmodal"
import { PantryAssistantModal } from "@/src/app/components/PantryAssistantModal"
import { useEffect, useState, useCallback } from "react"
import type { AlimentosItf } from "../../utils/types/AlimentosItf"
import { useParams, useRouter, } from "next/navigation"
import UserModal from "@/src/app/components/modals/userModal"
import type { DispensaItf } from "@/src/app/utils/types/DispensaItf"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { ClienteItf } from "@/src/app/utils/types/ClienteItf"
import Cookies from "js-cookie"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { toast } from "sonner"
import { useChatbotStore } from "@/src/app/context/ChatBotContext"
import { usePantryAssistantStore } from "@/src/app/context/PantryAssistantContext"
import { ProductRecognitionFlow } from "@/src/app/components/ProductRecognitionFlow"
import { FiscalQrScannerModal } from "@/src/app/components/FiscalQrScannerModal"

export default function DispensaPage() {
  const [alimentos, setAlimentos] = useState<AlimentosItf[]>([])
  const [alimentoSelecionado, setAlimentoSelecionado] = useState<AlimentosItf | null>(null)
  const [dispensa, setDispensa] = useState<DispensaItf | null>(null)
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [showGrafico, setShowGrafico] = useState(false)
  const [funcionario, setFuncionario] = useState<ClienteItf[]>([])
  const params = useParams()
  const dispensaId = params?.id
  const router = useRouter()
  const [logado, setLogado] = useState<boolean>(false)
  const [mostrarUso, setMostrarUso] = useState(false)
  const [historico, setHistorico] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showCameraRecognition, setShowCameraRecognition] = useState(false)
  const [showFiscalScanner, setShowFiscalScanner] = useState(false)
  const { addSelectedItem, removeSelectedItem, selectedItems } = useChatbotStore()
  const { setIsOpen: setPantryAssistantOpen, setDispensaId } = usePantryAssistantStore()

  const [currentPage, setCurrentPage] = useState(1)
  const [usageCurrentPage, setUsageCurrentPage] = useState(1)
  const itemsPerPage = 10

  const buscaDados = useCallback(async () => {
    if (!dispensaId) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/alimentos/dispensa/${dispensaId}/alimentos`)
      const dados = await response.json()
      setAlimentos(dados)
    } catch (error) {
      console.error("Falha ao buscar alimentos:", error)
    }
  }, [dispensaId])

  async function buscarHistoricoUso() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/alimentos/relatorio/${dispensaId}`, {
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
        },
      })
      const dados = await response.json()
      setHistorico(dados)
      setMostrarUso(true)
    } catch (error) {
      console.error("Erro ao buscar histórico:", error)
      alert("Erro ao buscar histórico de uso.")
    }
  }

  useEffect(() => {
    if (Cookies.get("token")) {
      setLogado(true)
    } else {
      router.replace("/")
    }
  }, [])

  useEffect(() => {
    async function buscaDispensa() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/dispensa/${dispensaId}`)
        const dados = await response.json()
        setDispensa(dados)
        setFuncionario(dados.membros || [])
      } catch (error) {
        console.error("Falha ao buscar dados da dispensa:", error)
      }
    }

    if (dispensaId) {
      buscaDados()
      buscaDispensa()
      setDispensaId(Number(dispensaId))
    }
  }, [dispensaId, buscaDados, setDispensaId])

  useEffect(() => {
    const handlePantryUpdate = () => {
      buscaDados()
    }

    window.addEventListener("pantryUpdated", handlePantryUpdate)
    return () => window.removeEventListener("pantryUpdated", handlePantryUpdate)
  }, [buscaDados])

  function handleCloseDetails() {
    setAlimentoSelecionado(null)
  }

  async function handleDeleteItem(id: number) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/alimentos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + Cookies.get("token"),
        },
      })

      if (!response.ok) {
        throw new Error("Erro ao deletar item")
      }

      setAlimentos((prev) => prev.filter((item) => item.id !== id))
      handleCloseDetails()
      toast.success("Item deletado com sucesso!", {
        style: {
          background: "#00c950",
          color: "#ffffff",
        },
      })
    } catch (error) {
      console.error("Erro ao deletar alimento:", error)
      toast.error("Erro ao deletar item. Tente novamente.")
    }
  }

  async function handleDeletePage(id: number) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_URL_API}/dispensa/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token") || "",
        },
      })
      setDispensa(null)
      setShowConfigForm(false)
      toast.success("Dispensa deletada com sucesso!", {
        style: {
          background: "#00c950",
          color: "#ffffff",
        },
      })
      router.push("/perfil")
    } catch (error) {
      console.error("Erro ao deletar dispensa:", error)
      toast.error("Erro ao deletar dispensa. Tente novamente.")
    }
  }

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a28fd0", "#ffb6b9", "#c6e2ff"]

  function formatDate(value?: string | null) {
    if (!value) return "Nao informada"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Nao informada"

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  function getExpirationInfo(value?: string | null) {
    if (!value) {
      return {
        label: "Sem validade",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expirationDate = new Date(value)
    expirationDate.setHours(0, 0, 0, 0)

    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiration < 0) {
      return {
        label: `Vencido ha ${Math.abs(daysUntilExpiration)} dia(s)`,
        className: "bg-red-50 text-red-700 border-red-200",
      }
    }

    if (daysUntilExpiration <= 7) {
      return {
        label: `Vence em ${daysUntilExpiration} dia(s)`,
        className: "bg-amber-50 text-amber-700 border-amber-200",
      }
    }

    return {
      label: "Validade ok",
      className: "bg-green-50 text-green-700 border-green-200",
    }
  }

  const alimentosFiltrados = alimentos.filter((alimento) =>
    alimento.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(alimentosFiltrados.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAlimentos = alimentosFiltrados.slice(startIndex, endIndex)

  const usageTotalPages = Math.ceil(alimentos.length / itemsPerPage)
  const usageStartIndex = (usageCurrentPage - 1) * itemsPerPage
  const usageEndIndex = usageStartIndex + itemsPerPage
  const paginatedUsageAlimentos = alimentos.slice(usageStartIndex, usageEndIndex)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] py-4 sm:py-8 px-2 sm:px-4">
      <main className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-[#1d293d] text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
            Controle da dispensa {dispensa?.nome}
          </h1>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#90a1b9] w-4 h-4" />
              <Input
                placeholder="Buscar item..."
                className="pl-10 bg-white border-[#e2e8f0] text-[#444444] h-11 sm:h-10 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setDispensaId(Number(dispensaId))
                  setPantryAssistantOpen(true)
                }}
                className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none h-11 sm:h-10 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Adicione um item</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
              <Button
                onClick={() => setShowCameraRecognition(true)}
                className="bg-[#432dd7] hover:bg-[#3621b0] text-white flex-1 sm:flex-none h-11 sm:h-10 text-sm sm:text-base gap-2"
                title="Fotografar embalagem para extrair informações"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Foto</span>
                <span className="sm:hidden">📸</span>
              </Button>
              <Button
                onClick={() => setShowFiscalScanner(true)}
                className="bg-[#0f766e] hover:bg-[#115e59] text-white flex-1 sm:flex-none h-11 sm:h-10 text-sm sm:text-base gap-2"
                title="Ler QR code de nota fiscal"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Nota fiscal</span>
                <span className="sm:hidden">QR</span>
              </Button>
              <Link href={`/precos?dispensaId=${dispensaId}`} className="flex-1 sm:flex-none">
                <Button className="bg-[#f59e0b] hover:bg-[#d97706] text-white w-full h-11 sm:h-10">
                  <BadgeDollarSign className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Preços</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-[#e2e8f0] text-[#444444] bg-transparent h-11 sm:h-10"
                onClick={() => setShowConfigForm(true)}
              >
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Config</span>
              </Button>
              <Button
                className="bg-[#00c950] hover:bg-[#00a63e] text-white h-11 sm:h-10"
                onClick={() => setShowGrafico(true)}
              >
                <BarChart3 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Gráfico</span>
              </Button>
              <Link href={`/relatorios/${dispensaId}`} className="flex-1 sm:flex-none">
                <Button className="bg-[#00c950] hover:bg-[#00a63e] text-white w-full h-11 sm:h-10">
                  <History className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Histórico</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8">
          {/* Employees Card */}
          <Card className="bg-white border-[#e2e8f0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#1d293d] text-base sm:text-lg">Funcionários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {funcionario.length > 0 ? (
                funcionario.map((employee, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-[#c6d2ff] text-[#432dd7] text-xs">
                        {employee.nome
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[#444444] text-sm">{employee.nome}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#90a1b9] text-center py-4">Nenhum funcionário cadastrado.</p>
              )}
              <UserModal
                dispensaId={Number(dispensaId)}
                onUserAdded={(user) => {
                  setFuncionario((prev) => {
                    if (prev.some((f) => f.id === user.id)) return prev
                    return [...prev, user]
                  })
                }}
              />
            </CardContent>
          </Card>

          {/* Stock Card */}
          <Card className="lg:col-span-2 bg-white border-[#e2e8f0]">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
              <CardTitle className="text-[#1d293d] text-base sm:text-lg">Seu estoque</CardTitle>
              <Button
                className="bg-[#00c950] hover:bg-[#00a63e] text-white w-full sm:w-auto text-sm h-10"
                onClick={() => setMostrarUso((prev) => !prev)}
              >
                {mostrarUso ? "Fechar" : "Registrar uso"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-full inline-block align-middle">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#e2e8f0]">
                        <th className="text-left py-3 px-2 sm:px-0 text-[#62748e] text-xs sm:text-sm font-medium">
                          ID
                        </th>
                        <th className="text-left py-3 px-2 sm:px-0 text-[#62748e] text-xs sm:text-sm font-medium">
                          Nome
                        </th>
                        <th className="text-right py-3 px-2 sm:px-0 text-[#62748e] text-xs sm:text-sm font-medium">
                          Qtd
                        </th>
                        <th className="text-center py-3 px-2 sm:px-0 text-[#62748e] text-xs sm:text-sm font-medium">
                          Chat
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAlimentos.length > 0 ? (
                        paginatedAlimentos.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer"
                            onClick={() => setAlimentoSelecionado(item)}
                          >
                            <td className="py-3 px-2 sm:px-0 text-[#444444] text-xs sm:text-sm">{item.id}</td>
                            <td className="py-3 px-2 sm:px-0 text-[#444444] text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                              {item.nome}
                            </td>
                            <td className="py-3 px-2 sm:px-0 text-right text-[#444444] text-xs sm:text-sm font-medium whitespace-nowrap">
                              {item.peso} {item.unidadeTipo}
                            </td>
                            <td className="py-3 px-2 sm:px-0 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (selectedItems.some((i) => i.id === item.id)) {
                                    removeSelectedItem(item.id)
                                    toast.success("Item removido do chat", {
                                      style: { background: "#00c950", color: "#ffffff" },
                                    })
                                  } else {
                                    addSelectedItem({
                                      id: item.id,
                                      nome: item.nome,
                                      peso: item.peso,
                                      unidadeTipo: item.unidadeTipo,
                                    })
                                    toast.success("Item adicionado ao chat", {
                                      style: { background: "#00c950", color: "#ffffff" },
                                    })
                                  }
                                }}
                                className={`px-2 sm:px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                  selectedItems.some((i) => i.id === item.id)
                                    ? "bg-green-600 text-white"
                                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                }`}
                              >
                                {selectedItems.some((i) => i.id === item.id) ? "✓" : "+"}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-[#90a1b9] text-sm">
                            {searchTerm ? "Nenhum item encontrado." : "Nenhum item no estoque."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#e2e8f0]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-9"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-[#444444]">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-9"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {mostrarUso && (
          <Card className="bg-white border-[#e2e8f0]">
            <CardHeader>
              <CardTitle className="text-[#1d293d] text-base sm:text-lg">Registrar uso de alimentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)

                  const entradas = alimentos
                    .map((alimento) => {
                      const valor = formData.get(`alimento-${alimento.id}`)
                      const numero = Number(valor)
                      return valor && !isNaN(numero) && numero > 0 ? { id: alimento.id, quantidade: numero } : null
                    })
                    .filter(Boolean)

                  if (entradas.length === 0) return alert("Nenhuma quantidade válida informada.")

                  try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/alimentos/relatorio`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + Cookies.get("token"),
                      },
                      body: JSON.stringify({
                        alimentos: entradas,
                        dispensaId: Number(dispensaId),
                      }),
                    })

                    if (response.ok) {
                      toast.success("Uso registrado com sucesso!", {
                        style: { background: "#00c950", color: "#ffffff" },
                      })
                      location.reload()
                    } else {
                      const erro = await response.json()
                      console.error(erro)
                      toast.error("Erro ao registrar uso: " + (erro?.error || "Erro desconhecido"))
                    }
                  } catch (error) {
                    console.error(error)
                    toast.error("Erro inesperado.")
                  }
                }}
              >
                {paginatedUsageAlimentos.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 bg-[#f8fafc] rounded-lg"
                  >
                    <div className="w-full sm:w-32 text-[#444444] text-sm font-medium">{item.nome}</div>
                    <div className="flex-1 w-full">
                      <Input
                        type="number"
                        step="0.01"
                        name={`alimento-${item.id}`}
                        placeholder={`Qtd em ${item.unidadeTipo.toLowerCase()}`}
                        className="bg-white border-[#e2e8f0] text-[#444444] h-11 text-base"
                        inputMode="decimal"
                      />
                    </div>
                    <div className="text-[#90a1b9] text-xs sm:text-sm w-full sm:w-32 text-left sm:text-right">
                      Disponível: {item.peso}
                    </div>
                  </div>
                ))}

                {usageTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-[#e2e8f0]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUsageCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={usageCurrentPage === 1}
                      className="h-9"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-[#444444]">
                      Página {usageCurrentPage} de {usageTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUsageCurrentPage((prev) => Math.min(usageTotalPages, prev + 1))}
                      disabled={usageCurrentPage === usageTotalPages}
                      className="h-9"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <div className="pt-4">
                  <Button type="submit" className="bg-[#00c950] hover:bg-[#00a63e] text-white w-full sm:w-auto h-11">
                    Enviar Registro
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {alimentoSelecionado && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            onClick={handleCloseDetails}
          >
            <div
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleCloseDetails}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Fechar detalhes do alimento"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-5 pr-14 sm:px-6">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  <Package className="h-3.5 w-3.5" />
                  Item da dispensa
                </div>
                <h2 className="truncate text-xl font-bold text-[#1d293d] sm:text-2xl">{alimentoSelecionado.nome}</h2>
                <p className="mt-1 text-sm text-slate-500">Codigo #{alimentoSelecionado.id}</p>
              </div>

              <div className="space-y-5 px-5 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Scale className="h-4 w-4 text-green-600" />
                      Quantidade
                    </div>
                    <p className="text-lg font-semibold text-[#1d293d]">
                      {alimentoSelecionado.peso} {alimentoSelecionado.unidadeTipo}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Tag className="h-4 w-4 text-green-600" />
                      Unidade
                    </div>
                    <p className="text-lg font-semibold text-[#1d293d]">{alimentoSelecionado.unidadeTipo}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Package className="h-4 w-4 text-green-600" />
                      Perecivel
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${
                        alimentoSelecionado.perecivel === "SIM"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-slate-100 text-slate-700"
                      }`}
                    >
                      {alimentoSelecionado.perecivel || "Nao informado"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <CalendarDays className="h-4 w-4 text-green-600" />
                      Validade
                    </div>
                    <p className="text-sm font-semibold text-[#1d293d]">{formatDate(alimentoSelecionado.validade)}</p>
                    <span
                      className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        getExpirationInfo(alimentoSelecionado.validade).className
                      }`}
                    >
                      {getExpirationInfo(alimentoSelecionado.validade).label}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
                  Use as acoes abaixo para editar os dados do alimento ou remove-lo da dispensa.
                </div>
              </div>
              <h2 className="hidden">{alimentoSelecionado.nome}</h2>
              <p className="hidden">
                <strong>ID:</strong> {alimentoSelecionado.id}
              </p>
              <p className="hidden">
                <strong>Peso:</strong> {alimentoSelecionado.peso} {alimentoSelecionado.unidadeTipo}
              </p>
              <p className="hidden">
                <strong>Tipo de Unidade:</strong> {alimentoSelecionado.unidadeTipo}
              </p>
              {alimentoSelecionado.perecivel && (
                <p className="hidden">
                  <strong>Perecível:</strong> {alimentoSelecionado.perecivel}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                <EditItemModal id={Number(alimentoSelecionado?.id)} dispensaId={Number(dispensaId)} />
                <button
                  type="button"
                  onClick={() => {
                    if (alimentoSelecionado) handleDeleteItem(alimentoSelecionado.id)
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfigForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            onClick={() => setShowConfigForm(false)}
          >
            <div
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowConfigForm(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-[0px] text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Fechar configuracoes da dispensa"
              >
                <X className="h-5 w-5" />
                ✕
              </button>

              <h2 className="hidden">Configuracoes da Dispensa</h2>

              <div className="border-b border-slate-100 bg-slate-50 px-5 py-5 pr-14 sm:px-6">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  <Settings className="h-3.5 w-3.5" />
                  Configuracoes
                </div>
                <h2 className="truncate text-xl font-bold text-[#1d293d] sm:text-2xl">
                  {dispensa?.nome || "Dispensa"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">Ajustes e dados principais da dispensa.</p>
              </div>

              <div className="space-y-5 px-5 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Package className="h-4 w-4 text-green-600" />
                      Itens cadastrados
                    </div>
                    <p className="text-lg font-semibold text-[#1d293d]">{alimentos.length}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Tag className="h-4 w-4 text-green-600" />
                      Participantes
                    </div>
                    <p className="text-lg font-semibold text-[#1d293d]">{funcionario.length}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <CalendarDays className="h-4 w-4 text-green-600" />
                      Criada em
                    </div>
                    <p className="text-sm font-semibold text-[#1d293d]">{formatDate(dispensa?.createdAt)}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Settings className="h-4 w-4 text-green-600" />
                      Temperatura
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${
                        dispensa?.monitorarTemperatura
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-slate-200 bg-slate-100 text-slate-700"
                      }`}
                    >
                      {dispensa?.monitorarTemperatura ? "Monitorando" : "Desativada"}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                  Excluir a dispensa remove seus itens, historico de uso, convites e dados vinculados.
                </div>
              </div>

              {dispensa ? (
                <p className="hidden">
                  <strong>Nome:</strong> {dispensa.nome}
                </p>
              ) : (
                <p className="hidden">Carregando nome da dispensa...</p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                <Button type="button" variant="outline" onClick={() => setShowConfigForm(false)} className="h-10">
                  Cancelar
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    if (dispensaId) handleDeletePage(Number(dispensaId))
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar Dispensa
                </button>
              </div>
            </div>
          </div>
        )}

        {showGrafico && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl max-w-lg w-full shadow-xl border border-[#e2e8f0]">
              <button
                onClick={() => setShowGrafico(false)}
                className="float-right font-bold text-[#90a1b9] hover:text-[#1d293d]"
              >
                ✕
              </button>

              <h2 className="text-xl font-bold text-[#1d293d] mb-4">Distribuição do Estoque</h2>

              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={alimentos.map((item) => ({ name: item.nome, value: Number(item.peso) }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {alimentos.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>

      <ProductRecognitionFlow
        dispensaId={Number(dispensaId)}
        isOpen={showCameraRecognition}
        onClose={() => setShowCameraRecognition(false)}
        onProductCreated={buscaDados}
      />

      <FiscalQrScannerModal
        dispensaId={Number(dispensaId)}
        isOpen={showFiscalScanner}
        onClose={() => setShowFiscalScanner(false)}
        onImported={buscaDados}
      />

      <PantryAssistantModal />
    </div>
  )
}
