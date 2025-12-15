import { create } from 'zustand';
import { sessionService } from '../services/sessionService';
import { SessionInfo } from '../types/session';

interface SessionState {
  session: SessionInfo | null;
  setSession: (session: SessionInfo) => void;
  clearSession: () => void;
  hydrateSession: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
  hydrateSession: async () => {
    const existing = await sessionService.getSession();
    set({ session: existing });
  },
}));
