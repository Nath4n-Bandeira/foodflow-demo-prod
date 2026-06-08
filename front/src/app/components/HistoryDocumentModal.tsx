"use client"

import type { ChangeEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import type { AlimentosItf } from "@/src/app/utils/types/AlimentosItf"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileImage, FileText, ImagePlus, Loader2, WandSparkles } from "lucide-react"
import { toast } from "sonner"

interface HistoryRecord {
  id?: number | string
  usuario?: string
  alimento?: string
  quantidade?: number | string
  unidade?: string
  data: string
}

interface HistoryDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  dispensaNome?: string
  historico: HistoryRecord[]
  alimentos: AlimentosItf[]
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return {
    date: date.toLocaleDateString("pt-BR"),
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  }
}

function buildSummary(historico: HistoryRecord[], alimentos: AlimentosItf[]) {
  const totalEvents = historico.length
  const uniqueUsers = new Set(historico.map((record) => record.usuario).filter(Boolean)).size
  const totalProducts = alimentos.length
  const withExpiry = alimentos.filter((item) => item.validade).length

  return [
    { label: "Movimentações", value: totalEvents },
    { label: "Usuários", value: uniqueUsers },
    { label: "Produtos", value: totalProducts },
    { label: "Com validade", value: withExpiry },
  ]
}

