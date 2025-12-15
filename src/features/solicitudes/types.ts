import { TerminalCode } from '../../shared/types/terminal';

export type SolicitudEstado = 'abierta' | 'en_proceso' | 'cerrada';

export interface SolicitudViewModel {
  id: string;
  solicitante: string;
  tipo: string;
  fecha: string;
  estado: SolicitudEstado;
  terminal: TerminalCode;
}

export interface SolicitudFilters {
  estado?: SolicitudEstado | 'todas';
}
