import { create } from 'zustand';
import { TerminalContext } from '../types/terminal';
import { defaultTerminalContext } from '../utils/terminal';

interface TerminalState {
  context: TerminalContext;
  setContext: (context: TerminalContext) => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  context: defaultTerminalContext,
  setContext: (context) => set({ context }),
}));
