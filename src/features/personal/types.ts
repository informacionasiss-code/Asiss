import { TerminalCode } from '../../shared/types/terminal';

// ==========================================
// ENUMS & CONSTANTS
// ==========================================

export type StaffStatus = 'ACTIVO' | 'DESVINCULADO';

export type StaffCargo =
  | 'conductor'
  | 'inspector_patio'
  | 'cleaner'
  | 'planillero'
  | 'supervisor';

export const STAFF_CARGOS: { value: StaffCargo; label: string }[] = [
  { value: 'conductor', label: 'Conductor' },
  { value: 'inspector_patio', label: 'Inspector Patio' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'planillero', label: 'Planillero' },
  { value: 'supervisor', label: 'Supervisor' },
];

export const STAFF_STATUS_OPTIONS: { value: StaffStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'DESVINCULADO', label: 'Desvinculado' },
];

// ==========================================
// DATABASE MODELS
// ==========================================

export interface Staff {
  id: string;
  rut: string;
  nombre: string;
  cargo: StaffCargo;
  terminal_code: TerminalCode;
  turno: string;
  horario: string;
  contacto: string;
  email: string | null;
  talla_polera: string | null;
  talla_chaqueta: string | null;
  talla_pantalon: string | null;
  talla_zapato_seguridad: string | null;
  talla_chaleco_reflectante: string | null;
  status: StaffStatus;
  suspended: boolean;
  terminated_at: string | null;
  termination_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffAdmonition {
  id: string;
  staff_id: string;
  reason: string;
  admonition_date: string;
  document_path: string;
  created_at: string;
}

export interface StaffCap {
  id: string;
  scope_type: 'TERMINAL_GROUP' | 'TERMINAL' | 'COMPANY';
  scope_code: string;
  cargo: StaffCargo;
  max_q: number;
}

// ==========================================
// FORM VALUES
// ==========================================

export interface StaffFormValues {
  rut: string;
  nombre: string;
  cargo: StaffCargo;
  terminal_code: TerminalCode;
  turno: string;
  horario: string;
  contacto: string;
  email?: string;
  talla_polera?: string;
  talla_chaqueta?: string;
  talla_pantalon?: string;
  talla_zapato_seguridad?: string;
  talla_chaleco_reflectante?: string;
}

export interface AdmonitionFormValues {
  reason: string;
  admonition_date: string;
  document: File | null;
}

export interface OffboardFormValues {
  comment: string;
}

// ==========================================
// VIEW MODELS
// ==========================================

export interface StaffViewModel extends Staff {
  admonition_count: number;
}

// ==========================================
// IDENTITY (for other sections)
// ==========================================

export interface StaffIdentity {
  id: string;
  rut: string;
  nombre: string;
  cargo: StaffCargo;
  terminal_code: TerminalCode;
  status: StaffStatus;
}

// ==========================================
// FILTERS
// ==========================================

export interface StaffFilters {
  status?: StaffStatus | 'todos';
  cargo?: StaffCargo | 'todos';
  search?: string;
}

// ==========================================
// COUNTS & CAPS
// ==========================================

export interface StaffCountByCargo {
  cargo: StaffCargo;
  count: number;
  max_q: number | null;
  with_licenses: number;
  suspended: number;
  effective_count: number;
}

export interface StaffCountByTerminal {
  terminal_code: TerminalCode;
  count: number;
}

export interface StaffCountsResult {
  byCargo: StaffCountByCargo[];
  byTerminal: StaffCountByTerminal[];
  total: number;
  erLrTotal?: number;
}
