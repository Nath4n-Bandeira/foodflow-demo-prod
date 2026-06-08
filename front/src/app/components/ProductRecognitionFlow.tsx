"use client"
import { useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CameraCapture } from "@/src/app/components/CameraCapture"
import { ProductConfirmationModal } from "@/src/app/components/ProductConfirmationModal"
import { useProductRecognition } from "@/src/app/hooks/useProductRecognition"
import { useClienteStore } from "@/src/app/context/ClienteContext"

interface ProductRecognitionFlowProps {
  dispensaId: number
  isOpen: boolean
  onClose: () => void
  onProductCreated?: () => void
}

export function ProductRecognitionFlow({
  dispensaId,
  isOpen,
  onClose,
  onProductCreated,
}: ProductRecognitionFlowProps) {
  const { cliente } = useClienteStore()
  const { loading, data, analyzeImage, reset } = useProductRecognition(dispensaId)
  const cameraOpenRef = useRef(false)
  const confirmOpenRef = useRef(false)

  const handleCameraCapture = async (imageData: string) => {
    // Fechar câmera
    cameraOpenRef.current = false

    // Analisar imagem
    await analyzeImage(imageData)

    // Abrir modal de confirmação
    setTimeout(() => {
      confirmOpenRef.current = true
    }, 500)
  }

  const handleConfirmClose = () => {
    confirmOpenRef.current = false
    reset()
    onClose()
  }

  const handleProductCreated = () => {
    onProductCreated?.()
    handleConfirmClose()
  }

  return (
    <>
      {/* Modal da Câmera */}
      <Dialog open={isOpen && !confirmOpenRef.current} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Fotografar Embalagem</DialogTitle>
            <DialogDescription>
              Tire uma foto clara da embalagem do produto para extrair as informações.
            </DialogDescription>
          </DialogHeader>
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={onClose}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação */}
      <ProductConfirmationModal
        isOpen={confirmOpenRef.current}
        onClose={handleConfirmClose}
        data={data}
        loading={loading}
        dispensaId={dispensaId}
        usuarioId={cliente.id}
        onProductCreated={handleProductCreated}
      />
    </>
  )
}
