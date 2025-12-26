import { useState, useEffect } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useTerminalStore } from '../../../shared/state/terminalStore';
import { terminalOptions } from '../../../shared/utils/terminal';
import { TerminalCode } from '../../../shared/types/terminal';
import { useSupervisors, useCreateMeeting, useUpdateMeeting, useInvitees, useAddInvitees } from '../hooks';
import { MeetingFormValues, AgendaItem, InviteeInput, MeetingWithCounts } from '../types';
import { InviteesSelector } from './InviteesSelector';

interface MeetingFormModalProps {
    meeting?: MeetingWithCounts;
    onClose: () => void;
    onSuccess: () => void;
}

export const MeetingFormModal = ({ meeting, onClose, onSuccess }: MeetingFormModalProps) => {
    const terminalContext = useTerminalStore((s) => s.context);
    const createMutation = useCreateMeeting();
    const updateMutation = useUpdateMeeting();
    const inviteesQuery = useInvitees(meeting?.id || null);
    const addInviteesMutation = useAddInvitees();

    const [formData, setFormData] = useState<MeetingFormValues>({
        title: '',
        terminal_code: (terminalContext.mode === 'TERMINAL' ? terminalContext.value : 'EL_ROBLE') as TerminalCode,
        starts_at: '',
        duration_minutes: 60,
        location: '',
        meeting_link: '',
        agenda_json: [],
        invitees: [],
    });

    const [newAgendaItem, setNewAgendaItem] = useState('');

    useEffect(() => {
        if (meeting) {
            setFormData({
                title: meeting.title,
                terminal_code: meeting.terminal_code,
                starts_at: meeting.starts_at.slice(0, 16),
                duration_minutes: meeting.duration_minutes,
                location: meeting.location || '',
                meeting_link: meeting.meeting_link || '',
                agenda_json: meeting.agenda_json || [],
                invitees: [],
            });
        }
    }, [meeting]);

    const handleAddAgendaItem = () => {
        if (!newAgendaItem.trim()) return;
        const item: AgendaItem = { id: crypto.randomUUID(), text: newAgendaItem.trim() };
        setFormData(prev => ({ ...prev, agenda_json: [...prev.agenda_json, item] }));
        setNewAgendaItem('');
    };

    const handleRemoveAgendaItem = (id: string) => {
        setFormData(prev => ({ ...prev, agenda_json: prev.agenda_json.filter(i => i.id !== id) }));
    };

    const handleInviteesChange = (invitees: InviteeInput[]) => {
        setFormData(prev => ({ ...prev, invitees }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (meeting) {
                await updateMutation.mutateAsync({ id: meeting.id, values: formData });
                if (formData.invitees.length > 0) {
                    await addInviteesMutation.mutateAsync({ meetingId: meeting.id, invitees: formData.invitees });
                }
            } else {
                await createMutation.mutateAsync(formData);
            }
            onSuccess();
        } catch (err) {
            console.error('Error saving meeting:', err);
        }
    };

    const isValid = formData.title && formData.starts_at && formData.terminal_code;
    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
                <div className="bg-brand-600 text-white p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">
                            {meeting ? 'Editar Reunión' : 'Nueva Reunión'}
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                            <Icon name="x" size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="label">Título de la reunión</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Ej: Reunión de coordinación semanal"
                                required
                            />
                        </div>

                        {/* Terminal & DateTime */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Terminal</label>
                                <select
                                    className="input"
                                    value={formData.terminal_code}
                                    onChange={(e) => setFormData(prev => ({ ...prev, terminal_code: e.target.value as TerminalCode }))}
                                    required
                                >
                                    {terminalOptions.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Fecha y hora</label>
                                <input
                                    type="datetime-local"
                                    className="input"
                                    value={formData.starts_at}
                                    onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        {/* Duration & Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Duración (minutos)</label>
                                <select
                                    className="input"
                                    value={formData.duration_minutes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                                >
                                    <option value={30}>30 minutos</option>
                                    <option value={60}>1 hora</option>
                                    <option value={90}>1.5 horas</option>
                                    <option value={120}>2 horas</option>
                                    <option value={180}>3 horas</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Lugar / Sala</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder="Ej: Sala de reuniones"
                                />
                            </div>
                        </div>

                        {/* Meeting Link */}
                        <div>
                            <label className="label">Link de videollamada (opcional)</label>
                            <input
                                type="url"
                                className="input"
                                value={formData.meeting_link}
                                onChange={(e) => setFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
                                placeholder="https://meet.google.com/..."
                            />
                        </div>

                        {/* Agenda */}
                        <div>
                            <label className="label">Agenda</label>
                            <div className="space-y-2">
                                {formData.agenda_json.map((item, i) => (
                                    <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                                        <span className="font-medium text-slate-500">{i + 1}.</span>
                                        <span className="flex-1">{item.text}</span>
                                        <button type="button" onClick={() => handleRemoveAgendaItem(item.id)} className="text-red-500 hover:text-red-700">
                                            <Icon name="x" size={16} />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="input flex-1"
                                        value={newAgendaItem}
                                        onChange={(e) => setNewAgendaItem(e.target.value)}
                                        placeholder="Agregar punto a la agenda"
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAgendaItem())}
                                    />
                                    <button type="button" onClick={handleAddAgendaItem} className="btn btn-secondary">
                                        <Icon name="plus" size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Invitees */}
                        <div>
                            <label className="label">Invitados (supervisores)</label>
                            <InviteesSelector
                                value={formData.invitees}
                                onChange={handleInviteesChange}
                                existingInvitees={inviteesQuery.data || []}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" disabled={!isValid || isLoading} className="btn btn-primary">
                            {isLoading ? 'Guardando...' : meeting ? 'Actualizar' : 'Crear Reunión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
