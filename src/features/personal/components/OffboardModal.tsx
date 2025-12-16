import { useState, FormEvent } from 'react';
import { Icon } from '../../../shared/components/common/Icon';

interface Props {
    staffName: string;
    onConfirm: (comment: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const OffboardModal = ({ staffName, onConfirm, onCancel, isLoading }: Props) => {
    const [comment, setComment] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (comment.trim()) {
            onConfirm(comment.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md card p-6 animate-scale-in">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-100">
                        <Icon name="logout" size={24} className="text-danger-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Desvincular Trabajador</h3>
                        <p className="text-sm text-slate-600">
                            ¿Estás seguro que deseas desvincular a <strong>{staffName}</strong>?
                        </p>
                    </div>
                </div>

                {/* Warning */}
                <div className="mb-4 p-3 rounded-lg bg-warning-50 border border-warning-200">
                    <p className="text-sm text-warning-800">
                        <strong>⚠️ Esta acción es irreversible.</strong> El trabajador quedará marcado como
                        desvinculado y no podrá ser eliminado del sistema.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="label">Motivo de Desvinculación *</label>
                        <textarea
                            className="input min-h-[100px]"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Describe el motivo de la desvinculación..."
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-secondary"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-danger"
                            disabled={isLoading || !comment.trim()}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Procesando...
                                </span>
                            ) : (
                                'Confirmar Desvinculación'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
