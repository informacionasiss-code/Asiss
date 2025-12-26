import { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/common/PageHeader';
import { Icon } from '../../../shared/components/common/Icon';
import { useTaskEmailSettings, useUpsertTaskEmailSettings } from '../hooks';
import { TaskEmailSettings } from '../types';

export const SettingsView = () => {
    const settingsQuery = useTaskEmailSettings('GLOBAL', 'ALL');
    const upsertMutation = useUpsertTaskEmailSettings();

    const [enabled, setEnabled] = useState(true);
    const [ccEmails, setCcEmails] = useState('');
    const [subjectTemplates, setSubjectTemplates] = useState<TaskEmailSettings['subject_templates']>({
        assigned: 'Nueva tarea asignada: {{title}}',
        status_change: 'Tarea actualizada: {{title}}',
        overdue: 'Tarea vencida: {{title}}',
        evaluated_ok: 'Tarea evaluada: {{title}}',
        evaluated_reject: 'Tarea rechazada: {{title}}',
    });
    const [bodyTemplates, setBodyTemplates] = useState<TaskEmailSettings['body_templates']>({
        assigned: '',
        status_change: '',
        overdue: '',
        evaluated_ok: '',
        evaluated_reject: '',
    });

    useEffect(() => {
        if (settingsQuery.data) {
            setEnabled(settingsQuery.data.enabled);
            setCcEmails(settingsQuery.data.cc_emails || '');
            setSubjectTemplates(settingsQuery.data.subject_templates);
            setBodyTemplates(settingsQuery.data.body_templates);
        }
    }, [settingsQuery.data]);

    const handleSave = async () => {
        await upsertMutation.mutateAsync({
            scope_type: 'GLOBAL',
            scope_code: 'ALL',
            enabled,
            cc_emails: ccEmails || null,
            subject_templates: subjectTemplates,
            body_templates: bodyTemplates,
        });
    };

    const templateKeys: { key: keyof TaskEmailSettings['subject_templates']; label: string }[] = [
        { key: 'assigned', label: 'Al asignar tarea' },
        { key: 'status_change', label: 'Cambio de estado' },
        { key: 'overdue', label: 'Tarea vencida' },
        { key: 'evaluated_ok', label: 'Tarea aceptada' },
        { key: 'evaluated_reject', label: 'Tarea rechazada' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Configuración" description="Ajustes de correo y notificaciones para tareas" />

            <div className="card p-6 max-w-3xl">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Icon name="send" size={18} /> Configuración de Correos
                </h3>

                <div className="space-y-6">
                    {/* Enable toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                            <div className="font-medium text-slate-800">Notificaciones por correo</div>
                            <div className="text-sm text-slate-500">Enviar correos al asignar, cambiar estado o evaluar tareas</div>
                        </div>
                        <button
                            onClick={() => setEnabled(!enabled)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-brand-600' : 'bg-slate-300'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* CC emails */}
                    <div>
                        <label className="label">Correos en copia (CC)</label>
                        <input
                            type="text"
                            className="input"
                            value={ccEmails}
                            onChange={(e) => setCcEmails(e.target.value)}
                            placeholder="correo1@ejemplo.cl, correo2@ejemplo.cl"
                        />
                        <p className="text-xs text-slate-500 mt-1">Separar múltiples correos con coma</p>
                    </div>

                    {/* Templates */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-slate-700">Plantillas de correo</h4>
                        <p className="text-xs text-slate-500">
                            Variables: {'{{title}}, {{description}}, {{assigned_name}}, {{status}}, {{priority}}, {{due_date}}, {{creator}}, {{reason}}'}
                        </p>

                        {templateKeys.map(({ key, label }) => (
                            <div key={key} className="border rounded-lg p-4">
                                <div className="font-medium text-sm text-slate-700 mb-2">{label}</div>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        className="input text-sm"
                                        placeholder="Asunto"
                                        value={subjectTemplates[key]}
                                        onChange={(e) => setSubjectTemplates(p => ({ ...p, [key]: e.target.value }))}
                                    />
                                    <textarea
                                        className="input min-h-[80px] text-sm font-mono"
                                        placeholder="Cuerpo del correo"
                                        value={bodyTemplates[key]}
                                        onChange={(e) => setBodyTemplates(p => ({ ...p, [key]: e.target.value }))}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button onClick={handleSave} disabled={upsertMutation.isPending} className="btn btn-primary">
                            {upsertMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
