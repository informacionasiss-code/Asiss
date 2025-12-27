import { useQuery } from '@tanstack/react-query';
import { Icon } from '../../../../shared/components/common/Icon';
import { fetchAseoRecords, fetchAllCleaners } from '../../api/aseoApi';

export const AseoStaffAnalytics = () => {
    const { data: records = [] } = useQuery({
        queryKey: ['aseo', 'records'],
        queryFn: () => fetchAseoRecords(),
    });

    const { data: cleaners = [] } = useQuery({
        queryKey: ['aseo', 'cleaners'],
        queryFn: fetchAllCleaners,
    });

    // Calculate stats per cleaner
    const cleanerStats = cleaners.map((cleaner: any) => {
        const cleanerRecords = records.filter((r: any) => r.cleaner_id === cleaner.id);
        const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekRecords = cleanerRecords.filter((r: any) => new Date(r.created_at) >= thisWeek);

        return {
            ...cleaner,
            totalRecords: cleanerRecords.length,
            weekRecords: weekRecords.length,
            avgDaily: (cleanerRecords.length / 30).toFixed(1),
            lastActive: cleaner.last_active_at,
            typeBreakdown: cleanerRecords.reduce((acc: Record<string, number>, r: any) => {
                acc[r.cleaning_type] = (acc[r.cleaning_type] || 0) + 1;
                return acc;
            }, {}),
        };
    }).sort((a: any, b: any) => b.totalRecords - a.totalRecords);

    const getBadgeLevel = (total: number) => {
        if (total >= 100) return { label: '🏆 Experto', color: 'from-yellow-400 to-amber-500' };
        if (total >= 50) return { label: '⭐ Avanzado', color: 'from-purple-400 to-pink-500' };
        if (total >= 20) return { label: '💪 Intermedio', color: 'from-blue-400 to-indigo-500' };
        return { label: '🌟 Novato', color: 'from-green-400 to-emerald-500' };
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                        <Icon name="users" size={20} className="text-white" />
                    </div>
                    Análisis de Personal
                </h2>
                <p className="text-sm text-slate-600 mb-6">Rendimiento y estadísticas de cada limpiador</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cleanerStats.map((cleaner: any) => {
                        const badge = getBadgeLevel(cleaner.totalRecords);
                        return (
                            <div key={cleaner.id} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-indigo-300 transition-all hover:shadow-lg">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg">
                                            {cleaner.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900">{cleaner.name}</div>
                                            <div className="text-xs text-slate-500">
                                                Activo: {new Date(cleaner.lastActive).toLocaleDateString('es-CL')}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 bg-gradient-to-r ${badge.color} text-white text-xs font-bold rounded-full shadow-lg`}>
                                        {badge.label}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                                        <div className="text-2xl font-black text-indigo-600">{cleaner.totalRecords}</div>
                                        <div className="text-xs font-semibold text-slate-600">Total</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                                        <div className="text-2xl font-black text-purple-600">{cleaner.weekRecords}</div>
                                        <div className="text-xs font-semibold text-slate-600">Semana</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                                        <div className="text-2xl font-black text-blue-600">{cleaner.avgDaily}</div>
                                        <div className="text-xs font-semibold text-slate-600">Prom/Día</div>
                                    </div>
                                </div>

                                {/* Type Breakdown */}
                                <div className="bg-white rounded-xl p-3 shadow-sm">
                                    <div className="text-xs font-bold text-slate-600 mb-2">Tipos de Limpieza</div>
                                    <div className="space-y-1.5">
                                        {Object.entries(cleaner.typeBreakdown).map(([type, count]) => (
                                            <div key={type} className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-slate-700">{type.replace(/_/g, ' ')}</span>
                                                <span className="font-black text-indigo-600">{count as number}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
