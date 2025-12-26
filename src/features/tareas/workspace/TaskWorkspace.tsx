import { useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { LoadingState } from '../../../shared/components/common/LoadingState';
import { displayTerminal } from '../../../shared/utils/terminal';
import { useTaskById, useComments, useAttachments, useAddComment, useUploadAttachment, useAddUrlAttachment, useDeleteAttachment, useUpdateTaskStatus, useEvaluateTask } from '../hooks';
import { useSessionStore } from '../../../shared/state/sessionStore';
import { isTaskManager, isTaskAssigned, getAllowedTransitions } from '../utils/permissions';
import { Task, TaskStatus, getStatusColor, getPriorityColor } from '../types';
import { getAttachmentUrl } from '../api/tasksApi';
import { EvaluateModal } from '../components/EvaluateModal';

interface TaskWorkspaceProps {
    taskId: string;
    onClose: () => void;
}

export const TaskWorkspace = ({ taskId, onClose }: TaskWorkspaceProps) => {
    const session = useSessionStore((s) => s.session);
    const supervisorName = session?.supervisorName ?? '';
    const canManage = isTaskManager(supervisorName);

    const [activeSection, setActiveSection] = useState<'info' | 'comments' | 'attachments'>('info');
    const [newComment, setNewComment] = useState('');
    const [showEvaluate, setShowEvaluate] = useState<'accept' | 'reject' | null>(null);
    const [urlInput, setUrlInput] = useState({ url: '', label: '' });

    const taskQuery = useTaskById(taskId);
    const commentsQuery = useComments(taskId);
    const attachmentsQuery = useAttachments(taskId);
    const addCommentMutation = useAddComment();
    const uploadMutation = useUploadAttachment();
    const addUrlMutation = useAddUrlAttachment();
    const deleteAttachmentMutation = useDeleteAttachment();
    const statusMutation = useUpdateTaskStatus();
    const evaluateMutation = useEvaluateTask();

    const task = taskQuery.data;

    const isAssigned = task ? isTaskAssigned(supervisorName, task.assigned_to_name) : false;
    const allowedTransitions = task ? getAllowedTransitions(task.status, canManage, isAssigned) : [];

    const handleStatusChange = async (status: TaskStatus) => {
        await statusMutation.mutateAsync({ id: taskId, status });
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        await addCommentMutation.mutateAsync({ taskId, body: newComment });
        setNewComment('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadMutation.mutateAsync({ taskId, file });
        e.target.value = '';
    };

    const handleAddUrl = async () => {
        if (!urlInput.url.trim()) return;
        await addUrlMutation.mutateAsync({ taskId, url: urlInput.url, label: urlInput.label || urlInput.url });
        setUrlInput({ url: '', label: '' });
    };

    const handleDownloadFile = async (storagePath: string) => {
        const url = await getAttachmentUrl(storagePath);
        window.open(url, '_blank');
    };

    const handleEvaluate = async (accepted: boolean, note?: string, reason?: string) => {
        await evaluateMutation.mutateAsync({ id: taskId, accepted, note, reason });
        setShowEvaluate(null);
    };

    if (taskQuery.isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <LoadingState label="Cargando tarea..." />
            </div>
        );
    }

    if (!task) return null;

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('es-CL');

    const sections = [
        { id: 'info', label: 'Info', icon: 'info' as const },
        { id: 'comments', label: 'Comentarios', icon: 'clipboard' as const },
        { id: 'attachments', label: 'Adjuntos', icon: 'file' as const },
    ];

    return (
        <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm">
            <div className="w-full h-full bg-white flex flex-col lg:flex-row animate-scale-in">
                {/* Sidebar */}
                <div className="lg:w-64 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible shrink-0">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id as typeof activeSection)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeSection === s.id ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            <Icon name={s.icon} size={18} />
                            <span className="hidden lg:inline">{s.label}</span>
                        </button>
                    ))}
                    <button onClick={onClose} className="mt-auto flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200">
                        <Icon name="x" size={18} /> <span className="hidden lg:inline">Cerrar</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Header */}
                    <div className="mb-6 pb-4 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{task.title}</h2>
                                <p className="text-slate-500 mt-1">{task.description || 'Sin descripción'}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(task.status)}`}>{task.status}</span>
                            </div>
                        </div>

                        {/* Status Actions */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            {allowedTransitions.filter(s => s !== task.status && !['EVALUADO', 'RECHAZADO'].includes(s)).map(status => (
                                <button key={status} onClick={() => handleStatusChange(status as TaskStatus)} className="btn btn-secondary text-sm" disabled={statusMutation.isPending}>
                                    Cambiar a {status}
                                </button>
                            ))}
                            {canManage && task.status === 'TERMINADO' && (
                                <>
                                    <button onClick={() => setShowEvaluate('accept')} className="btn bg-green-600 hover:bg-green-700 text-white text-sm">
                                        <Icon name="check-circle" size={16} /> Aceptar
                                    </button>
                                    <button onClick={() => setShowEvaluate('reject')} className="btn bg-red-600 hover:bg-red-700 text-white text-sm">
                                        <Icon name="x-circle" size={16} /> Rechazar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    {activeSection === 'info' && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <div className="text-sm text-slate-500">Terminal</div>
                                <div className="font-medium">{displayTerminal(task.terminal_code)}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <div className="text-sm text-slate-500">Asignado a</div>
                                <div className="font-medium">{task.assigned_to_name}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <div className="text-sm text-slate-500">Vencimiento</div>
                                <div className="font-medium">{task.due_at ? formatDate(task.due_at) : 'Sin fecha'}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <div className="text-sm text-slate-500">Creado por</div>
                                <div className="font-medium">{task.created_by_supervisor}</div>
                            </div>
                            {task.evaluated_by && (
                                <div className="bg-slate-50 p-4 rounded-lg md:col-span-2">
                                    <div className="text-sm text-slate-500">Evaluado por</div>
                                    <div className="font-medium">{task.evaluated_by} - {task.evaluated_at ? formatDate(task.evaluated_at) : ''}</div>
                                    {task.evaluation_note && <div className="text-sm text-slate-600 mt-1">{task.evaluation_note}</div>}
                                </div>
                            )}
                            {task.rejected_reason && (
                                <div className="bg-red-50 p-4 rounded-lg md:col-span-2 border border-red-200">
                                    <div className="text-sm text-red-600 font-medium">Motivo de rechazo</div>
                                    <div className="text-red-700 mt-1">{task.rejected_reason}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Comments Section */}
                    {activeSection === 'comments' && (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <textarea
                                    className="input flex-1 min-h-[80px]"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Agregar comentario o actualización..."
                                />
                                <button onClick={handleAddComment} disabled={!newComment.trim() || addCommentMutation.isPending} className="btn btn-primary self-end">
                                    <Icon name="send" size={16} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {(commentsQuery.data || []).map(comment => (
                                    <div key={comment.id} className="bg-slate-50 p-3 rounded-lg">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-slate-700">{comment.author_name}</span>
                                            <span className="text-slate-400">{new Date(comment.created_at).toLocaleString('es-CL')}</span>
                                        </div>
                                        <div className="mt-2 text-slate-600">{comment.body}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Attachments Section */}
                    {activeSection === 'attachments' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <label className="btn btn-secondary cursor-pointer inline-flex items-center gap-2">
                                    <Icon name="upload" size={16} /> Subir archivo
                                    <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.xlsx" onChange={handleFileUpload} />
                                </label>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 p-3 bg-slate-50 rounded-lg">
                                <input type="url" className="input flex-1" placeholder="URL" value={urlInput.url} onChange={(e) => setUrlInput(p => ({ ...p, url: e.target.value }))} />
                                <input type="text" className="input flex-1" placeholder="Etiqueta (opcional)" value={urlInput.label} onChange={(e) => setUrlInput(p => ({ ...p, label: e.target.value }))} />
                                <button onClick={handleAddUrl} disabled={!urlInput.url} className="btn btn-secondary shrink-0">
                                    <Icon name="plus" size={16} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(attachmentsQuery.data || []).map(att => (
                                    <div key={att.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Icon name={att.type === 'URL' ? 'activity' : 'file'} size={20} className="text-slate-400" />
                                            <div>
                                                <div className="font-medium text-sm">{att.file_name}</div>
                                                {att.size_bytes && <div className="text-xs text-slate-500">{(att.size_bytes / 1024).toFixed(1)} KB</div>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {att.type === 'FILE' && att.storage_path && (
                                                <button onClick={() => handleDownloadFile(att.storage_path!)} className="btn btn-ghost btn-icon">
                                                    <Icon name="eye" size={16} />
                                                </button>
                                            )}
                                            {att.type === 'URL' && att.url && (
                                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon">
                                                    <Icon name="eye" size={16} />
                                                </a>
                                            )}
                                            <button onClick={() => deleteAttachmentMutation.mutate({ id: att.id, storagePath: att.storage_path, taskId })} className="btn btn-ghost btn-icon text-red-500">
                                                <Icon name="trash" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showEvaluate && (
                <EvaluateModal
                    mode={showEvaluate}
                    taskTitle={task.title}
                    onConfirm={(note, reason) => handleEvaluate(showEvaluate === 'accept', note, reason)}
                    onCancel={() => setShowEvaluate(null)}
                    isLoading={evaluateMutation.isPending}
                />
            )}
        </div>
    );
};
