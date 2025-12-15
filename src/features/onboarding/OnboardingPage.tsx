import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionService } from '../../shared/services/sessionService';
import { useSessionStore } from '../../shared/state/sessionStore';
import { useTerminalStore } from '../../shared/state/terminalStore';
import { terminalOptions } from '../../shared/utils/terminal';
import { TerminalCode } from '../../shared/types/terminal';
import { useEffect } from 'react';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);
  const session = useSessionStore((state) => state.session);
  const setTerminalContext = useTerminalStore((state) => state.setContext);
  const [supervisorName, setSupervisorName] = useState('');
  const [terminalCode, setTerminalCode] = useState<TerminalCode>('EL_ROBLE');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      navigate('/personal');
    }
  }, [session, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const session = await sessionService.startSession(supervisorName, terminalCode);
    setSession(session);
    setTerminalContext({ mode: 'TERMINAL', value: terminalCode });
    navigate('/personal');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-50 px-4">
      <div className="card w-full max-w-3xl p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Asiss</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Inicio rápido</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ingresa tu nombre y terminal para comenzar. La sesión se administra por Edge Functions con cookie
          HttpOnly (mock en esta fase).
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <label className="label">Nombre del Supervisor</label>
            <input
              className="input"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="Ej: Ana Pérez"
              required
            />
          </div>
          <div>
            <label className="label">Terminal</label>
            <select
              className="input"
              value={terminalCode}
              onChange={(e) => setTerminalCode(e.target.value as TerminalCode)}
            >
              {terminalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">No se guarda nada en el cliente.</p>
            <button type="submit" className="btn btn-primary" disabled={submitting || !supervisorName}>
              {submitting ? 'Iniciando...' : 'Entrar al dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
