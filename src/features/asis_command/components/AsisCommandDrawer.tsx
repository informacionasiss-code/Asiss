/**
 * Asis Command Drawer
 * Slide-over panel with command input, suggestions, history, and preview
 */

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useSessionStore } from '../../../shared/state/sessionStore';
import { useTerminalStore } from '../../../shared/state/terminalStore';
import {
    useCommandLogs,
    useFindPerson,
    useExecuteCommand,
    parseCommand,
    buildPreview,
} from '../hooks';
import {
    QUICK_SUGGESTIONS,
    ParsedCommand,
    CommandPreview,
    INTENT_LABELS,
} from '../types';
import { formatRut } from '../parser/extractRut';

interface AsisCommandDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AsisCommandDrawer = ({ isOpen, onClose }: AsisCommandDrawerProps) => {
    const session = useSessionStore((s) => s.session);
    const terminalCode = useTerminalStore((s) => s.context);

    const [input, setInput] = useState('');
    const [parsed, setParsed] = useState<ParsedCommand | null>(null);
    const [preview, setPreview] = useState<CommandPreview | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { data: logs = [] } = useCommandLogs(session?.supervisorName);
    const { data: person, isLoading: loadingPerson } = useFindPerson(parsed?.rutNormalized || null);
    const executeCommand = useExecuteCommand();

    // Focus input when drawer opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Parse input on change
    useEffect(() => {
        if (input.trim().length > 5) {
            const result = parseCommand(input);
            setParsed(result);
        } else {
            setParsed(null);
            setPreview(null);
        }
    }, [input]);

    // Build preview when person is resolved
    useEffect(() => {
        if (parsed) {
            const previewData = buildPreview(parsed, person || null);
            setPreview(previewData);
        }
    }, [parsed, person]);

    const handleSuggestionClick = (template: string) => {
        setInput(template);
        inputRef.current?.focus();
    };

    const handleSubmit = () => {
        if (!preview?.canExecute || !person || !session) return;

        setShowPreview(true);
    };

