import { ReactNode } from 'react';
import { TerminalContext } from '../../types/terminal';
import { TerminalSelector } from './TerminalSelector';

interface Props {
  terminalContext: TerminalContext;
  onTerminalChange: (context: TerminalContext) => void;
  children?: ReactNode;
}

export const FiltersBar = ({ terminalContext, onTerminalChange, children }: Props) => (
  <div className="card mb-4 p-4">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <TerminalSelector value={terminalContext} onChange={onTerminalChange} />
      {children && <div className="flex flex-wrap items-end gap-3">{children}</div>}
    </div>
  </div>
);
