import { useState, useEffect } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { fetchEmailSettings, updateEmailSettings, ensureDefaultEmailSettings } from '../api/suppliesApi';
import { SupplyEmailSettings, EmailTrigger } from '../types';
import { emailService } from '../../../shared/services/emailService';

const TRIGGER_LABELS: Record<EmailTrigger, string> = {
    MONDAY: 'Lunes (Solicitud Semanal)',
    FRIDAY: 'Viernes (Fin de Semana)',
    MANUAL: 'Manual',
};

export const ConfigEmails = () => {
    const [settings, setSettings] = useState<SupplyEmailSettings[]>([]);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [sendingTest, setSendingTest] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [editForm, setEditForm] = useState({
        recipients: '',
        subject: '',
        body: '',
        enabled: true,
    });

    const loadSettings = async () => {
        try {
            const data = await fetchEmailSettings();
            setSettings(data);
            return data;
        } catch (error) {
            console.error('Error loading email settings:', error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const initializeDefaults = async () => {
        setInitializing(true);
        try {
            const created = await ensureDefaultEmailSettings();
            setSettings(created);
        } catch (error) {
            console.error('Error creating default settings:', error);
            alert('Error al crear configuraciones. Verifique que las tablas existan en Supabase.');
        } finally {
            setInitializing(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleEdit = (setting: SupplyEmailSettings) => {
        setEditingId(setting.id);
        setEditForm({
            recipients: setting.recipients,
            subject: setting.subject,
            body: setting.body,
            enabled: setting.enabled,
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({ recipients: '', subject: '', body: '', enabled: true });
    };

    const handleSave = async (id: string) => {
        setSaving(id);
        try {
            await updateEmailSettings(id, editForm);
            await loadSettings();
            setEditingId(null);
        } catch (error) {
            console.error('Error saving email settings:', error);
            alert('Error al guardar la configuracion');
        } finally {
            setSaving(null);
        }
    };

    const handleToggleEnabled = async (setting: SupplyEmailSettings) => {
        setSaving(setting.id);
        try {
            await updateEmailSettings(setting.id, { enabled: !setting.enabled });
            await loadSettings();
        } catch (error) {
            console.error('Error toggling email setting:', error);
        } finally {
            setSaving(null);
        }
    };

    const handleSendTest = async (setting: SupplyEmailSettings) => {
        if (!setting.recipients) {
            alert('Configure los destinatarios primero');
            return;
        }

        setSendingTest(setting.id);
        try {
            await emailService.sendEmail({
                audience: 'manual',
                manualRecipients: setting.recipients.split(',').map((r) => r.trim()),
                subject: `[TEST] ${setting.subject}`,
                body: `<p>Este es un correo de prueba.</p><hr/>${setting.body}`,
                module: 'informativos',
            });
            alert('Correo de prueba enviado');
        } catch (error) {
            console.error('Error sending test email:', error);
            alert('Error al enviar el correo de prueba');
        } finally {
            setSendingTest(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    // Empty state - no email settings yet
    if (settings.length === 0) {
        return (
            <div className="space-y-4">
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 p-8 text-center">
                    <Icon name="send" size={40} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="font-medium text-slate-800 mb-2">Configurar Correos Automaticos</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        Cree las configuraciones de correo para las solicitudes automaticas de Lunes, Viernes y Manual.
                    </p>
                    <button
                        onClick={initializeDefaults}
                        disabled={initializing}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                        {initializing ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <Icon name="plus" size={18} />
                        )}
                        Crear Configuraciones
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Info Banner */}
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                    <Icon name="info" size={18} className="mt-0.5 flex-shrink-0 text-slate-500" />
                    <p>
                        Configure los destinatarios y plantillas de correo para las solicitudes
                        automaticas. Los correos se envian automaticamente los dias configurados.
                    </p>
                </div>
            </div>

            {/* Settings Cards */}
            <div className="space-y-4">
                {settings.map((setting) => {
                    const isEditing = editingId === setting.id;
                    const isSaving = saving === setting.id;
                    const isSendingTest = sendingTest === setting.id;

                    return (
                        <div
                            key={setting.id}
                            className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`h-2 w-2 rounded-full ${setting.enabled ? 'bg-success-500' : 'bg-slate-400'
                                            }`}
                                    />
                                    <h3 className="font-medium text-slate-800">
                                        {TRIGGER_LABELS[setting.trigger]}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleEnabled(setting)}
                                        disabled={isSaving}
                                        className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${setting.enabled
                                            ? 'bg-success-100 text-success-700 hover:bg-success-200'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                    >
                                        {setting.enabled ? 'Activo' : 'Inactivo'}
                                    </button>
                                </div>
                            </div>

                            <div className="p-4">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        {/* Recipients */}
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Destinatarios (separados por coma)
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.recipients}
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({ ...prev, recipients: e.target.value }))
                                                }
                                                placeholder="correo1@ejemplo.com, correo2@ejemplo.com"
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                            />
                                        </div>

                                        {/* Subject */}
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Asunto
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.subject}
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({ ...prev, subject: e.target.value }))
                                                }
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                            />
                                        </div>

                                        {/* Body */}
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                                Cuerpo del mensaje (HTML permitido)
                                            </label>
                                            <textarea
                                                value={editForm.body}
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({ ...prev, body: e.target.value }))
                                                }
                                                rows={4}
                                                placeholder="Ejemplo: <p>Estimados,</p><p>Se adjunta la solicitud de insumos.</p>"
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleCancelEdit}
                                                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleSave(setting.id)}
                                                disabled={isSaving}
                                                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                                            >
                                                {isSaving && (
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                )}
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                    Destinatarios
                                                </span>
                                                <p className="mt-1 text-sm text-slate-800">
                                                    {setting.recipients || (
                                                        <span className="text-slate-400 italic">No configurado</span>
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                    Asunto
                                                </span>
                                                <p className="mt-1 text-sm text-slate-800">{setting.subject}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                Mensaje
                                            </span>
                                            <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                                                {setting.body || (
                                                    <span className="text-slate-400 italic">Sin mensaje</span>
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => handleEdit(setting)}
                                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                                            >
                                                <Icon name="edit" size={14} />
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleSendTest(setting)}
                                                disabled={isSendingTest || !setting.recipients}
                                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50"
                                            >
                                                {isSendingTest ? (
                                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                                                ) : (
                                                    <Icon name="send" size={14} />
                                                )}
                                                Enviar Prueba
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
