import { X, Calendar, CreditCard, User, Building, Clock, Mail, DollarSign } from 'lucide-react';
import { BackupLoan } from '../types';
import { formatRut } from '../utils/rut';

interface Props {
    isOpen: boolean;
    loan: BackupLoan | null;
    onClose: () => void;
}

export const LoanDetailModal = ({ isOpen, loan, onClose }: Props) => {
    if (!isOpen || !loan) return null;

    const formatDate = (date: string | null | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const daysPassed = Math.floor(
        (new Date().getTime() - new Date(loan.issued_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                        <h2 className="text-lg font-semibold text-slate-900">Detalle del Prestamo</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Worker Info */}
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <User className="w-4 h-4" />
                                Trabajador
                            </h3>
                            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Nombre:</span>
                                    <span className="text-sm font-medium text-slate-900">{loan.person_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">RUT:</span>
                                    <span className="text-sm font-medium text-slate-900">{formatRut(loan.person_rut)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Cargo:</span>
                                    <span className="text-sm text-slate-900">{loan.person_cargo || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Terminal:</span>
                                    <span className="text-sm text-slate-900">{loan.person_terminal}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Turno:</span>
                                    <span className="text-sm text-slate-900">{loan.person_turno || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Horario:</span>
                                    <span className="text-sm text-slate-900">{loan.person_horario || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Contacto:</span>
                                    <span className="text-sm text-slate-900">{loan.person_contacto || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Card Info */}
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <CreditCard className="w-4 h-4" />
                                Tarjeta de Respaldo
                            </h3>
                            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Numero:</span>
                                    <span className="text-sm font-mono font-medium text-slate-900">
                                        {loan.backup_cards?.card_number || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Terminal Inventario:</span>
                                    <span className="text-sm text-slate-900">
                                        {loan.backup_cards?.inventory_terminal || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Loan Info */}
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <Calendar className="w-4 h-4" />
                                Solicitud
                            </h3>
                            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Motivo:</span>
                                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${loan.reason === 'PERDIDA' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {loan.reason === 'PERDIDA' ? 'Perdida' : 'Deterioro'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Fecha Solicitud:</span>
                                    <span className="text-sm text-slate-900">{loan.requested_at}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Fecha Entrega:</span>
                                    <span className="text-sm text-slate-900">{formatDate(loan.issued_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Dias Transcurridos:</span>
                                    <span className={`text-sm font-medium ${daysPassed > loan.alert_after_days ? 'text-amber-600' : 'text-slate-900'
                                        }`}>
                                        {daysPassed} dias
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Estado:</span>
                                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${loan.status === 'ASIGNADA' ? 'bg-blue-100 text-blue-700' :
                                        loan.status === 'CERRADA' ? 'bg-slate-100 text-slate-700' :
                                            loan.status === 'CANCELADA' ? 'bg-red-100 text-red-700' :
                                                'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {loan.status}
                                    </span>
                                </div>
                                {loan.recovered_at && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500">Recuperada:</span>
                                        <span className="text-sm text-slate-900">{formatDate(loan.recovered_at)}</span>
                                    </div>
                                )}
                                {loan.cancel_reason && (
                                    <div className="pt-2 border-t border-slate-200">
                                        <span className="text-sm text-slate-500">Motivo Cancelacion:</span>
                                        <p className="text-sm text-slate-900 mt-1">{loan.cancel_reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Discount Info */}
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <DollarSign className="w-4 h-4" />
                                Descuento
                            </h3>
                            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Aplicado:</span>
                                    <span className={`text-sm font-medium ${loan.discount_applied ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        {loan.discount_applied ? 'Si' : 'No'}
                                    </span>
                                </div>
                                {loan.discount_applied && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500">Monto:</span>
                                        <span className="text-sm font-medium text-slate-900">
                                            ${loan.discount_amount.toLocaleString('es-CL')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audit Info */}
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <Clock className="w-4 h-4" />
                                Auditoria
                            </h3>
                            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Creado por:</span>
                                    <span className="text-sm text-slate-900">{loan.created_by_supervisor}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Creado:</span>
                                    <span className="text-sm text-slate-900">{formatDate(loan.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Correo Trabajador:</span>
                                    <span className="text-sm text-slate-900">{loan.boss_email || '-'}</span>
                                </div>
                                {loan.emails_sent_at && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500">Emails Enviados:</span>
                                        <span className="text-sm text-slate-900">{formatDate(loan.emails_sent_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
                        <button onClick={onClose} className="btn btn-secondary">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
