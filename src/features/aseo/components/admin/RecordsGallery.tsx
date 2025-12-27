import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '../../../../shared/components/common/Icon';
import * as aseoApi from '../api/aseoApi';

export const RecordsGallery = () => {
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [filters, setFilters] = useState({
        cleaner: '',
        terminal: '',
        type: '',
        startDate: '',
        endDate: '',
        busPpu: '',
    });

    const { data: records = [], isLoading } = useQuery({
        queryKey: ['aseo', 'records', filters],
        queryFn: () => aseoApi.fetchRecords({ limit: 500 }),
    });

    const { data: cleaners = [] } = useQuery({
        queryKey: ['aseo', 'cleaners'],
        queryFn: aseoApi.fetchCleaners,
    });

    const filteredRecords = records.filter((r) => {
        if (filters.cleaner && r.cleaner_name !== filters.cleaner) return false;
        if (filters.terminal && r.terminal_code !== filters.terminal) return false;
        if (filters.type && r.cleaning_type !== filters.type) return false;
        if (filters.busPpu && !r.bus_ppu.toLowerCase().includes(filters.busPpu.toLowerCase())) return false;
        if (filters.startDate && r.created_at < filters.startDate) return false;
        if (filters.endDate && r.created_at > filters.endDate + 'T23:59:59') return false;
        return true;
    });

    const terminals = [...new Set(records.map(r => r.terminal_code))];
    const types = ['BARRIDO', 'BARRIDO_Y_TRAPEADO', 'FULL'];

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Icon name="filter" size={20} className="text-white" />
                    </div>
                    Filtros Avanzados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Limpiador</label>
                        <select
                            value={filters.cleaner}
                            onChange={(e) => setFilters({ ...filters, cleaner: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 font-medium"
                        >
                            <option value="">Todos</option>
                            {cleaners.map((c) => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Terminal</label>
                        <select
                            value={filters.terminal}
                            onChange={(e) => setFilters({ ...filters, terminal: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 font-medium"
                        >
                            <option value="">Todos</option>
                            {terminals.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo</label>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 font-medium"
                        >
                            <option value="">Todos</option>
                            {types.map((t) => (
                                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">PPU Bus</label>
                        <input
                            type="text"
                            placeholder="Ej: ABCD12"
                            value={filters.busPpu}
                            onChange={(e) => setFilters({ ...filters, busPpu: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Desde</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hasta</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 font-medium"
                        />
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-600">
                        Mostrando <span className="text-indigo-600 font-black">{filteredRecords.length}</span> de {records.length} registros
                    </div>
                    <button
                        onClick={() => setFilters({ cleaner: '', terminal: '', type: '', startDate: '', endDate: '', busPpu: '' })}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {/* Gallery Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Icon name="loader" size={40} className="animate-spin text-indigo-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {filteredRecords.map((record) => (
                        <div
                            key={record.id}
                            onClick={() => setSelectedRecord(record)}
                            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-slate-200 hover:scale-105"
                        >
                            <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                                <img
                                    src={record.photo_url}
                                    alt={`Limpieza ${record.bus_ppu}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    {record.graffiti_removed && (
                                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                                            GRAFFITI
                                        </span>
                                    )}
                                    {record.stickers_removed && (
                                        <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full shadow-lg">
                                            STICKERS
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-black text-slate-900">{record.bus_ppu}</span>
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg">
                                        {record.terminal_code}
                                    </span>
                                </div>
                                <div className="text-sm font-semibold text-slate-600 mb-2">{record.cleaner_name}</div>
                                <div className="text-xs font-medium text-slate-500 mb-3">
                                    {new Date(record.created_at).toLocaleString('es-CL')}
                                </div>
                                <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-center">
                                    <div className="text-xs font-bold text-indigo-700">{record.cleaning_type.replace(/_/g, ' ')}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-slate-900">Detalle del Registro</h3>
                                <button
                                    onClick={() => setSelectedRecord(null)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                                >
                                    <Icon name="x" size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                            <img
                                src={selectedRecord.photo_url}
                                alt={`Limpieza ${selectedRecord.bus_ppu}`}
                                className="w-full rounded-2xl shadow-lg mb-6"
                            />
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="text-xs font-semibold text-slate-500 mb-1">PPU BUS</div>
                                    <div className="text-xl font-black text-slate-900">{selectedRecord.bus_ppu}</div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="text-xs font-semibold text-slate-500 mb-1">TERMINAL</div>
                                    <div className="text-xl font-black text-slate-900">{selectedRecord.terminal_code}</div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="text-xs font-semibold text-slate-500 mb-1">LIMPIADOR</div>
                                    <div className="text-xl font-black text-slate-900">{selectedRecord.cleaner_name}</div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="text-xs font-semibold text-slate-500 mb-1">TIPO</div>
                                    <div className="text-xl font-black text-slate-900">{selectedRecord.cleaning_type.replace(/_/g, ' ')}</div>
                                </div>
                            </div>
                            <div className="bg-indigo-50 rounded-xl p-4">
                                <div className="text-xs font-semibold text-indigo-700 mb-2">EXTRAS</div>
                                <div className="flex gap-3">
                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${selectedRecord.graffiti_removed ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        Graffiti Retirado
                                    </span>
                                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${selectedRecord.stickers_removed ? 'bg-yellow-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        Stickers Retirados
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
