import { useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useUpdateSrlRequest } from '../hooks';
import { SrlStatus } from '../types';

interface Props {
    requestId: string;
    currentStatus: SrlStatus;
    technicianName?: string;
    technicianMessage?: string;
    technicianVisitAt?: string;
    result?: 'OPERATIVO' | 'NO_OPERATIVO';
    nextVisitAt?: string;
}

export const TechnicianPanel = ({
    requestId,
    currentStatus,
    technicianName: initialTechnicianName,
    technicianMessage: initialMessage,
    technicianVisitAt: initialVisitAt,
    result: initialResult,
    nextVisitAt: initialNextVisit
}: Props) => {
    const updateMutation = useUpdateSrlRequest();

    const [technicianName, setTechnicianName] = useState(initialTechnicianName || '');
    const [technicianMessage, setTechnicianMessage] = useState(initialMessage || '');
    const [technicianVisitAt, setTechnicianVisitAt] = useState(
        initialVisitAt ? new Date(initialVisitAt).toISOString().slice(0, 16) : ''
    );
    const [result, setResult] = useState<'OPERATIVO' | 'NO_OPERATIVO' | ''>(initialResult || '');
    const [nextVisitAt, setNextVisitAt] = useState(
        initialNextVisit ? new Date(initialNextVisit).toISOString().slice(0, 16) : ''
    );

    const handleStartReview = async () => {
        try {
            await updateMutation.mutateAsync({
                id: requestId,
                updates: {
                    status: 'EN_REVISION',
                    technician_name: technicianName,
                    technician_visit_at: technicianVisitAt ? new Date(technicianVisitAt).toISOString() : null
                }
            });
            alert('Revisión iniciada correctamente');
        } catch (error) {
            console.error(error);
            alert('Error al iniciar revisión');
        }
    };

    const handleComplete = async (newStatus: 'REPARADA' | 'NO_REPARADA') => {
        if (!result) {
            alert('Debe seleccionar un resultado (Operativo/No Operativo)');
            return;
        }

        try {
            await updateMutation.mutateAsync({
                id: requestId,
                updates: {
                    status: newStatus,
                    technician_name: technicianName,
                    technician_message: technicianMessage,
                    technician_visit_at: technicianVisitAt ? new Date(technicianVisitAt).toISOString() : null,
                    result: result,
                    next_visit_at: nextVisitAt ? new Date(nextVisitAt).toISOString() : null,
                    closed_at: newStatus === 'REPARADA' ? new Date().toISOString() : null
                }
            });
            alert(`Solicitud marcada como ${newStatus}`);
        } catch (error) {
            console.error(error);
            alert('Error al completar revisión');
        }
    };

    const handleReschedule = async () => {
        if (!nextVisitAt) {
            alert('Debe seleccionar una fecha para reagendar');
            return;
        }

        try {
            await updateMutation.mutateAsync({
                id: requestId,
                updates: {
                    status: 'REAGENDADA',
                    technician_name: technicianName,
                    technician_message: technicianMessage,
                    next_visit_at: new Date(nextVisitAt).toISOString()
                }
            });
            alert('Solicitud reagendada correctamente');
        } catch (error) {
            console.error(error);
            alert('Error al reagendar');
        }
    };

    return (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
                <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                        <Icon name="wrench" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Panel de Técnico</h3>
                        <p className="text-xs text-white/80">Gestión de Revisión</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Technician Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                            Nombre del Técnico
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
                            placeholder="Juan Pérez"
                            value={technicianName}
                            onChange={e => setTechnicianName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                            Fecha/Hora de Visita
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
                            value={technicianVisitAt}
                            onChange={e => setTechnicianVisitAt(e.target.value)}
                        />
                    </div>
                </div>

                {/* Observation / Comments */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                        Observaciones del Técnico
                    </label>
                    <textarea
                        rows={4}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 resize-none"
                        placeholder="Detalle de la revisión, piezas reemplazadas, comentarios adicionales..."
                        value={technicianMessage}
                        onChange={e => setTechnicianMessage(e.target.value)}
                    />
                </div>

                {/* Result Selection */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                        Resultado de la Revisión
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setResult('OPERATIVO')}
                            className={`
                                p-4 rounded-xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2
                                ${result === 'OPERATIVO'
                                    ? 'bg-green-500 border-green-600 text-white shadow-lg scale-105'
                                    : 'bg-white border-slate-300 text-slate-600 hover:border-green-400'
                                }
                            `}
                        >
                            <Icon name="check-circle" size={20} />
                            OPERATIVO
                        </button>
                        <button
                            onClick={() => setResult('NO_OPERATIVO')}
                            className={`
                                p-4 rounded-xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2
                                ${result === 'NO_OPERATIVO'
                                    ? 'bg-red-500 border-red-600 text-white shadow-lg scale-105'
                                    : 'bg-white border-slate-300 text-slate-600 hover:border-red-400'
                                }
                            `}
                        >
                            <Icon name="x-circle" size={20} />
                            NO OPERATIVO
                        </button>
                    </div>
                </div>

                {/* Next Visit (Optional) */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                        Próxima Visita (Opcional)
                    </label>
                    <input
                        type="datetime-local"
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium"
                        value={nextVisitAt}
                        onChange={e => setNextVisitAt(e.target.value)}
                    />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                    {currentStatus === 'CREADA' || currentStatus === 'ENVIADA' || currentStatus === 'PROGRAMADA' ? (
                        <button
                            onClick={handleStartReview}
                            disabled={updateMutation.isPending}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Icon name="check" size={20} />
                            Iniciar Revisión
                        </button>
                    ) : null}

                    {currentStatus === 'EN_REVISION' ? (
                        <>
                            <button
                                onClick={() => handleComplete('REPARADA')}
                                disabled={updateMutation.isPending}
                                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Icon name="check-circle" size={20} />
                                Marcar como REPARADA
                            </button>
                            <button
                                onClick={() => handleComplete('NO_REPARADA')}
                                disabled={updateMutation.isPending}
                                className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Icon name="x-circle" size={20} />
                                Marcar como NO REPARADA
                            </button>
                            <button
                                onClick={handleReschedule}
                                disabled={updateMutation.isPending}
                                className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Icon name="clock" size={20} />
                                Reagendar Visita
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
