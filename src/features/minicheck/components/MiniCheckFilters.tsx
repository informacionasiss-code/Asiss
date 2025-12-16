import { FiltersBar } from '../../../shared/components/common/FiltersBar';
import { TerminalContext } from '../../../shared/types/terminal';

interface Props {
    terminalContext: TerminalContext;
    onTerminalChange: (context: TerminalContext) => void;
    search: string;
    onSearchChange: (val: string) => void;
    dateFrom: string;
    onDateFromChange: (val: string) => void;
    dateTo: string;
    onDateToChange: (val: string) => void;
    children?: React.ReactNode;
}

export const MiniCheckFilters = ({
    terminalContext,
    onTerminalChange,
    search,
    onSearchChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    children,
}: Props) => {
    return (
        <FiltersBar terminalContext={terminalContext} onTerminalChange={onTerminalChange}>
            {/* Search PPU */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Buscar PPU</label>
                <input
                    type="text"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 w-32 lg:w-40"
                    placeholder="PPU..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Date From */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Desde</label>
                <input
                    type="date"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-brand-500 w-full"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange(e.target.value)}
                />
            </div>

            {/* Date To */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Hasta</label>
                <input
                    type="date"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-brand-500 w-full"
                    value={dateTo}
                    onChange={(e) => onDateToChange(e.target.value)}
                />
            </div>

            {children}
        </FiltersBar>
    );
};
