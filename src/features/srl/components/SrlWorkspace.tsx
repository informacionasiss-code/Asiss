import { useRef, useEffect, useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { RequestForm } from './RequestForm';
import { TechnicianPanel } from './TechnicianPanel';
import { useSrlRequests } from '../hooks';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    requestId: string | null;
}

export const SrlWorkspace = ({ isOpen, onClose, requestId }: Props) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [showTechPanel, setShowTechPanel] = useState(false);

    // Fetch request data if in edit mode
    const { data: requests } = useSrlRequests(requestId ? { id: requestId, terminal: 'ALL', status: 'TODOS', criticality: 'TODAS', search: '' } : undefined);
    const requestData = requests?.[0];

    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex justify-end overflow-hidden" role="dialog" aria-modal="true">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                    onClick={onClose}
                ></div>

                {/* Panel */}
                <div
                    ref={panelRef}
                    className="relative w-full max-w-3xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur z-10 sticky top-0">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {requestId ? 'Detalle de Solicitud' : 'Nueva Solicitud SRL'}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {requestId ? `ID: #${requestId.substring(0, 8)}` : 'Complete los datos para generar un ticket'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <Icon name="x" size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                        <RequestForm requestId={requestId} onSuccess={onClose} />

                        {/* Show TechnicianPanel Button ONLY when viewing existing request */}
                        {requestId && requestData && (
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
                                            <Icon name="wrench" size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Gestión Técnica</h3>
                                            <p className="text-xs text-slate-500">Actualizar estado de revisión</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${requestData.status === 'EN_REVISION' ? 'bg-amber-100 text-amber-700' :
                                        requestData.status === 'REPARADA' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {requestData.status}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowTechPanel(true)}
                                    className="w-full px-6 py-3.5 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white font-bold rounded-xl shadow-lg shadow-slate-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    <Icon name="wrench" size={20} />
                                    Abrir Panel de Técnico
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TechnicianPanel Modal */}
            {requestId && requestData && (
                <TechnicianPanel
                    isOpen={showTechPanel}
                    onClose={() => setShowTechPanel(false)}
                    requestId={requestId}
                    currentStatus={requestData.status}
                    technicianName={requestData.technician_name || undefined}
                    technicianMessage={requestData.technician_message || undefined}
                    technicianVisitAt={requestData.technician_visit_at || undefined}
                    result={requestData.result as any}
                    nextVisitAt={requestData.next_visit_at || undefined}
                />
            )}
        </>
    );
};
