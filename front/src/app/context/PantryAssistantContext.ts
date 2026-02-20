import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface PantryMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface PantryItem {
  nome: string
  peso: number
  unidadeTipo: string
  perecivel: string
  validade: string | null
}

type PantryAssistantStore = {
  messages: PantryMessage[]
  isLoading: boolean
  isOpen: boolean
  dispensaId: number | null
  addMessage: (message: PantryMessage) => void
  clearMessages: () => void
  setIsLoading: (loading: boolean) => void
  setIsOpen: (open: boolean) => void
  setDispensaId: (id: number | null) => void
}

export const usePantryAssistantStore = create<PantryAssistantStore>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      isOpen: false,
      dispensaId: null,
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      clearMessages: () => set({ messages: [] }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsOpen: (open) => set({ isOpen: open }),
      setDispensaId: (id) => set({ dispensaId: id }),
    }),
    {
      name: "pantry-assistant-store",
    },
  ),
)
