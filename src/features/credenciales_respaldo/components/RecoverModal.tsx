import { useState, FormEvent } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { BackupLoan } from '../types';
import { formatRut } from '../utils/rut';

interface Props {
    isOpen: boolean;
    loan: BackupLoan | null;
    onClose: () => void;
    onSubmit: (loanId: string, recoveredAt: string, observation?: string) => Promise<void>;
    isLoading?: boolean;
}

export const RecoverModal = ({ isOpen, loan, onClose, onSubmit, isLoading }: Props) => {
    const [recoveredAt, setRecoveredAt] = useState(new Date().toISOString().split('T')[0]);
    const [observation, setObservation] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!loan) return;
        await onSubmit(loan.id, recoveredAt, observation);
        setObservation('');
    };

    if (!isOpen || !loan) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
                    <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Marcar como Recuperada</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-sm text-slate-600">
                                <span className="font-medium">Trabajador:</span> {loan.person_name}
                            </p>
                            <p className="text-sm text-slate-600">
                                <span className="font-medium">RUT:</span> {formatRut(loan.person_rut)}
                            </p>
                            <p className="text-sm text-slate-600">
                                <span className="font-medium">Tarjeta:</span> {loan.backup_cards?.card_number}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Fecha de Devolucion</label>
                            <input
                                type="date"
                                className="input"
                                value={recoveredAt}
                                onChange={(e) => setRecoveredAt(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Observacion (opcional)</label>
                            <textarea
                                className="input min-h-[80px]"
                                value={observation}
                                onChange={(e) => setObservation(e.target.value)}
                                placeholder="Notas adicionales..."
                            />
                        </div>

                        <p className="text-sm text-slate-500">
                            Al confirmar, la tarjeta sera liberada y quedara disponible para nuevos prestamos.
                        </p>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                                {isLoading ? 'Procesando...' : 'Confirmar Devolucion'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
