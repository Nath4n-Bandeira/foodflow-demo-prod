"use client"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Loader2, X, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onClose: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [captured, setCaptured] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setLoading(false)
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Não foi possível acessar a câmera"
        setError(errorMessage)
        setLoading(false)
        toast.error("Erro ao acessar câmera: " + errorMessage)
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")

      if (context) {
        // Definir dimensões do canvas
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight

        // Desenhar video frame no canvas
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        )

        // Converter para base64
        const imageData = canvasRef.current.toDataURL("image/jpeg", 0.95)
        setPreviewImage(imageData)
        setCaptured(true)
        toast.success("Foto capturada com sucesso!")
      }
    }
  }

  const retakPhoto = () => {
    setCaptured(false)
    setPreviewImage(null)
  }

  const confirmCapture = () => {
    if (previewImage) {
      onCapture(previewImage)
      onClose()
    }
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Erro ao Acessar Câmera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-red-600 text-sm">{error}</p>
            <p className="text-sm text-gray-600">
              Certifique-se de que:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Você permite acesso à câmera no navegador</li>
              <li>Sua câmera funciona corretamente</li>
              <li>Você está usando HTTPS (exceto localhost)</li>
            </ul>
            <Button onClick={onClose} variant="outline" className="w-full">
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Fotografar Embalagem
        </CardTitle>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Preview da Camera */}
          <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}

            {!captured ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
              />
            ) : (
              <img
                src={previewImage || ""}
                alt="Foto capturada"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Canvas oculto para captura */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Instruções */}
          {!captured && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                📸 Posicione a câmera de forma que toda a embalagem fique visível com boa iluminação.
              </p>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-2">
            {!captured ? (
              <Button onClick={capturePhoto} className="flex-1" disabled={loading}>
                <Camera className="w-4 h-4 mr-2" />
                Capturar Foto
              </Button>
            ) : (
              <>
                <Button onClick={retakPhoto} variant="outline" className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refazer
                </Button>
                <Button onClick={confirmCapture} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Confirmar
                </Button>
              </>
            )}
          </div>

          {/* Nota sobre permissões */}
          {loading && (
            <p className="text-xs text-gray-500 text-center">
              Permitindo acesso à câmera...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
