import { useState, useEffect } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useSrlEmailSettings, useUpdateSrlEmailSettings } from '../hooks';
import { SrlEmailSetting } from '../types';

export const ConfigView = () => {
    const { data: settings, isLoading } = useSrlEmailSettings();
    const updateMutation = useUpdateSrlEmailSettings();

    const [formData, setFormData] = useState<Partial<SrlEmailSetting>>({
        enabled: true,
        recipients: '',
        cc_emails: '',
        subject_template: 'Nueva Solicitud SRL - Terminal {terminal}',
        body_template: 'Se ha generado una nueva solicitud para el terminal {terminal}.\n\nDetalles:\n{details}'
    });

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateMutation.mutateAsync(formData);
            alert('Configuración guardada correctamente');
        } catch (error) {
            console.error(error);
            alert('Error al guardar configuración');
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando configuración...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Configuración de Notificaciones</h2>
                    <p className="text-slate-500 text-sm">Administre los destinatarios y plantillas de correo automático</p>
                </div>
                <div className={`
                    px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2
                    ${formData.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}
                `}>
                    <div className={`w-2 h-2 rounded-full ${formData.enabled ? 'bg-green-600' : 'bg-slate-400'}`}></div>
                    {formData.enabled ? 'Sistema Activo' : 'Sistema Inactivo'}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8">

                {/* Toggle */}
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.enabled}
                            onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ms-3 text-sm font-medium text-slate-700">Habilitar envío automático de correos</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Destinatarios Principales</label>
                        <p className="text-xs text-slate-500 mb-2">Separados por coma (ej: jefe@srl.cl, soporte@srl.cl)</p>
                        <input
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.recipients || ''}
                            onChange={e => setFormData({ ...formData, recipients: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Copia Oculta / CC</label>
                        <p className="text-xs text-slate-500 mb-2">Separados por coma (ej: supervision@asis.cl)</p>
                        <input
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.cc_emails || ''}
                            onChange={e => setFormData({ ...formData, cc_emails: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="font-semibold text-slate-800">Plantillas de Mensaje</h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Asunto del Correo</label>
                        <input
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.subject_template || ''}
                            onChange={e => setFormData({ ...formData, subject_template: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 mt-1">Variables disponibles: {'{terminal}'}, {'{id}'}, {'{date}'}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cuerpo del Mensaje</label>
                        <textarea
                            rows={6}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            value={formData.body_template || ''}
                            onChange={e => setFormData({ ...formData, body_template: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 mt-1">Variables disponibles: {'{terminal}'}, {'{id}'}, {'{date}'}, {'{details}'}</p>
                    </div>
                </div>

                <div className="pt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {updateMutation.isPending ? <Icon name="loader" className="animate-spin" size={20} /> : <Icon name="save" size={20} />}
                        Guardar Configuración
                    </button>
                </div>

            </form>
        </div>
    );
};
