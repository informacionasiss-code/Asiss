import { useState } from 'react';
import { PageHeader } from '../../../shared/components/common/PageHeader';
import { FiltersBar } from '../../../shared/components/common/FiltersBar';
import { LoadingState } from '../../../shared/components/common/LoadingState';
import { Icon } from '../../../shared/components/common/Icon';
import { ExportMenu } from '../../../shared/components/common/ExportMenu';
import { useTerminalStore } from '../../../shared/state/terminalStore';
import { exportToXlsx } from '../../../shared/utils/exportToXlsx';
import { displayTerminal } from '../../../shared/utils/terminal';
import { useMeetings } from '../hooks';
import { MeetingFilters, MeetingWithCounts } from '../types';

interface MinutesViewProps {
    onOpenMeeting: (id: string) => void;
}

export const MinutesView = ({ onOpenMeeting }: MinutesViewProps) => {
    const terminalContext = useTerminalStore((s) => s.context);
    const setTerminalContext = useTerminalStore((s) => s.setContext);
    const [filters, setFilters] = useState<MeetingFilters>({ status: 'REALIZADA' });

    const query = useMeetings(filters);

    const meetingsWithMinutes = (query.data || []).filter(m => m.minutes_text);

    const exportColumns = [
        { key: 'date', header: 'Fecha', value: (r: MeetingWithCounts) => new Date(r.starts_at).toLocaleDateString('es-CL') },
        { key: 'title', header: 'Título', value: (r: MeetingWithCounts) => r.title },
        { key: 'terminal', header: 'Terminal', value: (r: MeetingWithCounts) => displayTerminal(r.terminal_code) },
        { key: 'minutes', header: 'Minuta', value: (r: MeetingWithCounts) => r.minutes_text || '' },
    ];

    return (
        <div className="space-y-4">
            <PageHeader
                title="Minutas y Reportes"
                description="Registro de minutas de reuniones realizadas"
                actions={
                    <ExportMenu
                        onExportView={() => exportToXlsx({ filename: 'minutas', sheetName: 'Minutas', rows: meetingsWithMinutes, columns: exportColumns })}
                        onExportAll={() => exportToXlsx({ filename: 'minutas_all', sheetName: 'Minutas', rows: meetingsWithMinutes, columns: exportColumns })}
                    />
                }
            />

            <FiltersBar terminalContext={terminalContext} onTerminalChange={setTerminalContext}>
                <div className="flex flex-col gap-1">
                    <label className="label">Buscar</label>
                    <input
                        className="input"
                        placeholder="Título de reunión"
                        value={filters.search ?? ''}
                        onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    />
                </div>
            </FiltersBar>

            {query.isLoading && <LoadingState label="Cargando minutas..." />}

            {!query.isLoading && meetingsWithMinutes.length === 0 && (
                <div className="card p-8 text-center text-slate-500">
                    <Icon name="file-text" size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No hay minutas registradas</p>
                </div>
            )}

            <div className="grid gap-4">
                {meetingsWithMinutes.map(meeting => (
                    <div key={meeting.id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onOpenMeeting(meeting.id)}>
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="font-semibold text-slate-800">{meeting.title}</h3>
                                <div className="text-sm text-slate-500">
                                    {new Date(meeting.starts_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    {' - '}{displayTerminal(meeting.terminal_code)}
                                </div>
                            </div>
                            <span className="badge badge-success">{meeting.status}</span>
                        </div>
                        <div className="text-sm text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-lg">
                            {meeting.minutes_text}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
