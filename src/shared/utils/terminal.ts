import { TerminalCode, TerminalContext, TerminalGroup, TerminalGroupCode, EL_ROBLE_SUBTERMINALS } from '../types/terminal';

export const TERMINALS: Record<TerminalCode, string> = {
  EL_ROBLE: 'El Roble',
  LA_REINA: 'La Reina',
  MARIA_ANGELICA: 'María Angélica',
  EL_DESCANSO: 'El Descanso',
  EL_SALTO: 'El Salto',
  LO_ECHEVERS: 'Lo Echevers',
  COLO_COLO: 'Colo Colo',
};

export const TERMINAL_GROUPS: TerminalGroup[] = [
  {
    code: 'GRUPO_ROBLE',
    name: 'Grupo El Roble',
    members: EL_ROBLE_SUBTERMINALS,
  },
];

export const terminalOptions = Object.entries(TERMINALS).map(([value, label]) => ({
  value: value as TerminalCode,
  label,
}));

export const terminalGroupOptions = TERMINAL_GROUPS.map((group) => ({
  value: group.code,
  label: group.name,
}));

export const defaultTerminalContext: TerminalContext = { mode: 'ALL' };

export const resolveTerminalsForContext = (context: TerminalContext): TerminalCode[] => {
  if (context.mode === 'ALL' || !context.value) {
    return Object.keys(TERMINALS) as TerminalCode[];
  }

  if (context.mode === 'TERMINAL') {
    const selected = context.value as TerminalCode;
    // Special case: El Roble sub-terminals always show the whole group
    if (EL_ROBLE_SUBTERMINALS.includes(selected)) {
      return EL_ROBLE_SUBTERMINALS;
    }
    return [selected];
  }

  const group = TERMINAL_GROUPS.find((g) => g.code === context.value);
  return group ? group.members : (Object.keys(TERMINALS) as TerminalCode[]);
};

export const filterByTerminalContext = <T extends { terminal: TerminalCode }>(rows: T[], context: TerminalContext): T[] => {
  const allowed = resolveTerminalsForContext(context);
  return rows.filter((row) => allowed.includes(row.terminal));
};

export const displayTerminal = (terminal: TerminalCode | TerminalGroupCode): string => {
  if (TERMINALS[terminal as TerminalCode]) {
    return TERMINALS[terminal as TerminalCode];
  }
  const group = TERMINAL_GROUPS.find((g) => g.code === terminal);
  return group?.name ?? String(terminal);
};
