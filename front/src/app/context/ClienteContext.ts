import type { ClienteItf } from "../utils/types/ClienteItf"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type ClienteStore = {
  cliente: ClienteItf
  logaCliente: (clienteLogado: ClienteItf) => void
  deslogaCliente: () => void
  isHydrated: boolean
  setIsHydrated: (hydrated: boolean) => void
}

export const useClienteStore = create<ClienteStore>()(
  persist(
    (set) => ({
      cliente: {} as ClienteItf,
      isHydrated: false,
      logaCliente: (clienteLogado) => set({ cliente: clienteLogado }),
      deslogaCliente: () => set({ cliente: {} as ClienteItf }),
      setIsHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "cliente-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setIsHydrated(true)
        }
      },
    },
  ),
)
