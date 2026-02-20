import { DispensaItf } from "./DispensaItf"

export interface AlimentosItf {
    perecivel: any
    id: number
    nome: string
    peso: number
    unidadeTipo: string
    dispensaId: number
    validade: string | null
    dispensa: DispensaItf
}
