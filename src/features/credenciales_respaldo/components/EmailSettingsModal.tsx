import { useState, useEffect, FormEvent } from 'react';
import { X, Mail, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BackupEmailSettings, INVENTORY_TERMINALS } from '../types';
import { fetchEmailSettings, upsertEmailSettings } from '../api/backupApi';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const EmailSettingsModal = ({ isOpen, onClose }: Props) => {
    const queryClient = useQueryClient();
    const [selectedScope, setSelectedScope] = useState<string>('GLOBAL');
    const [form, setForm] = useState({
        manager_email: '',
        cc_emails: '',
        subject_manager: 'Solicitud de Nueva Credencial',
        subject_boss: 'Notificacion de Credencial de Respaldo',
        enabled: true,
    });

    const { data: settings = [], isLoading } = useQuery({
        queryKey: ['backup-email-settings'],
        queryFn: fetchEmailSettings,
        enabled: isOpen,
    });

    const mutation = useMutation({
        mutationFn: upsertEmailSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backup-email-settings'] });
        },
    });

    // Load existing settings when scope changes
    useEffect(() => {
        const existing = settings.find(
            (s) => (selectedScope === 'GLOBAL' ? s.scope_type === 'GLOBAL' : s.scope_code === selectedScope)
        );
        if (existing) {
            setForm({
                manager_email: existing.manager_email,
                cc_emails: existing.cc_emails || '',
                subject_manager: existing.subject_manager,
                subject_boss: existing.subject_boss,
                enabled: existing.enabled,
            });
        } else {
            setForm({
                manager_email: '',
                cc_emails: '',
                subject_manager: 'Solicitud de Nueva Credencial',
                subject_boss: 'Notificacion de Credencial de Respaldo',
                enabled: true,
            });
        }
    }, [selectedScope, settings]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            scope_type: selectedScope === 'GLOBAL' ? 'GLOBAL' : 'TERMINAL',
            scope_code: selectedScope,
            ...form,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
                    <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-slate-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Configuracion de Correos</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-600 mb-2">Configurar para:</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedScope('GLOBAL')}
                                    className={`px-3 py-1.5 text-sm rounded-lg border ${selectedScope === 'GLOBAL'
                                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    Global
                                </button>
                                {INVENTORY_TERMINALS.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setSelectedScope(t)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border ${selectedScope === t
                                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">
                                        Email del Gestor (crear credencial)
                                    </label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={form.manager_email}
                                        onChange={(e) => setForm((prev) => ({ ...prev, manager_email: e.target.value }))}
                                        placeholder="gestor@empresa.cl"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">
                                        CC (opcional, separar por coma)
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={form.cc_emails}
                                        onChange={(e) => setForm((prev) => ({ ...prev, cc_emails: e.target.value }))}
                                        placeholder="copia1@empresa.cl, copia2@empresa.cl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">
                                        Asunto para Gestor
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={form.subject_manager}
                                        onChange={(e) => setForm((prev) => ({ ...prev, subject_manager: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">
                                        Asunto para Jefatura
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={form.subject_boss}
                                        onChange={(e) => setForm((prev) => ({ ...prev, subject_boss: e.target.value }))}
                                        required
                                    />
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.enabled}
                                        onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                                        className="w-4 h-4 rounded border-slate-300"
                                    />
                                    <span className="text-sm text-slate-700">Envio habilitado</span>
                                </label>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                    <button type="button" onClick={onClose} className="btn btn-secondary">
                                        Cerrar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary flex items-center gap-2"
                                        disabled={mutation.isPending}
                                    >
                                        <Save className="w-4 h-4" />
                                        {mutation.isPending ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>

                                {mutation.isSuccess && (
                                    <p className="text-sm text-emerald-600 text-center">Configuracion guardada correctamente</p>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
