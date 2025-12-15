import { TerminalCode } from '../../shared/types/terminal';

export type AsistenciaEstado = 'presente' | 'atraso' | 'ausente';

export interface AsistenciaViewModel {
  id: string;
  colaborador: string;
  fecha: string;
  turno: string;
  estado: AsistenciaEstado;
  terminal: TerminalCode;
}

export interface AsistenciaFilters {
  estado?: AsistenciaEstado | 'todos';
}
