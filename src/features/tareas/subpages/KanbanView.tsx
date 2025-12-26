import { useState } from 'react';
import { PageHeader } from '../../../shared/components/common/PageHeader';
import { Icon } from '../../../shared/components/common/Icon';
import { useSessionStore } from '../../../shared/state/sessionStore';
import { useTasks, useUpdateTaskStatus, useCreateTask } from '../hooks';
import { isTaskManager, isTaskAssigned, getAllowedTransitions } from '../utils/permissions';
import { Task, TaskStatus, STATUS_COLUMNS, getStatusColor, getPriorityColor, TaskFilters } from '../types';
import { TaskFormModal } from '../components/TaskFormModal';

interface KanbanViewProps {
    onOpenTask: (id: string) => void;
}

const COLUMN_LABELS: Record<TaskStatus, string> = {
    PENDIENTE: 'Pendiente',
    EN_CURSO: 'En Curso',
    TERMINADO: 'Terminado',
    EVALUADO: 'Evaluado',
    RECHAZADO: 'Rechazado',
};

export const KanbanView = ({ onOpenTask }: KanbanViewProps) => {
    const session = useSessionStore((s) => s.session);
    const supervisorName = session?.supervisorName ?? '';
    const canManage = isTaskManager(supervisorName);

    const [showForm, setShowForm] = useState(false);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    const query = useTasks();
    const statusMutation = useUpdateTaskStatus();

    const tasksByStatus = (status: TaskStatus): Task[] => {
        return (query.data || []).filter(t => t.status === status);
    };

    const handleDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (targetStatus: TaskStatus) => {
        if (!draggedTask || draggedTask.status === targetStatus) {
            setDraggedTask(null);
            return;
        }

        const isManager = isTaskManager(supervisorName);
        const isAssigned = isTaskAssigned(supervisorName, draggedTask.assigned_to_name);
        const allowed = getAllowedTransitions(draggedTask.status, isManager, isAssigned);

        if (!allowed.includes(targetStatus)) {
            setDraggedTask(null);
            return;
        }

        await statusMutation.mutateAsync({ id: draggedTask.id, status: targetStatus });
        setDraggedTask(null);
    };

    const formatDueDate = (dueAt: string | null) => {
        if (!dueAt) return null;
        const d = new Date(dueAt);
        const now = new Date();
        const isOverdue = d < now;
        return (
            <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                {d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            <PageHeader
                title="Tablero de Tareas"
                description="Vista Kanban con arrastrar y soltar"
                actions={
                    canManage && (
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                            <Icon name="plus" size={18} /> Nueva Tarea
                        </button>
                    )
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
                {STATUS_COLUMNS.map(status => (
                    <div
                        key={status}
                        className="bg-slate-100 rounded-xl p-3 min-h-[400px]"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(status)}
                    >
                        <div className={`flex items-center justify-between mb-3 px-2 py-1 rounded-lg ${getStatusColor(status)}`}>
                            <span className="font-semibold text-sm">{COLUMN_LABELS[status]}</span>
                            <span className="text-xs font-medium px-2 py-0.5 bg-white/50 rounded-full">
                                {tasksByStatus(status).length}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {tasksByStatus(status).map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={() => handleDragStart(task)}
                                    onClick={() => onOpenTask(task.id)}
                                    className={`bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4 ${draggedTask?.id === task.id ? 'opacity-50' : ''
                                        }`}
                                    style={{ borderLeftColor: task.priority === 'CRITICA' ? '#ef4444' : task.priority === 'ALTA' ? '#f59e0b' : task.priority === 'MEDIA' ? '#3b82f6' : '#94a3b8' }}
                                >
                                    <div className="font-medium text-sm text-slate-800 line-clamp-2">{task.title}</div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        {formatDueDate(task.due_at)}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-2 truncate">{task.assigned_to_name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <TaskFormModal
                    onClose={() => setShowForm(false)}
                    onSuccess={() => setShowForm(false)}
                />
            )}
        </div>
    );
};
