import { useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useFetchAseoRecords } from '../hooks';
import type { AseoRecord } from '../types';

interface Props {
    cleanerId: string;
}

const CLEANING_TYPE_LABELS: Record<string, string> = {
    'BARRIDO': 'Barrido',
    'BARRIDO_Y_TRAPEADO': 'Barrido + Trapeado',
    'FULL': 'Aseo Completo'
};

export const MyRecords = ({ cleanerId }: Props) => {
    const { data: records = [], isLoading } = useFetchAseoRecords(cleanerId);
    const [selectedRecord, setSelectedRecord] = useState<AseoRecord | null>(null);

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Icon name="loader" size={32} className="text-blue-600 mx-auto mb-2 animate-spin" />
                <p className="text-slate-600">Cargando registros...</p>
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Icon name="inbox" size={48} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-semibold">No tienes registros aún</p>
                <p className="text-sm text-slate-400 mt-1">Comienza registrando un aseo</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Mis Registros</h2>

                {records.map(record => (
                    <div
                        key={record.id}
                        onClick={() => setSelectedRecord(record)}
                        className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start gap-3">
                            <img
                                src={record.photo_url}
                                alt="Foto"
                                className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-900">{record.bus_ppu}</h3>
                                <p className="text-sm text-slate-600">{CLEANING_TYPE_LABELS[record.cleaning_type]}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {new Date(record.created_at).toLocaleString('es-CL', {
                                        dateStyle: 'short',
                                        timeStyle: 'short'
                                    })}
                                </p>
                            </div>
                            <Icon name="chevron-right" size={20} className="text-slate-400" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelectedRecord(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="relative">
                            <img
                                src={selectedRecord.photo_url}
                                alt="Foto"
                                className="w-full h-64 object-cover rounded-t-2xl"
                            />
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
                            >
                                <Icon name="x" size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">{selectedRecord.bus_ppu}</h3>
                                <p className="text-slate-600">{selectedRecord.terminal_code.replace(/_/g, ' ')}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <p className="text-xs text-blue-600 font-semibold mb-1">Tipo de Aseo</p>
                                    <p className="text-sm font-bold text-blue-900">{CLEANING_TYPE_LABELS[selectedRecord.cleaning_type]}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-slate-600 font-semibold mb-1">Fecha</p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {new Date(selectedRecord.created_at).toLocaleDateString('es-CL')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {selectedRecord.graffiti_removed && (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                                        <Icon name="check" size={14} className="inline mr-1" />
                                        Graffiti retirado
                                    </span>
                                )}
                                {selectedRecord.stickers_removed && (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                                        <Icon name="check" size={14} className="inline mr-1" />
                                        Stickers retirados
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
