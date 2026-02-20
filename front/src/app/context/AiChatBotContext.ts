import { create } from "zustand"

export interface AIChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type AIChatbotStore = {
  isOpen: boolean
  dispensaId: number | null
  setIsOpen: (open: boolean) => void
  setDispensaId: (id: number | null) => void
}

export const useAIChatbotStore = create<AIChatbotStore>()((set) => ({
  isOpen: false,
  dispensaId: null,
  setIsOpen: (open) => set({ isOpen: open }),
  setDispensaId: (id) => set({ dispensaId: id }),
}))
