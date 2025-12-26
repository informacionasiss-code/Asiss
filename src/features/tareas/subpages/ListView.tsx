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
import { useTasks, useCreateTask, useUpdateTaskStatus } from '../hooks';
import { isTaskManager } from '../utils/permissions';
import { TaskFilters, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS, Task, getStatusColor, getPriorityColor } from '../types';
import { TaskFormModal } from '../components/TaskFormModal';

interface ListViewProps {
    onOpenTask: (id: string) => void;
}

export const ListView = ({ onOpenTask }: ListViewProps) => {
    const terminalContext = useTerminalStore((s) => s.context);
    const setTerminalContext = useTerminalStore((s) => s.setContext);
    const session = useSessionStore((s) => s.session);
    const supervisorName = session?.supervisorName ?? '';
    const canManage = isTaskManager(supervisorName);

    const [filters, setFilters] = useState<TaskFilters>({ status: 'todos', priority: 'todos' });
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const query = useTasks(filters);

    const exportColumns = [
        { key: 'due_at', header: 'Vencimiento', value: (r: Task) => r.due_at ? new Date(r.due_at).toLocaleDateString('es-CL') : '' },
        { key: 'title', header: 'Título', value: (r: Task) => r.title },
        { key: 'terminal', header: 'Terminal', value: (r: Task) => displayTerminal(r.terminal_code) },
        { key: 'priority', header: 'Prioridad', value: (r: Task) => r.priority },
        { key: 'assigned', header: 'Asignado', value: (r: Task) => r.assigned_to_name },
        { key: 'status', header: 'Estado', value: (r: Task) => r.status },
        { key: 'created', header: 'Creado', value: (r: Task) => new Date(r.created_at).toLocaleDateString('es-CL') },
    ];

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const now = new Date();
        const isOverdue = d < now;
        return (
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            <PageHeader
                title="Lista de Tareas"
                description="Vista de tabla con filtros avanzados"
                actions={
                    <div className="flex gap-2">
                        {canManage && (
                            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                                <Icon name="plus" size={18} /> Nueva Tarea
                            </button>
                        )}
                        <ExportMenu
                            onExportView={() => exportToXlsx({ filename: 'tareas', sheetName: 'Tareas', rows: query.data || [], columns: exportColumns })}
                            onExportAll={() => exportToXlsx({ filename: 'tareas_all', sheetName: 'Tareas', rows: query.data || [], columns: exportColumns })}
                        />
                    </div>
                }
            />

            <FiltersBar terminalContext={terminalContext} onTerminalChange={setTerminalContext}>
                <div className="flex flex-col gap-1">
                    <label className="label">Estado</label>
                    <select className="input" value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value as any }))}>
                        {TASK_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="label">Prioridad</label>
                    <select className="input" value={filters.priority} onChange={(e) => setFilters(p => ({ ...p, priority: e.target.value as any }))}>
                        <option value="todos">Todas</option>
                        {TASK_PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="label">Buscar</label>
                    <input className="input" placeholder="Título o descripción" value={filters.search ?? ''} onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))} />
                </div>
                <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={filters.only_mine || false} onChange={(e) => setFilters(p => ({ ...p, only_mine: e.target.checked }))} className="w-4 h-4 rounded" />
                        <span className="text-sm">Solo mis tareas</span>
                    </label>
                </div>
            </FiltersBar>

            {query.isLoading && <LoadingState label="Cargando tareas..." />}
            {query.isError && <ErrorState onRetry={() => query.refetch()} />}
            {!query.isLoading && !query.isError && (
                <div className="table-container overflow-x-auto">
                    <table className="table">
                        <thead className="table-header">
                            <tr>
                                <th className="table-header-cell">Vence</th>
                                <th className="table-header-cell">Título</th>
                                <th className="table-header-cell">Terminal</th>
                                <th className="table-header-cell">Prioridad</th>
                                <th className="table-header-cell">Asignado</th>
                                <th className="table-header-cell">Estado</th>
                                <th className="table-header-cell text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="table-body">
                            {(query.data || []).length === 0 ? (
                                <tr><td colSpan={7} className="table-cell text-center text-slate-500 py-8">No hay tareas</td></tr>
                            ) : (
                                (query.data || []).map(task => (
                                    <tr key={task.id} className="table-row cursor-pointer hover:bg-slate-50" onClick={() => onOpenTask(task.id)}>
                                        <td className="table-cell text-sm">{formatDate(task.due_at)}</td>
                                        <td className="table-cell font-medium">{task.title}</td>
                                        <td className="table-cell text-sm">{displayTerminal(task.terminal_code)}</td>
                                        <td className="table-cell">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                        </td>
                                        <td className="table-cell text-sm">{task.assigned_to_name}</td>
                                        <td className="table-cell">
                                            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(task.status)}`}>{task.status}</span>
                                        </td>
                                        <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => onOpenTask(task.id)} className="btn btn-ghost btn-icon" title="Ver">
                                                    <Icon name="eye" size={16} />
                                                </button>
                                                {canManage && (
                                                    <button onClick={() => setEditingTask(task)} className="btn btn-ghost btn-icon" title="Editar">
                                                        <Icon name="edit" size={16} />
                                                    </button>
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

            {showForm && <TaskFormModal onClose={() => setShowForm(false)} onSuccess={() => setShowForm(false)} />}
            {editingTask && <TaskFormModal task={editingTask} onClose={() => setEditingTask(null)} onSuccess={() => setEditingTask(null)} />}
        </div>
    );
};
