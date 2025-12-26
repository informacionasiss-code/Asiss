import { useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';

interface CancelMeetingModalProps {
    meetingTitle: string;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
    isLoading: boolean;
}

export const CancelMeetingModal = ({ meetingTitle, onConfirm, onCancel, isLoading }: CancelMeetingModalProps) => {
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-scale-in">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-100 rounded-full">
                        <Icon name="alert-triangle" size={24} className="text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Cancelar Reunión</h3>
                        <p className="text-sm text-slate-500">{meetingTitle}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="label">Motivo de cancelación</label>
                    <textarea
                        className="input min-h-[100px] resize-none"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Indique el motivo por el cual se cancela esta reunión..."
                        required
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onCancel} className="btn btn-secondary">
                        Volver
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={!reason.trim() || isLoading}
                        className="btn bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
                    </button>
                </div>
            </div>
        </div>
    );
};
