import type { AlimentosItf } from "./AlimentosItf"

export interface DispensaItf {
  id: string
  nome: string
  usuarioID: string
  createdAt: string 
  alimentos: AlimentosItf[]
  monitorarTemperatura?: boolean
}
