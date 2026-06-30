"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser"
import Cookies from "js-cookie"
import { CheckCircle2, FileText, Loader2, QrCode, ScanLine, Upload, X, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ReceiptItem = {
  codigo?: string
  nomeOriginal: string
  quantidade: number
  unidade: string
  valorUnitario?: number
  valorTotal?: number
  isAlimento: boolean
  motivoClasse: string
}

type ReceiptPreview = {
  chaveAcesso?: string
  mercadoNome: string
  mercadoCnpj?: string
  dataCompra?: string
  valorTotal?: number
  itens: ReceiptItem[]
  resumo: {
    totalItens: number
    alimentos: number
    ignorados: number
  }
}

type FiscalQrScannerModalProps = {
  dispensaId: number
  isOpen: boolean
  onClose: () => void
  onImported: () => void
}

const API_TIMEOUT_MS = 20000

export function FiscalQrScannerModal({ dispensaId, isOpen, onClose, onImported }: FiscalQrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const readerRef = useRef<BrowserQRCodeReader | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [qrContent, setQrContent] = useState("")
  const [receipt, setReceipt] = useState<ReceiptPreview | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState("")
  const [cameraMessage, setCameraMessage] = useState("")
  const hasMediaDevices = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia)

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setReceipt(null)
      setIsAnalyzing(false)
      setIsImporting(false)
      setCameraMessage("")
      return
    }

    refreshVideoDevices(false)

    return () => stopCamera()
  }, [isOpen])

  if (!isOpen) return null

  function stopCamera() {
    controlsRef.current?.stop()
    controlsRef.current = null
    BrowserQRCodeReader.releaseAllStreams()
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  function getReader() {
    if (!readerRef.current) {
      readerRef.current = new BrowserQRCodeReader()
    }

    return readerRef.current
  }

  async function refreshVideoDevices(askPermission = true) {
    if (!hasMediaDevices) {
      setCameraMessage("Este navegador nao liberou acesso a camera. Use HTTPS, localhost ou o app no celular.")
      return []
    }

    setIsLoadingDevices(true)

    try {
      if (askPermission) {
        const permissionStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        })
        permissionStream.getTracks().forEach((track) => track.stop())
      }

      const devices = await BrowserQRCodeReader.listVideoInputDevices()
      setVideoDevices(devices)

      if (!selectedDeviceId && devices.length > 0) {
        setSelectedDeviceId(pickPreferredDeviceId(devices))
      }

      setCameraMessage(devices.length === 0 ? "Nenhuma camera foi encontrada pelo navegador." : "")
      return devices
    } catch (error) {
      console.error("Erro ao listar cameras:", error)
      const message = getCameraErrorMessage(error)
      setCameraMessage(message)
      toast.error(message)
      return []
    } finally {
      setIsLoadingDevices(false)
    }
  }

  async function startCamera() {
    if (!hasMediaDevices || !videoRef.current) {
      const message = "Este navegador nao permite acesso a camera nesta origem."
      setCameraMessage(message)
      toast.error(message)
      return
    }

    stopCamera()
    setCameraMessage("")

    try {
      let devices = videoDevices
      if (devices.length === 0) {
        devices = await refreshVideoDevices(true)
      }

      const deviceId = selectedDeviceId || pickPreferredDeviceId(devices) || undefined
      const controls = await getReader().decodeFromVideoDevice(deviceId, videoRef.current, (result, error, controls) => {
        const rawValue = result?.getText()
        if (!rawValue) return

        setQrContent(rawValue)
        controls.stop()
        controlsRef.current = null
        BrowserQRCodeReader.releaseAllStreams()
        setIsScanning(false)
        toast.success("QR code lido com sucesso.")
      })

      controlsRef.current = controls
      setIsScanning(true)
    } catch (error) {
      console.error("Erro ao abrir camera:", error)
      const message = getCameraErrorMessage(error)
      setCameraMessage(message)
      toast.error(message)
      stopCamera()
    }
  }

  async function handleQrImage(file?: File) {
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    try {
      const result = await getReader().decodeFromImageUrl(objectUrl)
      const rawValue = result.getText()

      setQrContent(rawValue)
      toast.success("QR code extraido da imagem.")
    } catch (error) {
      console.error("Erro ao ler imagem:", error)
      toast.error("Nenhum QR code foi encontrado nessa imagem.")
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  async function analyzeReceipt() {
    const source = buildSourceBody()
    if (!source) {
      toast.error("Informe uma URL de QR code ou o texto da nota.")
      return
    }

    setIsAnalyzing(true)
    setReceipt(null)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/notasFiscais/analisar`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify(source),
      })
      const data = await readJsonResponse(response)

      if (!response.ok) {
        throw new Error(data?.error ?? "Erro ao analisar nota fiscal.")
      }

      setReceipt(data)
      if (data.resumo?.alimentos === 0) {
        toast.warning("A nota foi lida, mas nenhum alimento foi identificado.")
      } else {
        toast.success(`${data.resumo.alimentos} alimento(s) identificado(s).`)
      }
    } catch (error) {
      console.error("Erro ao analisar nota:", error)
      toast.error(getApiErrorMessage(error, "Erro ao analisar nota fiscal."))
    } finally {
      clearTimeout(timeout)
      setIsAnalyzing(false)
    }
  }

  async function importReceipt() {
    const source = buildSourceBody()
    if (!source) return

    setIsImporting(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/notasFiscais/importar`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + Cookies.get("token"),
        },
        body: JSON.stringify({ ...source, dispensaId }),
      })
      const data = await readJsonResponse(response)

      if (!response.ok) {
        throw new Error(data?.error ?? "Erro ao importar nota fiscal.")
      }

      if (data.duplicada) {
        toast.warning("Esta nota ja tinha sido importada para esta dispensa.")
      } else {
        toast.success(`${data.adicionados} alimento(s) enviados para a dispensa.`)
      }

      onImported()
      onClose()
    } catch (error) {
      console.error("Erro ao importar nota:", error)
      toast.error(getApiErrorMessage(error, "Erro ao importar nota fiscal."))
    } finally {
      clearTimeout(timeout)
      setIsImporting(false)
    }
  }

  function buildSourceBody() {
    const value = qrContent.trim()
    if (!value) return null

    if (/^https?:\/\//i.test(value)) {
      return { qrCodeUrl: value }
    }

    return { receiptText: value }
  }

  const alimentos = receipt?.itens.filter((item) => item.isAlimento) ?? []
  const ignorados = receipt?.itens.filter((item) => !item.isAlimento) ?? []
  const selectedDeviceLabel = videoDevices.find((device) => device.deviceId === selectedDeviceId)?.label

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-3 sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-[#dbe4ef] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-green-100 text-green-700">
              <QrCode className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-[#1d293d]">Leitor de nota fiscal</h2>
              <p className="truncate text-sm text-[#62748e]">QR code NFC-e para entrada automatica na dispensa</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="rounded-md p-2 text-[#62748e] hover:bg-[#f1f5f9] hover:text-[#1d293d]"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 overflow-y-auto lg:grid-cols-[360px_1fr]">
          <section className="border-b border-[#e2e8f0] p-4 lg:border-b-0 lg:border-r sm:p-6">
            <div className="aspect-video overflow-hidden rounded-md border border-[#dbe4ef] bg-[#0f172a]">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              {!isScanning && (
                <div className="flex h-full -translate-y-full items-center justify-center text-sm text-slate-300">
                  Camera inativa
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={isScanning ? stopCamera : startCamera}
                disabled={!hasMediaDevices || isLoadingDevices}
                className="h-10 bg-[#432dd7] text-white hover:bg-[#3621b0]"
              >
                {isLoadingDevices ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                {isScanning ? "Parar" : "Camera"}
              </Button>
              <label className="flex h-10 cursor-pointer items-center justify-center rounded-md border border-[#dbe4ef] bg-white text-sm font-medium text-[#334155] hover:bg-[#f8fafc]">
                <Upload className="mr-2 h-4 w-4" />
                Imagem
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleQrImage(event.target.files?.[0])}
                />
              </label>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <select
                  value={selectedDeviceId}
                  onChange={(event) => {
                    setSelectedDeviceId(event.target.value)
                    if (isScanning) {
                      stopCamera()
                    }
                  }}
                  className="h-10 min-w-0 flex-1 rounded-md border border-[#dbe4ef] bg-white px-3 text-sm text-[#334155] outline-none focus:border-green-500"
                  disabled={videoDevices.length === 0 || isScanning}
                >
                  {videoDevices.length === 0 ? (
                    <option value="">Camera padrao</option>
                  ) : (
                    videoDevices.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${index + 1}`}
                      </option>
                    ))
                  )}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refreshVideoDevices(true)}
                  disabled={isLoadingDevices || isScanning}
                  className="h-10 px-3"
                >
                  Atualizar
                </Button>
              </div>
              {selectedDeviceLabel && (
                <p className="truncate text-xs text-[#62748e]">Dispositivo selecionado: {selectedDeviceLabel}</p>
              )}
            </div>

            {cameraMessage && (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {cameraMessage}
              </p>
            )}

            <label className="mt-4 block text-sm font-medium text-[#334155]" htmlFor="qr-content">
              URL do QR code ou texto da nota
            </label>
            <textarea
              id="qr-content"
              value={qrContent}
              onChange={(event) => setQrContent(event.target.value)}
              className="mt-2 min-h-28 w-full resize-y rounded-md border border-[#dbe4ef] bg-white p-3 text-sm text-[#1d293d] outline-none focus:border-green-500"
              placeholder="https://.../QrCodeNFce?p=..."
            />

            <Button
              type="button"
              onClick={analyzeReceipt}
              disabled={isAnalyzing || !qrContent.trim()}
              className="mt-3 h-10 w-full bg-green-600 text-white hover:bg-green-700"
            >
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Analisar nota
            </Button>
          </section>

          <section className="p-4 sm:p-6">
            {receipt ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Summary label="Mercado" value={receipt.mercadoNome} />
                  <Summary label="Itens" value={String(receipt.resumo.totalItens)} />
                  <Summary label="Alimentos" value={String(receipt.resumo.alimentos)} />
                  <Summary label="Ignorados" value={String(receipt.resumo.ignorados)} />
                </div>

                <ItemTable
                  title="Alimentos que serao enviados"
                  icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                  items={alimentos}
                  emptyText="Nenhum alimento identificado."
                />

                <ItemTable
                  title="Itens ignorados"
                  icon={<XCircle className="h-4 w-4 text-slate-500" />}
                  items={ignorados}
                  emptyText="Nenhum item ignorado."
                  muted
                />
              </div>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center rounded-md border border-dashed border-[#cbd5e1] text-center">
                <div className="max-w-sm px-6">
                  <QrCode className="mx-auto h-10 w-10 text-[#90a1b9]" />
                  <p className="mt-3 text-sm text-[#62748e]">
                    Leia um QR code, envie uma imagem ou cole a URL da NFC-e para visualizar os itens antes de importar.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#e2e8f0] px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" onClick={onClose} className="h-10">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={importReceipt}
            disabled={!receipt || alimentos.length === 0 || isImporting}
            className="h-10 bg-green-600 text-white hover:bg-green-700"
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar alimentos para dispensa
          </Button>
        </div>
      </div>
    </div>
  )
}

function pickPreferredDeviceId(devices: MediaDeviceInfo[]) {
  const preferred = devices.find((device) => /back|rear|traseira|environment|ambiente/i.test(device.label))
  return preferred?.deviceId ?? devices[0]?.deviceId ?? ""
}

function getCameraErrorMessage(error: unknown) {
  if (!(error instanceof DOMException)) {
    return "Nao foi possivel acessar a camera."
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "Permissao de camera negada. Libere a camera no navegador e tente novamente."
  }

  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return "Nenhuma camera ou webcam foi encontrada pelo navegador."
  }

  if (error.name === "NotReadableError" || error.name === "TrackStartError") {
    return "A camera esta em uso por outro aplicativo ou nao pode ser iniciada agora."
  }

  if (error.name === "OverconstrainedError") {
    return "A camera selecionada nao atende aos requisitos. Atualize a lista ou escolha outra camera."
  }

  return "Nao foi possivel acessar a camera."
}

async function readJsonResponse(response: Response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "A leitura demorou demais e foi cancelada. A SEFAZ pode estar lenta ou bloqueando a consulta."
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
      <p className="text-xs font-medium uppercase text-[#62748e]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#1d293d]">{value}</p>
    </div>
  )
}

function ItemTable({
  title,
  icon,
  items,
  emptyText,
  muted,
}: {
  title: string
  icon: ReactNode
  items: ReceiptItem[]
  emptyText: string
  muted?: boolean
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-[#1d293d]">{title}</h3>
      </div>
      <div className="max-h-64 overflow-auto rounded-md border border-[#e2e8f0]">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="sticky top-0 bg-[#f8fafc] text-xs uppercase text-[#62748e]">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Item</th>
              <th className="px-3 py-2 text-right font-semibold">Qtd</th>
              <th className="px-3 py-2 text-right font-semibold">Unit.</th>
              <th className="px-3 py-2 text-left font-semibold">Classificacao</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, index) => (
                <tr key={`${item.codigo ?? item.nomeOriginal}-${index}`} className="border-t border-[#f1f5f9]">
                  <td className={`px-3 py-2 ${muted ? "text-[#64748b]" : "text-[#1d293d]"}`}>{item.nomeOriginal}</td>
                  <td className="px-3 py-2 text-right text-[#334155]">
                    {item.quantidade} {item.unidade}
                  </td>
                  <td className="px-3 py-2 text-right text-[#334155]">
                    {typeof item.valorUnitario === "number" ? formatCurrency(item.valorUnitario) : "-"}
                  </td>
                  <td className="px-3 py-2 text-[#64748b]">{item.motivoClasse}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[#90a1b9]">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}
