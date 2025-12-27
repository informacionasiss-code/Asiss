// All terminal codes including El Roble sub-terminals
export type TerminalCode =
  | 'EL_ROBLE'
  | 'LA_REINA'
  | 'MARIA_ANGELICA'
  | 'EL_DESCANSO'
  | 'EL_SALTO'
  | 'LO_ECHEVERS'
  | 'COLO_COLO';

// El Roble group includes: EL_ROBLE, LA_REINA, MARIA_ANGELICA, EL_DESCANSO
export type TerminalGroupCode = 'GRUPO_ROBLE';

// El Roble sub-terminals (when any is selected, show all of these)
export const EL_ROBLE_SUBTERMINALS: TerminalCode[] = [
  'EL_ROBLE',
  'LA_REINA',
  'MARIA_ANGELICA',
  'EL_DESCANSO',
];

export interface TerminalGroup {
  code: TerminalGroupCode;
  name: string;
  members: TerminalCode[];
}

export interface TerminalContext {
  mode: 'ALL' | 'TERMINAL' | 'GROUP';
  value?: TerminalCode | TerminalGroupCode;
}

export interface TerminalOption {
  value: TerminalCode;
  label: string;
}

// Terminal display labels
export const TERMINAL_LABELS: Record<TerminalCode, string> = {
  EL_ROBLE: 'El Roble',
  LA_REINA: 'La Reina',
  MARIA_ANGELICA: 'María Angélica',
  EL_DESCANSO: 'El Descanso',
  EL_SALTO: 'El Salto',
  LO_ECHEVERS: 'Lo Echevers',
  COLO_COLO: 'Colo Colo',
};
