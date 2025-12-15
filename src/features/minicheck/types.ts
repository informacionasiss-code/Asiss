import { TerminalCode } from '../../shared/types/terminal';

export type MiniCheckTipo = 'extintor' | 'tag' | 'mobileye' | 'odometro' | 'publicidad';
export type MiniCheckEstado = 'ok' | 'alerta';

export interface MiniCheckViewModel {
  id: string;
  tipo: MiniCheckTipo;
  ppu: string;
  responsable: string;
  estado: MiniCheckEstado;
  fecha: string;
  observaciones?: string;
  terminal: TerminalCode;
}

export interface MiniCheckFilters {
  estado?: MiniCheckEstado | 'todas';
}
