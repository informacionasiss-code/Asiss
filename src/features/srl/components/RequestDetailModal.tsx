import { useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useSrlRequests, useBusImages, useUpdateSrlRequest } from '../hooks';
import { SrlStatus, SrlCriticality } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
}

export const RequestDetailModal = ({ isOpen, onClose, requestId }: Props) => {
    const { data: requests } = useSrlRequests({ id: requestId, terminal: 'ALL', status: 'TODOS', criticality: 'TODAS', search: '' });
    const request = requests?.[0];
    const updateMutation = useUpdateSrlRequest();

    const [technicianName, setTechnicianName] = useState('');
    const [technicianMessage, setTechnicianMessage] = useState('');
    const [result, setResult] = useState<'OPERATIVO' | 'NO_OPERATIVO' | ''>('');

    if (!isOpen || !request) return null;

    const getStatusColor = (status: SrlStatus) => {
        const colors = {
            CREADA: 'bg-blue-100 text-blue-700 border-blue-200',
            ENVIADA: 'bg-sky-100 text-sky-700 border-sky-200',
            PROGRAMADA: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            EN_REVISION: 'bg-amber-100 text-amber-700 border-amber-200',
            REPARADA: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            NO_REPARADA: 'bg-red-100 text-red-700 border-red-200',
            REAGENDADA: 'bg-orange-100 text-orange-700 border-orange-200',
            CERRADA: 'bg-slate-100 text-slate-700 border-slate-200',
        };
        return colors[status] || colors.CREADA;
    };

    const getCriticalityColor = (crit: SrlCriticality) => {
        const colors = {
            BAJA: 'bg-slate-100 text-slate-700',
            MEDIA: 'bg-amber-100 text-amber-700',
            ALTA: 'bg-red-500 text-white',
        };
        return colors[crit];
    };

    const handleStartReview = async () => {
        try {
            await updateMutation.mutateAsync({
                id: requestId,
                updates: { status: 'EN_REVISION', technician_name: technicianName }
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleComplete = async (newStatus: 'REPARADA' | 'NO_REPARADA') => {
        try {
            await updateMutation.mutateAsync({
                id: requestId,
                updates: {
                    status: newStatus,
                    technician_name: technicianName,
                    technician_message: technicianMessage,
                    result: result || undefined,
                    closed_at: newStatus === 'REPARADA' ? new Date().toISOString() : null
                }
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-7xl w-full my-8 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6 rounded-t-2xl">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                    <Icon name="file-text" size={24} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        Solicitud SRL #{request.id.substring(0, 8)}
                                    </h2>
                                    <p className="text-slate-300 text-sm">
                                        {request.terminal_code.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(request.status)}`}>
                                    {request.status}
                                </span>
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${getCriticalityColor(request.criticality)}`}>
                                    {request.criticality}
                                </span>
                                {request.applus && (
                                    <span className="px-4 py-1.5 rounded-full bg-purple-500 text-white text-sm font-bold">
                                        APPLUS
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                            <Icon name="x" size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 max-h-[calc(100vh-250px)] overflow-y-auto">
                    {/* Request Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InfoCard icon="calendar" label="Creación" value={new Date(request.created_at).toLocaleDateString('es-CL')} />
                        <InfoCard icon="user" label="Creado por" value={request.created_by} />
                        <InfoCard icon="clock" label="Fecha Requerida" value={request.required_date || 'No especificada'} />
                        <InfoCard icon="truck" label="Buses" value={`${request.srl_request_buses?.length || 0}`} />
                    </div>

                    {/* Buses Section */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Icon name="truck" size={20} className="text-blue-600" />
                            Flota Afectada ({request.srl_request_buses?.length || 0} Buses)
                        </h3>
                        <div className="space-y-4">
                            {request.srl_request_buses?.map((bus: any) => (
                                <BusDetailCard key={bus.id} bus={bus} />
                            ))}
                        </div>
                    </div>

                    {/* Technician Info Display (Read-Only) */}
                    {(request.status === 'REPARADA' || request.status === 'NO_REPARADA' || request.status === 'REAGENDADA' || request.status === 'CERRADA') && request.technician_name && (
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-2 border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Icon name="wrench" size={20} className="text-slate-700" />
                                Información del Técnico
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Técnico Asignado</p>
                                    <p className="text-sm font-semibold text-slate-900">{request.technician_name}</p>
                                </div>
                                {request.technician_visit_at && (
                                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Visita</p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {new Date(request.technician_visit_at).toLocaleString('es-CL', {
                                                dateStyle: 'short',
                                                timeStyle: 'short'
                                            })}
                                        </p>
                                    </div>
                                )}
                                {request.result && (
                                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Resultado</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${request.result === 'OPERATIVO'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {request.result}
                                        </span>
                                    </div>
                                )}
                                {request.closed_at && (
                                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Cierre</p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {new Date(request.closed_at).toLocaleString('es-CL', {
                                                dateStyle: 'short',
                                                timeStyle: 'short'
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {request.technician_message && (
                                <div className="mt-4 bg-white rounded-lg p-4 border border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Observaciones del Técnico</p>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{request.technician_message}</p>
                                </div>
                            )}
                            {request.technician_document_url && (
                                <div className="mt-4 bg-white rounded-lg p-4 border border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                        <Icon name="file-text" size={16} />
                                        Documento Técnico
                                    </p>
                                    <a
                                        href={request.technician_document_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block relative group"
                                    >
                                        {request.technician_document_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <div className="relative rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-all">
                                                <img
                                                    src={request.technician_document_url}
                                                    alt="Documento Técnico"
                                                    className="w-full max-w-md mx-auto object-contain group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                                    <Icon name="search" size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg border-2 border-blue-200 hover:bg-blue-100 transition-colors">
                                                <Icon name="file" size={24} className="text-blue-600" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-blue-900">Ver Documento PDF</p>
                                                    <p className="text-xs text-blue-600">Click para abrir</p>
                                                </div>
                                                <Icon name="chevron-right" size={18} className="text-blue-600" />
                                            </div>
                                        )}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Technician Panel (Editable) */}
                    {(request.status === 'EN_REVISION' || request.status === 'CREADA' || request.status === 'PROGRAMADA') && (
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Icon name="wrench" size={20} className="text-slate-700" />
                                Panel de Técnico
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input
                                    type="text"
                                    placeholder="Nombre del técnico"
                                    className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={technicianName}
                                    onChange={e => setTechnicianName(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setResult('OPERATIVO')}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-semibold border-2 transition-all ${result === 'OPERATIVO' ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-700'}`}
                                    >
                                        OPERATIVO
                                    </button>
                                    <button
                                        onClick={() => setResult('NO_OPERATIVO')}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-semibold border-2 transition-all ${result === 'NO_OPERATIVO' ? 'bg-red-500 border-red-600 text-white' : 'bg-white border-slate-300 text-slate-700'}`}
                                    >
                                        NO OPERATIVO
                                    </button>
                                </div>
                            </div>
                            <textarea
                                rows={3}
                                placeholder="Observaciones técnicas..."
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4"
                                value={technicianMessage}
                                onChange={e => setTechnicianMessage(e.target.value)}
                            />
                            <div className="flex gap-3">
                                {request.status !== 'EN_REVISION' && (
                                    <button onClick={handleStartReview} className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                        <Icon name="check" size={20} />
                                        Iniciar Revisión
                                    </button>
                                )}
                                {request.status === 'EN_REVISION' && (
                                    <>
                                        <button onClick={() => handleComplete('REPARADA')} className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                            <Icon name="check-circle" size={20} />
                                            REPARADA
                                        </button>
                                        <button onClick={() => handleComplete('NO_REPARADA')} className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                            <Icon name="x-circle" size={20} />
                                            NO REPARADA
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper Components
const InfoCard = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
            <Icon name={icon} size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
    </div>
);

const BusDetailCard = ({ bus }: { bus: any }) => {
    const { data: images = [] } = useBusImages(bus.id);

    return (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Icon name="truck" size={20} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900">{bus.bus_ppu}</h4>
                        <p className="text-sm text-slate-600">{bus.observation || bus.problem_type || 'Sin detalles'}</p>
                    </div>
                </div>
                {bus.applus && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                        <Icon name="alert-circle" size={12} />
                        APPLUS
                    </span>
                )}
            </div>

            {/* Images Gallery */}
            {images.length > 0 ? (
                <div>
                    <h5 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Icon name="image" size={16} />
                        Evidencia Fotográfica ({images.length})
                    </h5>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {images.map((img: any) => (
                            <a
                                key={img.id}
                                href={img.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-all"
                            >
                                <img
                                    src={img.publicUrl}
                                    alt="Evidencia"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                    <Icon name="search" size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                    <Icon name="image" size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Sin evidencia fotográfica</p>
                </div>
            )}
        </div>
    );
};
