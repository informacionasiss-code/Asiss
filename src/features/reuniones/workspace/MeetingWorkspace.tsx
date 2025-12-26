import { useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { LoadingState } from '../../../shared/components/common/LoadingState';
import { displayTerminal } from '../../../shared/utils/terminal';
import { useMeetingById, useInvitees, useFiles, useActions, useUpdateMinutes, useSendInvitations, useUploadFile, useDeleteFile, useCreateAction, useUpdateAction, useDeleteAction } from '../hooks';
import { useSessionStore } from '../../../shared/state/sessionStore';
import { isMeetingManager } from '../utils/permissions';
import { ActionFormValues, MeetingAction } from '../types';
import { getFileUrl } from '../api/meetingsApi';

interface MeetingWorkspaceProps {
    meetingId: string;
    onClose: () => void;
}

export const MeetingWorkspace = ({ meetingId, onClose }: MeetingWorkspaceProps) => {
    const session = useSessionStore((s) => s.session);
    const supervisorName = session?.supervisorName ?? '';
    const canManage = isMeetingManager(supervisorName);

    const [activeSection, setActiveSection] = useState<'info' | 'agenda' | 'invitees' | 'minutes' | 'actions' | 'files'>('info');
    const [minutes, setMinutes] = useState('');
    const [minutesSaved, setMinutesSaved] = useState(true);

    const meetingQuery = useMeetingById(meetingId);
    const inviteesQuery = useInvitees(meetingId);
    const filesQuery = useFiles(meetingId);
    const actionsQuery = useActions(meetingId);
    const updateMinutesMutation = useUpdateMinutes();
    const sendInvitationsMutation = useSendInvitations();
    const uploadFileMutation = useUploadFile();
    const deleteFileMutation = useDeleteFile();
    const createActionMutation = useCreateAction();
    const updateActionMutation = useUpdateAction();
    const deleteActionMutation = useDeleteAction();

    const meeting = meetingQuery.data;

    // Initialize minutes
    useState(() => {
        if (meeting?.minutes_text) setMinutes(meeting.minutes_text);
    });

    const handleSaveMinutes = async () => {
        await updateMinutesMutation.mutateAsync({ id: meetingId, minutes });
        setMinutesSaved(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadFileMutation.mutateAsync({ meetingId, file });
        e.target.value = '';
    };

    const handleDownloadFile = async (storagePath: string, fileName: string) => {
        const url = await getFileUrl(storagePath);
        window.open(url, '_blank');
    };

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
            ' a las ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'REALIZADA': return <span className="badge badge-success">{status}</span>;
            case 'CANCELADA': return <span className="badge badge-danger">{status}</span>;
            default: return <span className="badge badge-warning">{status}</span>;
        }
    };

    if (meetingQuery.isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <LoadingState label="Cargando reunión..." />
            </div>
        );
    }

    if (!meeting) return null;

    const sections = [
        { id: 'info', label: 'Info', icon: 'info' as const },
        { id: 'agenda', label: 'Agenda', icon: 'clipboard' as const },
        { id: 'invitees', label: 'Invitados', icon: 'users' as const },
        { id: 'minutes', label: 'Minuta', icon: 'file-text' as const },
        { id: 'actions', label: 'Acuerdos', icon: 'check-circle' as const },
        { id: 'files', label: 'Archivos', icon: 'file' as const },
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
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{meeting.title}</h2>
                                <p className="text-slate-500 mt-1">{formatDateTime(meeting.starts_at)}</p>
                            </div>
                            {getStatusBadge(meeting.status)}
                        </div>
                    </div>

                    {/* Info Section */}
                    {activeSection === 'info' && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <div className="text-sm text-slate-500">Terminal</div>
                                <div className="font-medium">{displayTerminal(meeting.terminal_code)}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <div className="text-sm text-slate-500">Duración</div>
                                <div className="font-medium">{meeting.duration_minutes} minutos</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <div className="text-sm text-slate-500">Lugar</div>
                                <div className="font-medium">{meeting.location || 'No especificado'}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <div className="text-sm text-slate-500">Link</div>
                                {meeting.meeting_link ? (
                                    <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                                        Unirse a la reunión
                                    </a>
                                ) : (
                                    <div className="font-medium">No disponible</div>
                                )}
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg md:col-span-2">
                                <div className="text-sm text-slate-500">Organizado por</div>
                                <div className="font-medium">{meeting.created_by_supervisor}</div>
                            </div>
                        </div>
                    )}

                    {/* Agenda Section */}
                    {activeSection === 'agenda' && (
                        <div className="space-y-2">
                            {meeting.agenda_json.length === 0 ? (
                                <p className="text-slate-500">Sin agenda definida</p>
                            ) : (
                                meeting.agenda_json.map((item, i) => (
                                    <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                                        <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold">{i + 1}</span>
                                        <span className="flex-1">{item.text}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Invitees Section */}
                    {activeSection === 'invitees' && (
                        <div className="space-y-4">
                            {canManage && (
                                <button onClick={() => sendInvitationsMutation.mutate({ meetingId })} disabled={sendInvitationsMutation.isPending} className="btn btn-secondary">
                                    <Icon name="send" size={16} /> {sendInvitationsMutation.isPending ? 'Enviando...' : 'Reenviar invitaciones'}
                                </button>
                            )}
                            <div className="space-y-2">
                                {(inviteesQuery.data || []).map(inv => (
                                    <div key={inv.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                        <div>
                                            <div className="font-medium">{inv.invitee_name}</div>
                                            {inv.invitee_email && <div className="text-sm text-slate-500">{inv.invitee_email}</div>}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${inv.notification_status === 'ENVIADO' ? 'bg-green-100 text-green-700' :
                                                inv.notification_status === 'ERROR' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {inv.notification_status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Minutes Section */}
                    {activeSection === 'minutes' && (
                        <div className="space-y-4">
                            <textarea
                                className="input min-h-[300px] font-mono"
                                value={minutes}
                                onChange={(e) => { setMinutes(e.target.value); setMinutesSaved(false); }}
                                placeholder="Escriba la minuta de la reunión aquí..."
                                disabled={!canManage}
                            />
                            {canManage && (
                                <div className="flex items-center gap-4">
                                    <button onClick={handleSaveMinutes} disabled={minutesSaved || updateMinutesMutation.isPending} className="btn btn-primary">
                                        {updateMinutesMutation.isPending ? 'Guardando...' : 'Guardar Minuta'}
                                    </button>
                                    {minutesSaved && <span className="text-sm text-green-600">Guardado</span>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions Section */}
                    {activeSection === 'actions' && (
                        <ActionsPanel
                            actions={actionsQuery.data || []}
                            meetingId={meetingId}
                            canManage={canManage}
                            onCreate={(values) => createActionMutation.mutate({ meetingId, values })}
                            onUpdate={(id, values) => updateActionMutation.mutate({ id, meetingId, values })}
                            onDelete={(id) => deleteActionMutation.mutate({ id, meetingId })}
                        />
                    )}

                    {/* Files Section */}
                    {activeSection === 'files' && (
                        <div className="space-y-4">
                            {canManage && (
                                <label className="btn btn-secondary cursor-pointer inline-flex items-center gap-2">
                                    <Icon name="upload" size={16} /> Subir archivo
                                    <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={handleFileUpload} />
                                </label>
                            )}
                            <div className="space-y-2">
                                {(filesQuery.data || []).map(file => (
                                    <div key={file.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Icon name="file" size={20} className="text-slate-400" />
                                            <div>
                                                <div className="font-medium">{file.file_name}</div>
                                                <div className="text-xs text-slate-500">{(file.size_bytes / 1024).toFixed(1)} KB</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleDownloadFile(file.storage_path, file.file_name)} className="btn btn-ghost btn-icon">
                                                <Icon name="eye" size={16} />
                                            </button>
                                            {canManage && (
                                                <button onClick={() => deleteFileMutation.mutate({ id: file.id, storagePath: file.storage_path, meetingId })} className="btn btn-ghost btn-icon text-red-500">
                                                    <Icon name="trash" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Actions Panel Component
interface ActionsPanelProps {
    actions: MeetingAction[];
    meetingId: string;
    canManage: boolean;
    onCreate: (values: ActionFormValues) => void;
    onUpdate: (id: string, values: Partial<ActionFormValues & { status: MeetingAction['status'] }>) => void;
    onDelete: (id: string) => void;
}

const ActionsPanel = ({ actions, canManage, onCreate, onUpdate, onDelete }: ActionsPanelProps) => {
    const [newAction, setNewAction] = useState('');
    const [newResponsible, setNewResponsible] = useState('');
    const [newDueDate, setNewDueDate] = useState('');

    const handleAdd = () => {
        if (!newAction.trim()) return;
        onCreate({ description: newAction, responsible_name: newResponsible || undefined, due_date: newDueDate || undefined });
        setNewAction('');
        setNewResponsible('');
        setNewDueDate('');
    };

    return (
        <div className="space-y-4">
            {canManage && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                    <input className="input" value={newAction} onChange={(e) => setNewAction(e.target.value)} placeholder="Descripción del acuerdo" />
                    <div className="grid grid-cols-2 gap-2">
                        <input className="input" value={newResponsible} onChange={(e) => setNewResponsible(e.target.value)} placeholder="Responsable" />
                        <input type="date" className="input" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                    </div>
                    <button onClick={handleAdd} className="btn btn-primary" disabled={!newAction.trim()}>
                        <Icon name="plus" size={16} /> Agregar Acuerdo
                    </button>
                </div>
            )}
            <div className="space-y-2">
                {actions.map(action => (
                    <div key={action.id} className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                        <button
                            onClick={() => onUpdate(action.id, { status: action.status === 'CUMPLIDO' ? 'PENDIENTE' : 'CUMPLIDO' })}
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${action.status === 'CUMPLIDO' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                                }`}
                            disabled={!canManage}
                        >
                            {action.status === 'CUMPLIDO' && <Icon name="check" size={12} />}
                        </button>
                        <div className="flex-1">
                            <div className={action.status === 'CUMPLIDO' ? 'line-through text-slate-400' : ''}>{action.description}</div>
                            <div className="text-sm text-slate-500 mt-1">
                                {action.responsible_name && <span>{action.responsible_name}</span>}
                                {action.due_date && <span className="ml-2">{new Date(action.due_date).toLocaleDateString('es-CL')}</span>}
                            </div>
                        </div>
                        {canManage && (
                            <button onClick={() => onDelete(action.id)} className="text-red-500 hover:text-red-700">
                                <Icon name="trash" size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
