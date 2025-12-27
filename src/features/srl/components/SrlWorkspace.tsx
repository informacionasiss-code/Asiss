import { Icon } from '../../../shared/components/common/Icon';
import { RequestForm } from './RequestForm';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    requestId: string | null; // null = New Request
}

export const SrlWorkspace = ({ isOpen, onClose, requestId }: Props) => {
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <div
                className={`
                    fixed inset-y-0 right-0 z-50 w-full md:w-[800px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {requestId ? 'Detalle Solicitud' : 'Nueva Solicitud SRL'}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {requestId ? `ID: ${requestId}` : 'Complete el formulario para enviar una solicitud'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <Icon name="x" size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <RequestForm requestId={requestId} onSuccess={onClose} />
                    </div>
                </div>
            </div>
        </>
    );
};
