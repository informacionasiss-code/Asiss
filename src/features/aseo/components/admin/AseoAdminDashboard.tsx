import { useQuery } from '@tanstack/react-query';
import { Icon } from '../../../../shared/components/common/Icon';
import * as aseoApi from '../api/aseoApi';

export const AseoAdminDashboard = () => {
    const { data: stats } = useQuery({
        queryKey: ['aseo', 'adminStats'],
        queryFn: async () => {
            const [records, cleaners, tasks] = await Promise.all([
                aseoApi.fetchRecords({ limit: 1000 }),
                aseoApi.fetchCleaners(),
                aseoApi.fetchTasks(),
            ]);

            const today = new Date().toISOString().split('T')[0];
            const thisWeek = new Date();
            thisWeek.setDate(thisWeek.getDate() - 7);
            const weekAgo = thisWeek.toISOString().split('T')[0];

            return {
                totalRecordsToday: records.filter(r => r.created_at.startsWith(today)).length,
                totalRecordsWeek: records.filter(r => r.created_at >= weekAgo).length,
                totalRecords: records.length,
                activeCleaners: cleaners.length,
                pendingTasks: tasks.filter(t => t.status === 'PENDIENTE').length,
                completedTasks: tasks.filter(t => t.status === 'TERMINADA').length,
                byTerminal: records.reduce((acc, r) => {
                    acc[r.terminal_code] = (acc[r.terminal_code] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                byType: records.reduce((acc, r) => {
                    acc[r.cleaning_type] = (acc[r.cleaning_type] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
            };
        },
        refetchInterval: 30000, // Refresh every 30s
    });

    const kpis = [
        {
            label: 'Registros Hoy',
            value: stats?.totalRecordsToday || 0,
            icon: 'calendar' as const,
            color: 'from-blue-500 to-indigo-600',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            label: 'Registros Semana',
            value: stats?.totalRecordsWeek || 0,
            icon: 'bar-chart' as const,
            color: 'from-purple-500 to-pink-600',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            label: 'Limpiadores Activos',
            value: stats?.activeCleaners || 0,
            icon: 'users' as const,
            color: 'from-emerald-500 to-teal-600',
            textColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            label: 'Tareas Pendientes',
            value: stats?.pendingTasks || 0,
            icon: 'clock' as const,
            color: 'from-amber-500 to-orange-600',
            textColor: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
        {
            label: 'Tareas Completadas',
            value: stats?.completedTasks || 0,
            icon: 'check-circle' as const,
            color: 'from-green-500 to-emerald-600',
            textColor: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            label: 'Total Registros',
            value: stats?.totalRecords || 0,
            icon: 'database' as const,
            color: 'from-slate-500 to-gray-600',
            textColor: 'text-slate-600',
            bgColor: 'bg-slate-50',
        },
    ];

    return (
        <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {kpis.map((kpi, i) => (
                    <div
                        key={i}
                        className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:scale-105"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"
                            style={{ backgroundImage: `linear-gradient(to bottom right, ${kpi.color})` }}
                        />
                        <div className="relative p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 ${kpi.bgColor} rounded-xl flex items-center justify-center shadow-sm`}>
                                    <Icon name={kpi.icon} size={24} className={kpi.textColor} />
                                </div>
                            </div>
                            <div className="text-4xl font-black text-slate-900 mb-2">{kpi.value}</div>
                            <div className="text-sm font-semibold text-slate-600">{kpi.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Terminal */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <Icon name="map-pin" size={20} className="text-white" />
                        </div>
                        Registros por Terminal
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats?.byTerminal || {}).map(([terminal, count]) => (
                            <div key={terminal} className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-slate-700">{terminal}</span>
                                        <span className="text-sm font-black text-indigo-600">{count}</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                                            style={{ width: `${(count / (stats?.totalRecords || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* By Type */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                            <Icon name="layers" size={20} className="text-white" />
                        </div>
                        Tipos de Limpieza
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats?.byType || {}).map(([type, count]) => {
                            const colors = {
                                BARRIDO: 'from-green-500 to-emerald-600',
                                'BARRIDO_Y_TRAPEADO': 'from-blue-500 to-cyan-600',
                                FULL: 'from-purple-500 to-pink-600',
                            };
                            return (
                                <div key={type} className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-slate-700">{type.replace(/_/g, ' ')}</span>
                                            <span className="text-sm font-black text-purple-600">{count}</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${colors[type as keyof typeof colors] || 'from-slate-400 to-slate-600'} rounded-full transition-all duration-500`}
                                                style={{ width: `${(count / (stats?.totalRecords || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
