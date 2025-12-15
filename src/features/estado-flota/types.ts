import { TerminalCode } from '../../shared/types/terminal';

export type FlotaEstado = 'operativo' | 'en_taller' | 'fuera_servicio';

export interface VehiculoViewModel {
  ppu: string;
  modelo: string;
  estado: FlotaEstado;
  odometro: number;
  proximaMantencion: string;
  terminal: TerminalCode;
}

export interface FlotaFilters {
  estado?: FlotaEstado | 'todos';
}