    const handleConfirm = async () => {
        if (!parsed || !person || !session) return;

        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            await executeCommand.mutateAsync({
                parsed,
                person,
                executedBy: session.supervisorName,
                terminalCode: String(terminalCode ?? ''),
            });

            setSuccessMessage(`${INTENT_LABELS[parsed.intent]} registrado correctamente para ${person.nombre}`);
            setInput('');
            setParsed(null);
            setPreview(null);
            setShowPreview(false);

            // Auto-hide success message
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Error al ejecutar comando');
        }
    };

    const handleCancel = () => {
        setShowPreview(false);
        setErrorMessage(null);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 bg-black/30 z-40
                    transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`
                    fixed top-0 right-0 h-full z-50
                    w-full sm:w-[400px] max-w-full
                    bg-white shadow-2xl
                    transform transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                    flex flex-col
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                    <div className="flex items-center gap-2">
                        <Icon name="settings" className="w-5 h-5 text-slate-700" />
                        <h2 className="text-lg font-semibold text-slate-800">Asis Command</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Success/Error Messages */}
                    {successMessage && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-start gap-2">
                            <Icon name="check-circle" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-2">
                            <Icon name="alert-circle" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Quick Suggestions */}
                    <div>
                        <h3 className="text-xs font-medium text-slate-500 uppercase mb-2">Acciones rápidas</h3>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_SUGGESTIONS.map((s) => (
                                <button
                                    key={s.label}
                                    onClick={() => handleSuggestionClick(s.template)}
                                    className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">
                            Escribe tu comando
                        </label>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ej: vacaciones para 18866264-1 desde el lunes por 5 días"
                            className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                            rows={3}
                        />
                    </div>

                    {/* Preview */}
                    {preview && parsed && parsed.intent !== 'UNKNOWN' && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-slate-800">Vista previa</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${preview.canExecute ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {preview.canExecute ? 'Listo' : 'Incompleto'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-slate-500">Acción:</span>
                                    <div className="font-medium">{INTENT_LABELS[parsed.intent]}</div>
                                </div>

                                <div>
                                    <span className="text-slate-500">RUT:</span>
                                    <div className="font-medium font-mono">
                                        {parsed.rutNormalized ? formatRut(parsed.rutNormalized) : '-'}
                                    </div>
                                </div>

                                {person && (
                                    <>
                                        <div>
                                            <span className="text-slate-500">Persona:</span>
                                            <div className="font-medium">{person.nombre}</div>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Cargo:</span>
                                            <div className="font-medium">{person.cargo}</div>
                                        </div>
                                    </>
                                )}

                                {preview.personNotFound && (
                                    <div className="col-span-2 text-amber-600 flex items-center gap-1">
                                        <Icon name="alert-triangle" className="w-4 h-4" />
                                        Persona no encontrada en el sistema
                                    </div>
                                )}

                                {loadingPerson && (
                                    <div className="col-span-2 text-slate-500 flex items-center gap-1">
                                        <Icon name="loader" className="w-4 h-4 animate-spin" />
                                        Buscando persona...
                                    </div>
                                )}

                                <div>
                                    <span className="text-slate-500">Desde:</span>
                                    <div className="font-medium">{parsed.startDate || '-'}</div>
                                </div>

                                <div>
                                    <span className="text-slate-500">Hasta:</span>
                                    <div className="font-medium">{parsed.endDate || '-'}</div>
                                </div>

                                {parsed.durationDays && (
                                    <div className="col-span-2">
                                        <span className="text-slate-500">Duración:</span>
                                        <span className="font-medium ml-1">{parsed.durationDays} días</span>
                                    </div>
                                )}

                                {preview.targetTable && (
                                    <div className="col-span-2 text-xs text-slate-400">
                                        Tabla: {preview.targetTable}
                                    </div>
                                )}
                            </div>

                            {parsed.errors.length > 0 && (
                                <div className="text-sm text-red-600 space-y-1">
                                    {parsed.errors.map((e, i) => (
                                        <div key={i} className="flex items-center gap-1">
                                            <Icon name="x-circle" className="w-4 h-4" />
                                            {e}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {preview.warnings.length > 0 && (
                                <div className="text-sm text-amber-600 space-y-1">
                                    {preview.warnings.map((w, i) => (
                                        <div key={i} className="flex items-center gap-1">
                                            <Icon name="alert-triangle" className="w-4 h-4" />
                                            {w}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons */}
                            {!showPreview && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!preview.canExecute || executeCommand.isPending}
                                    className={`
                                        w-full py-2.5 rounded-lg font-medium transition-colors
                                        ${preview.canExecute
                                            ? 'bg-slate-800 text-white hover:bg-slate-700'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {executeCommand.isPending ? 'Ejecutando...' : 'Ejecutar Comando'}
                                </button>
                            )}

                            {showPreview && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 py-2.5 rounded-lg font-medium border border-slate-300 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={executeCommand.isPending}
                                        className="flex-1 py-2.5 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                    >
                                        {executeCommand.isPending ? 'Confirmando...' : 'Confirmar'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* History */}
                    {logs.length > 0 && (
                        <div>
                            <h3 className="text-xs font-medium text-slate-500 uppercase mb-2">
                                Historial reciente
                            </h3>
                            <div className="space-y-2">
                                {logs.slice(0, 10).map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-2 bg-slate-50 rounded-lg text-sm cursor-pointer hover:bg-slate-100 transition-colors"
                                        onClick={() => setInput(log.command_text)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-700">
                                                {log.parsed_intent ? INTENT_LABELS[log.parsed_intent as keyof typeof INTENT_LABELS] : 'Comando'}
                                            </span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${log.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 truncate mt-1">
                                            {log.command_text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-slate-50 text-center">
                    <p className="text-xs text-slate-400">
                        Escribe comandos en español. Confirmación requerida antes de ejecutar.
                    </p>
                </div>
            </div>
        </>
    );
};
