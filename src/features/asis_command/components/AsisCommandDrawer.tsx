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

                        {/* Smart Suggestions based on parsing gap */}
                        {parsed && !parsed.isValid && (
                            <div className="animate-fade-in-up">
                                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                                    {!parsed.startDate && (
                                        <>
                                            <span className="text-xs text-slate-400 py-1">Sugerencias:</span>
                                            <button onClick={() => setInput(prev => `${prev} hoy`)} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors">Hoy</button>
                                            <button onClick={() => setInput(prev => `${prev} mañana`)} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors">Mañana</button>
                                            <button onClick={() => setInput(prev => `${prev} el lunes`)} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors">El lunes</button>
                                        </>
                                    )}
                                    {parsed.startDate && !parsed.durationDays && !parsed.endDate && ['VACACIONES', 'LICENCIA'].includes(parsed.intent) && (
                                        <>
                                            <button onClick={() => setInput(prev => `${prev} por 1 día`)} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors">1 día</button>
                                            <button onClick={() => setInput(prev => `${prev} por 5 días`)} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors">5 días</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    {preview && parsed && parsed.intent !== 'UNKNOWN' && (
                        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 animate-slide-up">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <h3 className="font-medium text-slate-800 flex items-center gap-2">
                                    <Icon name="file-text" className="w-4 h-4 text-indigo-500" />
                                    Vista previa
                                </h3>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-300 ${preview.canExecute ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                    {preview.canExecute ? 'Listo para ejecutar' : 'Faltan datos'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mt-2">
                                <div className="col-span-2 sm:col-span-1">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Acción</span>
                                    <div className="font-medium text-slate-800 bg-slate-50 px-2 py-1 rounded inline-block">
                                        {INTENT_LABELS[parsed.intent]}
                                    </div>
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">RUT</span>
                                    <div className="font-mono text-slate-700">
                                        {parsed.rutNormalized ? formatRut(parsed.rutNormalized) : <span className="text-slate-300">-</span>}
                                    </div>
                                </div>

                                {person ? (
                                    <>
                                        <div className="col-span-2 bg-indigo-50/50 p-2 rounded-lg border border-indigo-50 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {person.nombre.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800 text-sm">{person.nombre}</div>
                                                <div className="text-xs text-indigo-600 font-medium">{person.cargo}</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    loadingPerson && (
                                        <div className="col-span-2 text-slate-500 flex items-center gap-2 py-2 animate-pulse">
                                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-indigo-500 animate-spin"></div>
                                            Buscando persona...
                                        </div>
                                    )
                                )}

                                {preview.personNotFound && (
                                    <div className="col-span-2 p-2 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                                        <Icon name="user-x" className="w-4 h-4" />
                                        No encontramos a esta persona en la base de datos.
                                    </div>
                                )}

                                <div className="col-span-2 grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Desde</span>
                                        <div className="text-slate-800">{parsed.startDate || <span className="text-slate-300">-</span>}</div>
                                        {parsed.startTime && <div className="text-xs text-slate-500 mt-0.5">{parsed.startTime}</div>}
                                    </div>

                                    <div>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Hasta</span>
                                        <div className="text-slate-800">{parsed.endDate || <span className="text-slate-300">-</span>}</div>
                                        {parsed.endTime && <div className="text-xs text-slate-500 mt-0.5">{parsed.endTime}</div>}
                                    </div>
                                </div>

                                {parsed.durationDays && (
                                    <div className="col-span-2 pt-1">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                            <Icon name="clock" className="w-3 h-3" />
                                            Duración: {parsed.durationDays} días
                                        </div>
                                    </div>
                                )}
                            </div>

                            {parsed.errors.length > 0 && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg space-y-1">
                                    {parsed.errors.map((e, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-red-700 font-medium">
                                            <Icon name="x-circle" className="w-3.5 h-3.5" />
                                            {e}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {preview.warnings.length > 0 && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg space-y-1">
                                    {preview.warnings.map((w, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs text-amber-700 font-medium">
                                            <Icon name="alert-triangle" className="w-3.5 h-3.5" />
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
                                        w-full py-3 rounded-xl font-semibold shadow-sm transition-all duration-200 transform active:scale-[0.98]
                                        ${preview.canExecute
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }
                                        flex items-center justify-center gap-2 mt-4
                                    `}
                                >
                                    {executeCommand.isPending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            Ejecutar Comando <Icon name="chevron-right" className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}

                            {showPreview && (
                                <div className="flex gap-3 mt-4 animate-fade-in">
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 py-3 rounded-xl font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={executeCommand.isPending}
                                        className="flex-1 py-3 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {executeCommand.isPending ? 'Guardando...' : 'Confirmar Todo'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* History */}
                    {logs.length > 0 && !parsed && (
                        <div className="animate-fade-in delay-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                                Historial reciente
                            </h3>
                            <div className="space-y-2">
                                {logs.slice(0, 8).map((log) => (
                                    <div
                                        key={log.id}
                                        className="group p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all duration-200"
                                        onClick={() => setInput(log.command_text)}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-slate-700 group-hover:text-indigo-700 transition-colors">
                                                {log.parsed_intent ? INTENT_LABELS[log.parsed_intent as keyof typeof INTENT_LABELS] : 'Comando'}
                                            </span>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${log.status === 'OK' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                {log.status === 'OK' ? 'EXITOSO' : 'FALLIDO'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 truncate font-mono bg-slate-50 p-1.5 rounded group-hover:bg-indigo-50/50 transition-colors">
                                            {log.command_text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-slate-50/80 backdrop-blur-sm text-center">
                    <p className="text-[10px] text-slate-400 font-medium">
                        Asis Command AI v1.0 • Escribe en lenguaje natural
                    </p>
                </div>
            </div>
        </>
    );
};
