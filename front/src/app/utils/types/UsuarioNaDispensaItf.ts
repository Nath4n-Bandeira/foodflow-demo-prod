import { DispensaItf } from "./DispensaItf"

export interface UsuarioNaDispensaItf {
  id: string;
  dispensaID: number;
  dispensa: DispensaItf;
}
