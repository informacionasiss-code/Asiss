import { TerminalCode } from '../../shared/types/terminal';

export type CredencialEstado = 'vigente' | 'por_vencer' | 'revocada';

export interface CredencialViewModel {
  id: string;
  sistema: string;
  responsable: string;
  venceEl: string;
  estado: CredencialEstado;
  terminal: TerminalCode;
}

export interface CredencialFilters {
  estado?: CredencialEstado | 'todas';
}
