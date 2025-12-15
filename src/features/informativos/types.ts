import { TerminalCode } from '../../shared/types/terminal';

export interface InformativoViewModel {
  id: string;
  titulo: string;
  fecha: string;
  enviadoPor: string;
  alcance: 'todos' | 'terminal' | 'segmentado';
  terminal: TerminalCode;
}

export interface InformativoFilters {
  alcance?: InformativoViewModel['alcance'] | 'todos';
}
