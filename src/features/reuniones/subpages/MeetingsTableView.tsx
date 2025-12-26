import { useState } from 'react';
import { PageHeader } from '../../../shared/components/common/PageHeader';
import { FiltersBar } from '../../../shared/components/common/FiltersBar';
import { LoadingState } from '../../../shared/components/common/LoadingState';
import { ErrorState } from '../../../shared/components/common/ErrorState';
import { ExportMenu } from '../../../shared/components/common/ExportMenu';
import { Icon } from '../../../shared/components/common/Icon';
import { useTerminalStore } from '../../../shared/state/terminalStore';
import { useSessionStore } from '../../../shared/state/sessionStore';
import { exportToXlsx } from '../../../shared/utils/exportToXlsx';
import { displayTerminal } from '../../../shared/utils/terminal';
import { useMeetings, useCreateMeeting, useUpdateMeetingStatus } from '../hooks';
import { isMeetingManager } from '../utils/permissions';
import { MeetingFilters, MEETING_STATUS_OPTIONS, MeetingWithCounts } from '../types';
import { MeetingFormModal } from '../components/MeetingFormModal';
import { CancelMeetingModal } from '../components/CancelMeetingModal';

interface MeetingsTableViewProps {
    onOpenMeeting: (id: string) => void;
}

export const MeetingsTableView = ({ onOpenMeeting }: MeetingsTableViewProps) => {
    const terminalContext = useTerminalStore((s) => s.context);
    const setTerminalContext = useTerminalStore((s) => s.setContext);
    const session = useSessionStore((s) => s.session);
    const supervisorName = session?.supervisorName ?? '';
    const canManage = isMeetingManager(supervisorName);

    const [filters, setFilters] = useState<MeetingFilters>({ status: 'todos' });
    const [showForm, setShowForm] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<MeetingWithCounts | null>(null);
    const [cancelingMeeting, setCancelingMeeting] = useState<MeetingWithCounts | null>(null);

    const query = useMeetings(filters);
    const createMutation = useCreateMeeting();
    const statusMutation = useUpdateMeetingStatus();

    const exportColumns = [
        { key: 'starts_at', header: 'Fecha/Hora', value: (r: MeetingWithCounts) => formatDateTime(r.starts_at) },
        { key: 'title', header: 'Título', value: (r: MeetingWithCounts) => r.title },
        { key: 'terminal', header: 'Terminal', value: (r: MeetingWithCounts) => displayTerminal(r.terminal_code) },
        { key: 'status', header: 'Estado', value: (r: MeetingWithCounts) => r.status },
        { key: 'duration', header: 'Duración (min)', value: (r: MeetingWithCounts) => r.duration_minutes.toString() },
        { key: 'invitees', header: 'Invitados', value: (r: MeetingWithCounts) => r.invitees_count.toString() },
        { key: 'location', header: 'Lugar', value: (r: MeetingWithCounts) => r.location || r.meeting_link || '' },
    ];

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'REALIZADA': return <span className="badge badge-success">{status}</span>;
            case 'CANCELADA': return <span className="badge badge-danger">{status}</span>;
            default: return <span className="badge badge-warning">{status}</span>;
        }
    };

    const handleCancel = async (reason: string) => {
        if (!cancelingMeeting) return;
        await statusMutation.mutateAsync({ id: cancelingMeeting.id, status: 'CANCELADA', reason });
        setCancelingMeeting(null);
    };

    const handleMarkComplete = async (meeting: MeetingWithCounts) => {
        await statusMutation.mutateAsync({ id: meeting.id, status: 'REALIZADA' });
    };

    return (
        <div className="space-y-4">
            <PageHeader
                title="Reuniones"
                description="Gestión de reuniones y seguimiento de acuerdos"
                actions={
                    <div className="flex gap-2">
                        {canManage && (
                            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                                <Icon name="plus" size={18} /> Nueva Reunión
                            </button>
                        )}
                        <ExportMenu
                            onExportView={() => exportToXlsx({ filename: 'reuniones', sheetName: 'Reuniones', rows: query.data || [], columns: exportColumns })}
                            onExportAll={() => exportToXlsx({ filename: 'reuniones_all', sheetName: 'Reuniones', rows: query.data || [], columns: exportColumns })}
                        />
                    </div>
                }
            />

            <FiltersBar terminalContext={terminalContext} onTerminalChange={setTerminalContext}>
                <div className="flex flex-col gap-1">
                    <label className="label">Estado</label>
                    <select
                        className="input"
                        value={filters.status}
                        onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as any }))}
                    >
                        {MEETING_STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
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

            {query.isLoading && <LoadingState label="Cargando reuniones..." />}
            {query.isError && <ErrorState onRetry={() => query.refetch()} />}
            {!query.isLoading && !query.isError && (
                <div className="table-container overflow-x-auto">
                    <table className="table">
                        <thead className="table-header">
                            <tr>
                                <th className="table-header-cell">Fecha/Hora</th>
                                <th className="table-header-cell">Título</th>
                                <th className="table-header-cell">Terminal</th>
                                <th className="table-header-cell">Estado</th>
                                <th className="table-header-cell text-center">Inv.</th>
                                <th className="table-header-cell text-center">Tareas</th>
                                <th className="table-header-cell text-center">Adj.</th>
                                <th className="table-header-cell text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="table-body">
                            {(query.data || []).length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="table-cell text-center text-slate-500 py-8">
                                        No hay reuniones registradas
                                    </td>
                                </tr>
                            ) : (
                                (query.data || []).map((row) => (
                                    <tr key={row.id} className="table-row cursor-pointer hover:bg-slate-50" onClick={() => onOpenMeeting(row.id)}>
                                        <td className="table-cell text-sm">{formatDateTime(row.starts_at)}</td>
                                        <td className="table-cell font-medium">{row.title}</td>
                                        <td className="table-cell text-sm">{displayTerminal(row.terminal_code)}</td>
                                        <td className="table-cell">{getStatusBadge(row.status)}</td>
                                        <td className="table-cell text-center">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-sm font-medium">
                                                {row.invitees_count}
                                            </span>
                                        </td>
                                        <td className="table-cell text-center">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-sm font-medium">
                                                {row.actions_count}
                                            </span>
                                        </td>
                                        <td className="table-cell text-center">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-sm font-medium">
                                                {row.files_count}
                                            </span>
                                        </td>
                                        <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => onOpenMeeting(row.id)} className="btn btn-ghost btn-icon" title="Ver detalle">
                                                    <Icon name="eye" size={16} />
                                                </button>
                                                {canManage && row.status === 'PROGRAMADA' && (
                                                    <>
                                                        <button onClick={() => setEditingMeeting(row)} className="btn btn-ghost btn-icon" title="Editar">
                                                            <Icon name="edit" size={16} />
                                                        </button>
                                                        <button onClick={() => handleMarkComplete(row)} className="btn btn-ghost btn-icon text-success-600" title="Marcar realizada">
                                                            <Icon name="check-circle" size={16} />
                                                        </button>
                                                        <button onClick={() => setCancelingMeeting(row)} className="btn btn-ghost btn-icon text-danger-600" title="Cancelar">
                                                            <Icon name="x-circle" size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <MeetingFormModal
                    onClose={() => setShowForm(false)}
                    onSuccess={() => setShowForm(false)}
                />
            )}

            {editingMeeting && (
                <MeetingFormModal
                    meeting={editingMeeting}
                    onClose={() => setEditingMeeting(null)}
                    onSuccess={() => setEditingMeeting(null)}
                />
            )}

            {cancelingMeeting && (
                <CancelMeetingModal
                    meetingTitle={cancelingMeeting.title}
                    onConfirm={handleCancel}
                    onCancel={() => setCancelingMeeting(null)}
                    isLoading={statusMutation.isPending}
                />
            )}
        </div>
    );
};
