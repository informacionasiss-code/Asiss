import { NotificationCenter } from '../common/NotificationCenter';
import { useTerminalStore } from '../../state/terminalStore';
import { useSessionStore } from '../../state/sessionStore';
import { TerminalSelector } from '../common/TerminalSelector';
import { notificationService } from '../../services/notificationService';
import { displayTerminal } from '../../utils/terminal';
import { sessionService } from '../../services/sessionService';

interface Props {
  onMenuToggle: () => void;
}

export const AppHeader = ({ onMenuToggle }: Props) => {
  const terminalContext = useTerminalStore((state) => state.context);
  const setTerminalContext = useTerminalStore((state) => state.setContext);
  const session = useSessionStore((state) => state.session);
  const clearSession = useSessionStore((state) => state.clearSession);

  const handleSimulateNotification = () => {
    notificationService.publishNotification({
      level: 'info',
      title: 'Aviso en vivo',
      message: 'Nueva alerta de operaciones (mock realtime)',
    });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            className="btn btn-secondary md:hidden"
            aria-label="Abrir menú"
            onClick={onMenuToggle}
          >
            ☰
          </button>
          <div>
            <p className="text-xs font-semibold uppercase text-brand-700">Asiss</p>
            <p className="text-sm font-bold text-slate-900">Dashboard logística</p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="hidden lg:block">
            <TerminalSelector value={terminalContext} onChange={setTerminalContext} />
          </div>
          <NotificationCenter />
          <button className="btn btn-secondary hidden sm:inline-flex" onClick={handleSimulateNotification}>
            Simular alerta
          </button>
          {session && (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold text-slate-900">{session.supervisorName}</span>
                  <span className="text-xs text-slate-600">Terminal {displayTerminal(session.terminalCode)}</span>
                </div>
              <button
                className="text-xs font-semibold text-brand-600"
                onClick={() => {
                  clearSession();
                  sessionService.logout();
                }}
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 py-2 lg:hidden">
        <TerminalSelector value={terminalContext} onChange={setTerminalContext} />
      </div>
    </header>
  );
};