export function HistoryDocumentModal({ isOpen, onClose, dispensaNome, historico, alimentos }: HistoryDocumentModalProps) {
  const [documentTitle, setDocumentTitle] = useState("Controle dos itens")
  const [documentSubtitle, setDocumentSubtitle] = useState("Serviço de Alimentação Escolar")
  const [organizationName, setOrganizationName] = useState("Secretaria de Educação e Desporto")
  const [periodLabel, setPeriodLabel] = useState("Movimento mensal de gêneros hortifruti, graneiros e carnes")
  const [footerLeft, setFooterLeft] = useState("Diretor responsável")
  const [footerRight, setFooterRight] = useState("Merendeira responsável")
  const [notes, setNotes] = useState("")
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setDocumentTitle(dispensaNome ? `Controle dos itens - ${dispensaNome}` : "Controle dos itens")
  }, [dispensaNome, isOpen])

  const summary = useMemo(() => buildSummary(historico, alimentos), [historico, alimentos])

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setLogoDataUrl(typeof reader.result === "string" ? reader.result : null)
    }
    reader.onerror = () => {
      toast.error("Não foi possível ler a imagem selecionada")
    }
    reader.readAsDataURL(file)
  }

  const handleGenerateDocument = async () => {
    if (historico.length === 0) {
      toast.error("Não há histórico suficiente para gerar o documento")
      return
    }

    try {
      setGenerating(true)
      const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
      const autoTable = autoTableModule.default ?? (autoTableModule as { autoTable?: (doc: unknown, options: unknown) => void }).autoTable

      const doc = new jsPDF("p", "mm", "a4")
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 12
      let currentY = margin

      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(0.4)
      doc.rect(margin, margin, pageWidth - margin * 2, 30)

      if (logoDataUrl) {
        const imageFormat = logoDataUrl.startsWith("data:image/jpeg") ? "JPEG" : "PNG"
        doc.addImage(logoDataUrl, imageFormat, margin + 2, margin + 2, 26, 26)
      }

      doc.setFont("helvetica", "bold")
      doc.setFontSize(18)
      doc.text(documentTitle, pageWidth / 2, currentY + 10, { align: "center" })

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text(organizationName, pageWidth / 2, currentY + 18, { align: "center" })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(documentSubtitle, pageWidth / 2, currentY + 24, { align: "center" })

      currentY += 38

      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.text(periodLabel, margin, currentY)
      currentY += 4

      autoTable(doc, {
        startY: currentY,
        head: [["ID", "Usuário", "Item", "Qtd", "Data", "Hora"]],
        body: historico.map((record, index) => {
          const dateTime = formatDateTime(record.data)
          return [
            String(record.id || index + 1),
            record.usuario || "Desconhecido",
            record.alimento || "",
            `${record.quantidade ?? ""} ${record.unidade ?? ""}`.trim(),
            dateTime.date,
            dateTime.time,
          ]
        }),
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 2,
          lineColor: [201, 213, 225],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [100, 116, 139],
          textColor: 255,
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 14 },
          3: { halign: "center", cellWidth: 22 },
          4: { halign: "center", cellWidth: 24 },
          5: { halign: "center", cellWidth: 18 },
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          const footerY = pageHeight - 18
          doc.setDrawColor(226, 232, 240)
          doc.setLineWidth(0.2)
          doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6)
          doc.setFontSize(9)
          doc.setTextColor(71, 85, 105)
          doc.text(footerLeft, margin, footerY)
          doc.text(footerRight, pageWidth - margin, footerY, { align: "right" })
          doc.text(`Página ${data.pageNumber}`, pageWidth / 2, footerY, { align: "center" })
        },
      })

      const finalY = (doc as any).lastAutoTable?.finalY || currentY + 40
      if (notes.trim()) {
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.text("Observações", margin, finalY + 10)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        const splitNotes = doc.splitTextToSize(notes, pageWidth - margin * 2)
        doc.text(splitNotes, margin, finalY + 16)
      }

      const fileName = `${documentTitle.toLowerCase().replace(/[^a-z0-9]+/gi, "_") || "documento"}_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`
      doc.save(fileName)
      toast.success("Documento gerado com sucesso!")
      onClose()
    } catch (error) {
      console.error("Erro ao gerar documento:", error)
      toast.error("Erro ao gerar documento. Tente novamente.")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] sm:w-[92vw] sm:max-w-[92vw] p-0 overflow-hidden border-[#e2e8f0] bg-white">
        <div className="max-h-[88vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#475569] border border-[#cbd5e1]">
                  <FileText className="h-3.5 w-3.5" />
                  Gerador de documento
                </div>
                <DialogTitle className="text-[#1d293d] text-2xl sm:text-3xl">
                  Criar documento do histórico
                </DialogTitle>
                <DialogDescription className="text-[#62748e] max-w-3xl">
                  Configure o título, a identidade visual e a imagem opcional para gerar um PDF com o histórico no estilo do documento de referência.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6 bg-[#f8fafc]">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {summary.map((item) => (
                <Card key={item.label} className="bg-white border-[#e2e8f0]">
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-wide text-[#90a1b9] mb-1">{item.label}</p>
                    <p className="text-xl font-bold text-[#1d293d]">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(360px,1fr)] gap-6 items-start">
              <Card className="bg-white border-[#e2e8f0]">
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1d293d] mb-2">Título do documento</label>
                      <Input value={documentTitle} onChange={(e) => setDocumentTitle(e.target.value)} className="bg-white border-[#e2e8f0]" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1d293d] mb-2">Subtítulo</label>
                      <Input value={documentSubtitle} onChange={(e) => setDocumentSubtitle(e.target.value)} className="bg-white border-[#e2e8f0]" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1d293d] mb-2">Organização</label>
                      <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className="bg-white border-[#e2e8f0]" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1d293d] mb-2">Linha de cabeçalho</label>
                      <Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} className="bg-white border-[#e2e8f0]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1d293d] mb-2">Observações</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={5}
                      placeholder="Notas adicionais, condições do estoque, observações de uso..."
                      className="bg-white border-[#e2e8f0] resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4">
                    <ImagePlus className="h-5 w-5 text-[#475569] flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1d293d]">Adicionar imagem opcional</p>
                      <p className="text-xs text-[#62748e]">Use para inserir o logo da escola, organização ou qualquer marca visual.</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#64748b] px-3 py-2 text-sm font-medium text-white hover:bg-[#475569] transition-colors">
                      <FileImage className="h-4 w-4" />
                      Enviar
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-[#e2e8f0]">
                <CardContent className="p-5 space-y-4">
                  <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                    <p className="text-xs uppercase tracking-wide text-[#90a1b9] mb-3">Prévia da imagem</p>
                    {logoDataUrl ? (
                      <img src={logoDataUrl} alt="Prévia da imagem enviada" className="w-full h-52 rounded-lg border border-[#e2e8f0] object-contain bg-white" />
                    ) : (
                      <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-[#dbe4f0] bg-white text-sm text-[#90a1b9]">
                        Nenhuma imagem adicionada
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-[#90a1b9]">Resumo do documento</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#62748e]">Histórico usado</span>
                      <Badge variant="secondary">{historico.length} registros</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#62748e]">Itens cadastrados</span>
                      <Badge variant="secondary">{alimentos.length} itens</Badge>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
                    <p className="text-sm font-medium text-[#1d293d] mb-2">Como vai sair</p>
                    <p className="text-sm text-[#62748e]">
                      O PDF terá cabeçalho com imagem opcional, título editável, tabela central com as movimentações e uma área de observações no final.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[#e2e8f0] bg-white">
          <Button variant="outline" onClick={onClose} className="border-[#e2e8f0] text-[#444444] bg-transparent">
            Cancelar
          </Button>
          <Button onClick={handleGenerateDocument} disabled={generating || historico.length === 0} className="bg-[#64748b] hover:bg-[#475569] text-white gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <WandSparkles className="w-4 h-4" />}
            Gerar documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}