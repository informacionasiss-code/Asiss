import { TerminalCode } from './terminal';

export interface SessionInfo {
  supervisorName: string;
  terminalCode: TerminalCode;
  startedAt: string;
}

export interface SessionService {
  startSession: (supervisorName: string, terminalCode: TerminalCode) => Promise<SessionInfo>;
  getSession: () => Promise<SessionInfo | null>;
  logout: () => Promise<void>;
}
