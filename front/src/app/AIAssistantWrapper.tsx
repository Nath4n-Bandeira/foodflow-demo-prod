"use client"

import {AIPantryAssistant} from "./components/modals/AiPantryAssistant"
import { useAIChatbotStore } from "./context/AiChatBotContext"

export function AIAssistantWrapper() {
  const { isOpen, setIsOpen, dispensaId } = useAIChatbotStore()

  return (
    <AIPantryAssistant
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("pantryUpdated"))
        }
      }}
      dispensaId={dispensaId}
    />
  )
}
