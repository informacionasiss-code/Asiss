import { TerminalCode } from '../../shared/types/terminal';

export interface AseoRegistroViewModel {
  id: string;
  area: 'interior' | 'exterior' | 'rodillo';
  responsable: string;
  fecha: string;
  estado: 'pendiente' | 'completado';
  observaciones?: string;
  terminal: TerminalCode;
}

export interface AseoFilters {
  estado?: AseoRegistroViewModel['estado'] | 'todos';
}
