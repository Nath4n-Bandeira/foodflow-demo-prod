import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface SelectedItem {
  id: number
  nome: string
  peso: number
  unidadeTipo: string
}

type ChatbotStore = {
  messages: ChatMessage[]
  selectedItems: SelectedItem[]
  isLoading: boolean
  isOpen: boolean
  addMessage: (message: ChatMessage) => void
  addSelectedItem: (item: SelectedItem) => void
  removeSelectedItem: (itemId: number) => void
  clearSelectedItems: () => void
  clearMessages: () => void
  setIsLoading: (loading: boolean) => void
  setIsOpen: (open: boolean) => void
}

export const useChatbotStore = create<ChatbotStore>()(
  persist(
    (set) => ({
      messages: [],
      selectedItems: [],
      isLoading: false,
      isOpen: false,
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      addSelectedItem: (item) =>
        set((state) => ({
          selectedItems: [...state.selectedItems.filter((i) => i.id !== item.id), item],
        })),
      removeSelectedItem: (itemId) =>
        set((state) => ({
          selectedItems: state.selectedItems.filter((i) => i.id !== itemId),
        })),
      clearSelectedItems: () => set({ selectedItems: [] }),
      clearMessages: () => set({ messages: [] }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: "chatbot-store",
    },
  ),
)
