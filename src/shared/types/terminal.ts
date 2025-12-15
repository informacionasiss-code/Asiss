export type TerminalCode = 'EL_ROBLE' | 'LA_REINA' | 'EL_SALTO' | 'LO_ECHEVERS' | 'COLO_COLO';

export type TerminalGroupCode = 'ROBLE_Y_REINA';

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
