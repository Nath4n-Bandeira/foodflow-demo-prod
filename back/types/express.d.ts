import type { TokenI } from "../interfaces/tokenI"

declare global {
  namespace Express {
    interface Request {
      clienteLogadoId?: string
      clienteLogadoNome?: string
      user?: TokenI
    }
  }
}
