import { useState, useEffect } from 'react';
import { PageHeader } from '../../../shared/components/common/PageHeader';
import { Icon } from '../../../shared/components/common/Icon';
import { useEmailSettings, useUpsertEmailSettings } from '../hooks';

export const SettingsView = () => {
    const settingsQuery = useEmailSettings('GLOBAL', 'ALL');
    const upsertMutation = useUpsertEmailSettings();

    const [enabled, setEnabled] = useState(true);
    const [ccEmails, setCcEmails] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    useEffect(() => {
        if (settingsQuery.data) {
            setEnabled(settingsQuery.data.enabled);
            setCcEmails(settingsQuery.data.cc_emails || '');
            setSubject(settingsQuery.data.subject_template);
            setBody(settingsQuery.data.body_template);
        }
    }, [settingsQuery.data]);

    const handleSave = async () => {
        await upsertMutation.mutateAsync({
            scope_type: 'GLOBAL',
            scope_code: 'ALL',
            enabled,
            cc_emails: ccEmails || null,
            subject_template: subject,
            body_template: body,
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Configuración" description="Ajustes de correo y notificaciones para reuniones" />

            <div className="card p-6 max-w-2xl">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Icon name="send" size={18} /> Configuración de Correos
                </h3>

                <div className="space-y-4">
                    {/* Enable toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                            <div className="font-medium text-slate-800">Notificaciones por correo</div>
                            <div className="text-sm text-slate-500">Enviar invitaciones automáticas al crear reuniones</div>
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

                    {/* Subject template */}
                    <div>
                        <label className="label">Plantilla de asunto</label>
                        <input
                            type="text"
                            className="input"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1">Variables: {'{{title}}'}</p>
                    </div>

                    {/* Body template */}
                    <div>
                        <label className="label">Plantilla de cuerpo</label>
                        <textarea
                            className="input min-h-[200px] font-mono text-sm"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Variables: {'{{invitee_name}}, {{title}}, {{date}}, {{time}}, {{duration}}, {{location}}, {{agenda}}, {{organizer}}'}
                        </p>
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
