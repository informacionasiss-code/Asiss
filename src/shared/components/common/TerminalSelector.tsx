import { TerminalContext, TerminalGroupCode } from '../../types/terminal';
import { defaultTerminalContext, terminalGroupOptions, terminalOptions } from '../../utils/terminal';

interface Props {
  value: TerminalContext;
  onChange: (context: TerminalContext) => void;
  label?: string;
}

export const TerminalSelector = ({ value, onChange, label = 'Terminal actual' }: Props) => {
  const selectedKey = (() => {
    if (value.mode === 'ALL') return 'ALL';
    if (value.mode === 'GROUP') return `GROUP:${value.value}`;
    return `TERMINAL:${value.value}`;
  })();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    if (selected === 'ALL') {
      onChange(defaultTerminalContext);
      return;
    }
    if (selected.startsWith('GROUP:')) {
      const groupCode = selected.replace('GROUP:', '') as TerminalGroupCode;
      onChange({ mode: 'GROUP', value: groupCode });
      return;
    }
    const terminalCode = selected.replace('TERMINAL:', '') as TerminalContext['value'];
    onChange({ mode: 'TERMINAL', value: terminalCode });
  };

  return (
    <label className="flex flex-col text-xs font-semibold text-slate-600">
      <span className="mb-1">{label}</span>
      <select
        value={selectedKey}
        onChange={handleChange}
        className="input min-w-[200px]"
        aria-label="Selector de terminal"
      >
        <option value="ALL">Todos</option>
        <optgroup label="Terminales">
          {terminalOptions.map((option) => (
            <option key={option.value} value={`TERMINAL:${option.value}`}>
              {option.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Grupos">
          {terminalGroupOptions.map((group) => (
            <option key={group.value} value={`GROUP:${group.value}`}>
              {group.label}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
};
