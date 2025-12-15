import { TerminalCode } from '../../shared/types/terminal';

export type ReunionEstado = 'agendada' | 'en_curso' | 'cerrada';

export interface ReunionViewModel {
  id: string;
  tema: string;
  fecha: string;
  responsable: string;
  participantes: number;
  estado: ReunionEstado;
  terminal: TerminalCode;
}

export interface ReunionFilters {
  estado?: ReunionEstado | 'todas';
}
