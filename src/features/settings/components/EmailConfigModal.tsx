import { useState, useEffect } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { fetchAppConfig, updateAppConfig, EmailConfig } from '../api';
import { showSuccessToast, showErrorToast } from '../../../shared/state/toastStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const CONFIG_KEY = 'email_notifications';

export const EmailConfigModal = ({ isOpen, onClose }: Props) => {
    const [config, setConfig] = useState<EmailConfig>({ to: [], cc: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Input states
    const [toInput, setToInput] = useState('');
    const [ccInput, setCcInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadConfig();
        }
    }, [isOpen]);

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAppConfig<EmailConfig>(CONFIG_KEY);
            if (data) {
                setConfig(data);
            } else {
                // Default fallback if not found
                setConfig({ to: ['isaac.avila@transdev.cl'], cc: [] });
            }
        } catch (err) {
            console.error('Error loading config:', err);
            showErrorToast('Error', 'No se pudo cargar la configuración');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateAppConfig(CONFIG_KEY, config, 'Configuración de destinatarios para notificaciones');
            showSuccessToast('Configuración guardada', 'Los correos se enviarán a los nuevos destinatarios');
            onClose();
        } catch (err) {
            console.error('Error saving config:', err);
            showErrorToast('Error', 'No se pudo guardar la configuración');
        } finally {
            setIsSaving(false);
        }
    };

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const addEmail = (type: 'to' | 'cc') => {
        const input = type === 'to' ? toInput : ccInput;
        const setInput = type === 'to' ? setToInput : setCcInput;

        const email = input.trim();
        if (!email) return;

        if (!isValidEmail(email)) {
            showErrorToast('Email inválido', 'Por favor ingresa un correo electrónico válido');
            return;
        }

        if (config[type].includes(email)) {
            showErrorToast('Email duplicado', 'Este correo ya está en la lista');
            return;
        }

        setConfig(prev => ({
            ...prev,
            [type]: [...prev[type], email]
        }));
        setInput('');
    };

    const removeEmail = (type: 'to' | 'cc', emailToRemove: string) => {
        setConfig(prev => ({
            ...prev,
            [type]: prev[type].filter(e => e !== emailToRemove)
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent, type: 'to' | 'cc') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEmail(type);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg card p-6 animate-scale-in">
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-100 p-2 rounded-lg text-brand-600">
                            <Icon name="settings" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Configuración de Correos</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <Icon name="x" size={24} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* Destinatarios (TO) */}
                        <div>
                            <label className="label mb-2 flex justify-between">
                                <span>Destinatarios Principales (Para)</span>
                                <span className="text-xs font-normal text-slate-500">Reciben el correo directamente</span>
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="email"
                                    className="input flex-1"
                                    placeholder="ejemplo@transdev.cl"
                                    value={toInput}
                                    onChange={(e) => setToInput(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, 'to')}
                                />
                                <button
                                    type="button"
                                    onClick={() => addEmail('to')}
                                    className="btn btn-secondary px-3"
                                    disabled={!toInput.trim()}
                                >
                                    <Icon name="plus" size={18} />
                                </button>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 min-h-[60px] border border-slate-200 flex flex-wrap gap-2">
                                {config.to.length === 0 && (
                                    <span className="text-sm text-slate-400 italic self-center w-full text-center">Sin destinatarios</span>
                                )}
                                {config.to.map((email) => (
                                    <span key={email} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 shadow-sm">
                                        {email}
                                        <button onClick={() => removeEmail('to', email)} className="text-slate-400 hover:text-danger-500 ml-1">
                                            <Icon name="x" size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Copia (CC) */}
                        <div>
                            <label className="label mb-2 flex justify-between">
                                <span>En Copia (CC)</span>
                                <span className="text-xs font-normal text-slate-500">Reciben una copia</span>
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="email"
                                    className="input flex-1"
                                    placeholder="jefe@transdev.cl"
                                    value={ccInput}
                                    onChange={(e) => setCcInput(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, 'cc')}
                                />
                                <button
                                    type="button"
                                    onClick={() => addEmail('cc')}
                                    className="btn btn-secondary px-3"
                                    disabled={!ccInput.trim()}
                                >
                                    <Icon name="plus" size={18} />
                                </button>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 min-h-[60px] border border-slate-200 flex flex-wrap gap-2">
                                {config.cc.length === 0 && (
                                    <span className="text-sm text-slate-400 italic self-center w-full text-center">Sin copias</span>
                                )}
                                {config.cc.map((email) => (
                                    <span key={email} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 shadow-sm">
                                        {email}
                                        <button onClick={() => removeEmail('cc', email)} className="text-slate-400 hover:text-danger-500 ml-1">
                                            <Icon name="x" size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                            <button onClick={onClose} className="btn btn-secondary" disabled={isSaving}>Cancelar</button>
                            <button onClick={handleSave} className="btn btn-primary min-w-[120px]" disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
