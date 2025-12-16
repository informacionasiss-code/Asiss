import { TerminalCode, TerminalContext } from '../../shared/types/terminal';

// Common Interface
export interface MiniCheckBase {
  id: string; // Assuming UUID or BigInt as string
  revision_id: string;
  bus_ppu: string;
  terminal: string; // Should be TerminalCode but might be string in DB
  created_at: string;
  updated_at: string;
  observacion?: string | null;
}

// Filters
export interface MiniCheckFilters {
  terminalContext?: TerminalContext;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'updated_at' | 'bus_ppu' | 'terminal';
  sortOrder?: 'asc' | 'desc';
}

// EXTINTOR
export type CertificacionEstado = 'VIGENTE' | 'VENCIDA';
export type PresionEstado = 'NORMAL' | 'BAJA_CARGA' | 'SOBRECARGA'; // Assumption based on 'BAJA_CARGA'

export interface Extintor extends MiniCheckBase {
  tiene: boolean;
  vencimiento_mes?: number;
  vencimiento_anio?: number;
  certificacion?: CertificacionEstado;
  sonda?: boolean;
  manometro?: boolean;
  presion?: PresionEstado | string; // Relaxed type
  cilindro?: boolean;
  porta?: boolean;
}

// TAG
export interface Tag extends MiniCheckBase {
  tiene: boolean;
  serie?: string;
}

// MOBILEYE
export interface Mobileye extends MiniCheckBase {
  bus_marca?: string;
  alerta_izq?: boolean;
  alerta_der?: boolean;
  consola?: boolean;
  sensor_frontal?: boolean;
  sensor_izq?: boolean;
  sensor_der?: boolean;
}

// ODOMETRO
export type OdometroEstado = 'OK' | 'INCONSISTENTE' | 'NO_FUNCIONA';

export interface Odometro extends MiniCheckBase {
  lectura: number;
  estado: OdometroEstado | string;
}

// PUBLICIDAD
export interface Publicidad extends MiniCheckBase {
  tiene: boolean;
  danio?: boolean;
  residuos?: boolean;
  detalle_lados?: Record<string, any>; // JSONB
  nombre_publicidad?: string;
}

// Response Wrapper for Lists
export interface MiniCheckResponse<T> {
  data: T[];
  count: number | null;
}
