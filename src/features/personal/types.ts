import { TerminalCode } from '../../shared/types/terminal';

export type PersonalStatus = 'activo' | 'licencia' | 'vacaciones' | 'baja';

export interface PersonalViewModel {
  id: string;
  nombre: string;
  rol: string;
  turno: string;
  status: PersonalStatus;
  terminal: TerminalCode;
  actualizadoEl: string;
}

export interface PersonalFilters {
  status?: PersonalStatus | 'todos';
  search?: string;
}
