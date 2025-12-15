import { TerminalCode } from '../../shared/types/terminal';

export type TareaEstado = 'pendiente' | 'en_progreso' | 'completada';
export type TareaPrioridad = 'alta' | 'media' | 'baja';

export interface TareaViewModel {
  id: string;
  titulo: string;
  responsable: string;
  prioridad: TareaPrioridad;
  estado: TareaEstado;
  vencimiento: string;
  terminal: TerminalCode;
}

export interface TareaFilters {
  estado?: TareaEstado | 'todas';
  prioridad?: TareaPrioridad | 'todas';
}
