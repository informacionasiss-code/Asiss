import { useState, FormEvent } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { BackupLoan } from '../types';
import { formatRut } from '../utils/rut';

interface Props {
    isOpen: boolean;
    loan: BackupLoan | null;
    onClose: () => void;
    onSubmit: (loanId: string, reason: string) => Promise<void>;
    isLoading?: boolean;
}

export const CancelModal = ({ isOpen, loan, onClose, onSubmit, isLoading }: Props) => {
    const [reason, setReason] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!loan || !reason.trim()) return;
        await onSubmit(loan.id, reason.trim());
        setReason('');
    };

    if (!isOpen || !loan) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
                    <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Cancelar Prestamo</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800 font-medium mb-2">
                                Esta accion no se puede deshacer.
                            </p>
                            <p className="text-sm text-red-700">
                                El prestamo a {loan.person_name} (tarjeta {loan.backup_cards?.card_number}) sera cancelado
                                y la tarjeta sera liberada.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                Motivo de cancelacion (obligatorio)
                            </label>
                            <textarea
                                className="input min-h-[100px]"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Explique por que se cancela este prestamo..."
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
                                Volver
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary bg-red-600 hover:bg-red-700"
                                disabled={isLoading || !reason.trim()}
                            >
                                {isLoading ? 'Cancelando...' : 'Confirmar Cancelacion'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
