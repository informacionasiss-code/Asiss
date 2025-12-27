import { useRef, useEffect } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { RequestForm } from './RequestForm';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    requestId: string | null;
}

export const SrlWorkspace = ({ isOpen, onClose, requestId }: Props) => {
    const panelRef = useRef<HTMLDivElement>(null);

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
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div
                ref={panelRef}
                className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300"
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
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <RequestForm requestId={requestId} onSuccess={onClose} />
                </div>
            </div>
        </div>
    );
};
