/**
 * OffboardingRequestModal - Request staff offboarding
 */

import { useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { StaffWithShift } from '../types';
import { BUTTON_VARIANTS } from '../utils/colors';

interface OffboardingRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: StaffWithShift | null;
    onSubmit: (reason: string) => void;
    isSubmitting?: boolean;
}

export const OffboardingRequestModal = ({
    isOpen,
    onClose,
    staff,
    onSubmit,
    isSubmitting = false,
}: OffboardingRequestModalProps) => {
    const [reason, setReason] = useState('');

    if (!isOpen || !staff) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (reason.trim()) {
            onSubmit(reason.trim());
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2 text-red-600">
                            <Icon name="user-x" size={20} />
                            <h3 className="font-semibold">Solicitar Desvinculación</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Icon name="x" size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        {/* Staff info */}
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="font-medium text-slate-800">{staff.nombre}</p>
                            <p className="text-sm text-slate-500">
                                {staff.rut} | {staff.cargo} | {staff.terminal_code}
                            </p>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Motivo de la desvinculación *
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Describa detalladamente el motivo de la solicitud..."
                                className="w-full p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                rows={4}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Info */}
                        <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-800 flex gap-2">
                            <Icon name="info" size={16} className="shrink-0 mt-0.5" />
                            <p>
                                Esta solicitud será enviada por correo al área de RRHH para su
                                evaluación. El trabajador seguirá activo hasta que se apruebe.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className={`flex-1 py-2 rounded-lg font-medium ${BUTTON_VARIANTS.secondary}`}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!reason.trim() || isSubmitting}
                                className={`flex-1 py-2 rounded-lg font-medium ${BUTTON_VARIANTS.danger} disabled:opacity-50`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Icon name="loader" size={16} className="inline animate-spin mr-1" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar solicitud'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
