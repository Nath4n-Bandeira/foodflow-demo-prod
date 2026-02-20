"use client"

import { Search, History, Calendar, TrendingUp, ArrowLeft, Thermometer, Download, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { toast } from "sonner"
import type { ClienteItf } from "@/src/app/utils/types/ClienteItf"
import type { DispensaItf } from "@/src/app/utils/types/DispensaItf"
import type { AlimentosItf } from "@/src/app/utils/types/AlimentosItf"

export default function RelatoriosPage() {
  const params = useParams()
  const router = useRouter()
  const dispensaId = params?.id
  const [dispensa, setDispensa] = useState<DispensaItf | null>(null)
  const [funcionario, setFuncionario] = useState<ClienteItf[]>([])
  const [alimentos, setAlimentos] = useState<AlimentosItf[]>([])
  const [historico, setHistorico] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [exporting, setExporting] = useState(false)

  // Temperature monitoring state
  const [temperature, setTemperature] = useState<number | null>(null)
  const [temperatureHistory, setTemperatureHistory] = useState<Array<{ time: string; temp: number }>>([])
  const [tempLoading, setTempLoading] = useState(true)

  // Food search state
  const [foodSearch, setFoodSearch] = useState("")

  // Pagination state for history
  const [historicoCurrentPage, setHistoricoCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (!Cookies.get("token")) {
      router.replace("/")
      return
    }

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

    async function buscaAlimentos() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/alimentos/dispensa/${dispensaId}/alimentos`)
        const dados = await response.json()
        setAlimentos(dados)
      } catch (error) {
        console.error("Falha ao buscar alimentos:", error)
      }
    }

    async function buscaHistorico() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/alimentos/relatorio/${dispensaId}`, {
          headers: {
            Authorization: "Bearer " + Cookies.get("token"),
          },
        })
        const dados = await response.json()
        setHistorico(dados)
      } catch (error) {
        console.error("Erro ao buscar histórico:", error)
      } finally {
        setLoading(false)
      }
    }

    if (dispensaId) {
      buscaDispensa()
      buscaAlimentos()
      buscaHistorico()
    }
  }, [dispensaId, router])

  useEffect(() => {
    if (!dispensa?.monitorarTemperatura) {
      setTempLoading(false)
      return
    }

    const fetchTemperature = async () => {
      try {
        const response = await fetch("https://api.thingspeak.com/channels/3129316/feeds.json?results=10")
        const data = await response.json()

        if (data.feeds && data.feeds.length > 0) {
          const latestFeed = data.feeds[data.feeds.length - 1]
          const tempValue = Number.parseFloat(latestFeed.field1)

          setTemperature(tempValue)

          const history = data.feeds
            .filter((feed: any) => feed.field1 !== null)
            .map((feed: any) => ({
              time: new Date(feed.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              temp: Number.parseFloat(feed.field1),
            }))

          setTemperatureHistory(history)
        }
      } catch (error) {
        console.error("Erro ao buscar temperatura:", error)
      } finally {
        setTempLoading(false)
      }
    }

    fetchTemperature()
    const interval = setInterval(fetchTemperature, 15000)
    return () => clearInterval(interval)
  }, [dispensa?.monitorarTemperatura])

  const getTemperatureStatus = (temp: number | null) => {
    if (temp === null) return { color: "#90a1b9", status: "Aguardando dados...", bg: "#f1f5f9" }
    if (temp < 0) return { color: "#0ea5e9", status: "Muito Frio", bg: "#e0f2fe" }
    if (temp >= 0 && temp < 10) return { color: "#06b6d4", status: "Frio", bg: "#cffafe" }
    if (temp >= 10 && temp < 20) return { color: "#00c950", status: "Ideal", bg: "#dcfce7" }
    if (temp >= 20 && temp < 25) return { color: "#f59e0b", status: "Atenção", bg: "#fef3c7" }
    return { color: "#ef4444", status: "Crítico", bg: "#fee2e2" }
  }

  const tempStatus = getTemperatureStatus(temperature)

  const chartData = alimentos.slice(0, 4).map((alimento) => {
    const consumido = historico
      .filter((h) => h.alimento === alimento.nome)
      .reduce((sum, h) => sum + Number(h.quantidade || 0), 0)

    return {
      name: alimento.nome,
      consumo: consumido,
      disponivel: Number(alimento.peso),
    }
  })

  const historicoFiltrado = Array.isArray(historico)
    ? historico.filter(
        (item) =>
          item.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.alimento?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : []

  const filteredChartData = chartData.filter((item) => item.name.toLowerCase().includes(foodSearch.toLowerCase()))

  const historicoTotalPages = Math.ceil(historicoFiltrado.length / itemsPerPage)
  const historicoStartIndex = (historicoCurrentPage - 1) * itemsPerPage
  const historicoEndIndex = historicoStartIndex + itemsPerPage
  const paginatedHistorico = historicoFiltrado.slice(historicoStartIndex, historicoEndIndex)

  const handleExportToExcel = async () => {
    try {
      setExporting(true)
      const XLSX = await import("xlsx")

      const exportData = historicoFiltrado.map((record) => ({
        ID: record.id || "",
        Usuário: record.usuario || "Desconhecido",
        Item: record.alimento || "",
        Quantidade: `${record.quantidade} ${record.unidade}`,
        Data: new Date(record.data).toLocaleDateString("pt-BR"),
        Hora: new Date(record.data).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico")

      worksheet["!cols"] = [{ wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 10 }]

      const fileName = `relatorio_${dispensa?.nome || "dispensa"}_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`
      XLSX.writeFile(workbook, fileName)
      toast.success("Relatório exportado com sucesso!", {
        style: {
          background: "#00c950",
          color: "#ffffff",
        },
      })
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
      toast.error("Erro ao exportar relatório. Tente novamente.", {
        style: {
          background: "#ef4444",
          color: "#ffffff",
        },
      })
    } finally {
      setExporting(false)
    }
  }

  const expiringItems = alimentos
    .filter((item) => {
      if (!item.validade) return false
      const validadeDate = new Date(item.validade)
      const today = new Date()
      const daysUntilExpiry = Math.ceil((validadeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7
    })
    .sort((a, b) => {
      const dateA = new Date(a.validade!).getTime()
      const dateB = new Date(b.validade!).getTime()
      return dateA - dateB
    })

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <main className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Link href={`/dispensa/${dispensaId}`}>
              <Button variant="outline" size="sm" className="border-[#e2e8f0] text-[#444444] bg-transparent h-10">
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </Link>
          </div>
          <h1 className="text-[#1d293d] text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
            Relatórios - {dispensa?.nome}
          </h1>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#90a1b9] w-4 h-4" />
              <Input
                placeholder="Buscar no histórico..."
                className="pl-10 bg-white border-[#e2e8f0] text-[#444444] h-11 sm:h-10 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {expiringItems.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 mb-4 sm:mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-900 text-base sm:text-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
                <span className="text-sm sm:text-base">Alimentos Próximos da Validade</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {expiringItems.map((item) => {
                  const validadeDate = new Date(item.validade!)
                  const today = new Date()
                  const daysUntilExpiry = Math.ceil((validadeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-amber-200"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${daysUntilExpiry <= 2 ? "bg-red-500 animate-pulse" : "bg-amber-500"}`}
                        ></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[#444444] font-medium text-sm sm:text-base truncate">{item.nome}</p>
                          <p className="text-xs text-[#90a1b9]">
                            {item.peso} {item.unidadeTipo}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p
                          className={`text-xs sm:text-sm font-semibold ${daysUntilExpiry <= 2 ? "text-red-600" : "text-amber-600"}`}
                        >
                          {daysUntilExpiry === 0 ? "Hoje!" : daysUntilExpiry === 1 ? "Amanhã" : `${daysUntilExpiry}d`}
                        </p>
                        <p className="text-xs text-[#90a1b9] hidden sm:block">
                          {validadeDate.toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8">
          {/* Employees */}
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
                    <span className="text-[#444444] text-sm truncate">{employee.nome}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#90a1b9] text-center py-4">Nenhum funcionário cadastrado.</p>
              )}
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="lg:col-span-2 bg-white border-[#e2e8f0]">
            <CardHeader className="flex flex-col gap-3 pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle className="text-[#1d293d] text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#00c950]" />
                  <span className="text-sm sm:text-base">Consumo por Item</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#e2e8f0] text-[#444444] bg-transparent text-xs h-8"
                >
                  <Calendar className="w-3 h-3 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Últimos 7 dias</span>
                  <span className="sm:hidden">7 dias</span>
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#90a1b9] w-4 h-4" />
                <Input
                  placeholder="Pesquisar alimentos..."
                  className="pl-10 bg-white border-[#e2e8f0] text-[#444444] h-10 text-sm sm:text-base"
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] sm:h-[300px] w-full">
                {filteredChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredChartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#444444", fontSize: 10 }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fill: "#444444", fontSize: 10 }} axisLine={{ stroke: "#e2e8f0" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="consumo" fill="#00c950" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="disponivel" fill="#f1f5f9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[#90a1b9] text-sm">
                      {foodSearch ? "Nenhum alimento encontrado" : "Nenhum dado disponível"}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#00c950] rounded"></div>
                  <span className="text-[#444444] text-xs sm:text-sm">Consumido</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#f1f5f9] rounded"></div>
                  <span className="text-[#444444] text-xs sm:text-sm">Disponível</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage History */}
        <Card className="bg-white border-[#e2e8f0] mb-4 sm:mb-8">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
            <CardTitle className="text-[#1d293d] text-base sm:text-lg flex items-center gap-2">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-[#432dd7]" />
              <span className="text-sm sm:text-base">Histórico de Utilização</span>
            </CardTitle>
            <Button
              className="bg-[#00c950] hover:bg-[#00a63e] text-white w-full sm:w-auto text-sm h-10"
              onClick={handleExportToExcel}
              disabled={exporting || historicoFiltrado.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? "Exportando..." : "Exportar"}
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00c950]"></div>
              </div>
            ) : historicoFiltrado.length === 0 ? (
              <p className="text-center py-8 text-[#90a1b9] text-sm">
                {searchTerm ? "Nenhum registro encontrado." : "Nenhum histórico de uso disponível."}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-full inline-block align-middle">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#e2e8f0]">
                          <th className="text-left py-3 px-2 sm:px-0 text-[#62748e] text-xs sm:text-sm font-medium">
                            ID
                          </th>
                          <th className="text-left py-3 px-2 sm:px-0 text-[#62748e] text-xs sm:text-sm font-medium">
                            Usuário
                          </th>
                          <th className="text-left py-3 px-2 sm:px-0 text-[#62748e] text-xs sm:text-sm font-medium">
                            Item
                          </th>
                          <th className="text-left py-3 px-2 sm:px-0 text-[#62748e] text-xs sm:text-sm font-medium">
                            Qtd
                          </th>
                          <th className="text-left py-3 px-2 sm:px-0 text-[#62748e] text-xs sm:text-sm font-medium">
                            Data
                          </th>
                          <th className="text-left py-3 px-2 sm:px-0 text-[#62748e] text-xs sm:text-sm font-medium hidden sm:table-cell">
                            Hora
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedHistorico.map((record, index) => (
                          <tr key={index} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                            <td className="py-3 px-2 sm:px-0 text-[#444444] text-xs sm:text-sm">
                              {record.id || index + 1}
                            </td>
                            <td className="py-3 px-2 sm:px-0 text-[#444444] text-xs sm:text-sm">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5 sm:w-6 sm:h-6">
                                  <AvatarFallback className="bg-[#c6d2ff] text-[#432dd7] text-xs">
                                    {record.usuario
                                      ?.split(" ")
                                      .map((n: string) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase() || "??"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate max-w-[80px] sm:max-w-none">
                                  {record.usuario || "Desconhecido"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-2 sm:px-0 text-[#444444] text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">
                              {record.alimento}
                            </td>
                            <td className="py-3 px-2 sm:px-0 text-[#444444] text-xs sm:text-sm font-medium whitespace-nowrap">
                              {record.quantidade} {record.unidade}
                            </td>
                            <td className="py-3 px-2 sm:px-0 text-[#444444] text-xs sm:text-sm whitespace-nowrap">
                              {new Date(record.data).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                              <span className="sm:hidden ml-1 text-[#90a1b9]">
                                {new Date(record.data).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </td>
                            <td className="py-3 px-2 sm:px-0 text-[#444444] text-xs sm:text-sm hidden sm:table-cell">
                              {new Date(record.data).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {historicoTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#e2e8f0]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoricoCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={historicoCurrentPage === 1}
                      className="h-9"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs sm:text-sm text-[#444444]">
                      Página {historicoCurrentPage} de {historicoTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoricoCurrentPage((prev) => Math.min(historicoTotalPages, prev + 1))}
                      disabled={historicoCurrentPage === historicoTotalPages}
                      className="h-9"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {dispensa?.monitorarTemperatura && (
          <Card className="bg-white border-[#e2e8f0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#1d293d] text-base sm:text-lg flex items-center gap-2">
                <Thermometer className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: tempStatus.color }} />
                <span className="text-sm sm:text-base">Monitoramento de Temperatura</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tempLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00c950]"></div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div
                      className="flex items-center justify-center w-full sm:w-32 h-32 rounded-full border-8 flex-shrink-0"
                      style={{ borderColor: tempStatus.color, backgroundColor: tempStatus.bg }}
                    >
                      <div className="text-center">
                        <div className="text-3xl sm:text-4xl font-bold" style={{ color: tempStatus.color }}>
                          {temperature !== null ? `${temperature.toFixed(1)}°` : "--"}
                        </div>
                        <div className="text-xs sm:text-sm text-[#444444] mt-1">{tempStatus.status}</div>
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="h-[200px] sm:h-[250px] w-full">
                        {temperatureHistory.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={temperatureHistory} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis
                                dataKey="time"
                                tick={{ fill: "#444444", fontSize: 9 }}
                                axisLine={{ stroke: "#e2e8f0" }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis
                                tick={{ fill: "#444444", fontSize: 10 }}
                                axisLine={{ stroke: "#e2e8f0" }}
                                domain={[0, 40]}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "white",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "8px",
                                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                  fontSize: "11px",
                                }}
                              />
                              <Bar dataKey="temp" fill={tempStatus.color} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-[#90a1b9] text-sm">Carregando histórico...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
                    <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                      <div className="text-blue-600 font-semibold">&lt; 0°C</div>
                      <div className="text-[#444444]">Muito Frio</div>
                    </div>
                    <div className="p-2 sm:p-3 bg-cyan-50 rounded-lg">
                      <div className="text-cyan-600 font-semibold">0-10°C</div>
                      <div className="text-[#444444]">Frio</div>
                    </div>
                    <div className="p-2 sm:p-3 bg-green-50 rounded-lg">
                      <div className="text-green-600 font-semibold">10-20°C</div>
                      <div className="text-[#444444]">Ideal</div>
                    </div>
                    <div className="p-2 sm:p-3 bg-amber-50 rounded-lg">
                      <div className="text-amber-600 font-semibold">20-25°C</div>
                      <div className="text-[#444444]">Atenção</div>
                    </div>
                    <div className="p-2 sm:p-3 bg-red-50 rounded-lg col-span-2 sm:col-span-1">
                      <div className="text-red-600 font-semibold">&gt; 25°C</div>
                      <div className="text-[#444444]">Crítico</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
