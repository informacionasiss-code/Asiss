import { useState } from 'react';
import { useQuery } from '@tantml:invoke name="react-query';
import { Icon } from '../../../../shared/components/common/Icon';
import * as aseoApi from '../api/aseoApi';

export const ReportsPanel = () => {
    const [filters, setFilters] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        cleaner: '',
        terminal: '',
    });

    const { data: records = [] } = useQuery({
        queryKey: ['aseo', 'records'],
        queryFn: () => aseoApi.fetchRecords({ limit: 2000 }),
    });

    const { data: cleaners = [] } = useQuery({
        queryKey: ['aseo', 'cleaners'],
        queryFn: aseoApi.fetchCleaners,
    });

    const filteredRecords = records.filter((r) => {
        const date = r.created_at.split('T')[0];
        if (date < filters.startDate || date > filters.endDate) return false;
        if (filters.cleaner && r.cleaner_name !== filters.cleaner) return false;
        if (filters.terminal && r.terminal_code !== filters.terminal) return false;
        return true;
    });

    const terminals = [...new Set(records.map(r => r.terminal_code))];

    const reportData = {
        totalRecords: filteredRecords.length,
        byType: filteredRecords.reduce((acc, r) => {
            acc[r.cleaning_type] = (acc[r.cleaning_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        byTerminal: filteredRecords.reduce((acc, r) => {
            acc[r.terminal_code] = (acc[r.terminal_code] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        byCleaner: filteredRecords.reduce((acc, r) => {
            acc[r.cleaner_name] = (acc[r.cleaner_name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        graffitiRemoved: filteredRecords.filter(r => r.graffiti_removed).length,
        stickersRemoved: filteredRecords.filter(r => r.stickers_removed).length,
    };

    const downloadPDF = () => {
        // TODO: Implement PDF export with jsPDF
        alert('Exportar a PDF - Por implementar');
    };

    const downloadExcel = () => {
        // TODO: Implement Excel export
        alert('Exportar a Excel - Por implementar');
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <Icon name="file-text" size={20} className="text-white" />
                    </div>
                    Generador de Reportes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Desde</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Hasta</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Limpiador</label>
                        <select
                            value={filters.cleaner}
                            onChange={(e) => setFilters({ ...filters, cleaner: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
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
                            className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="">Todos</option>
                            {terminals.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={downloadPDF}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
                    >
                        <Icon name="file-text" size={20} />
                        Exportar PDF
                    </button>
                    <button
                        onClick={downloadExcel}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
                    >
                        <Icon name="download" size={20} />
                        Exportar Excel
                    </button>
                </div>
            </div>

            {/* Report Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Resumen General */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <h3 className="text-lg font-black text-slate-900 mb-4">Resumen General</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold">Total Registros:</span>
                            <span className="text-2xl font-black text-indigo-600">{reportData.totalRecords}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold">Graffiti Retirados:</span>
                            <span className="text-xl font-black text-red-600">{reportData.graffitiRemoved}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold">Stickers Retirados:</span>
                            <span className="text-xl font-black text-yellow-600">{reportData.stickersRemoved}</span>
                        </div>
                    </div>
                </div>

                {/* Por Tipo */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <h3 className="text-lg font-black text-slate-900 mb-4">Por Tipo de Limpieza</h3>
                    <div className="space-y-3">
                        {Object.entries(reportData.byType).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-700">{type.replace(/_/g, ' ')}</span>
                                <span className="text-lg font-black text-purple-600">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Por Terminal */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <h3 className="text-lg font-black text-slate-900 mb-4">Por Terminal</h3>
                    <div className="space-y-3">
                        {Object.entries(reportData.byTerminal).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([terminal, count]) => (
                            <div key={terminal} className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-700">{terminal}</span>
                                <span className="text-lg font-black text-blue-600">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h3 className="text-lg font-black text-slate-900 mb-4">🏆 Top Limpiadores</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(reportData.byCleaner)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 6)
                        .map(([cleaner, count], i) => (
                            <div key={cleaner} className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-indigo-200">
                                <div className="text-3xl font-black text-indigo-600">#{i + 1}</div>
                                <div className="flex-1">
                                    <div className="font-bold text-slate-900">{cleaner}</div>
                                    <div className="text-sm text-indigo-600 font-black">{count} registros</div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};
