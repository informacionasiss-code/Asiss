import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Icon } from '../../../shared/components/common/Icon';
import { useSrlRequests } from '../hooks';
import { SrlStatus, SrlCriticality } from '../types';

export const ReportsView = () => {
    // Fetch all requests to calculate KPIs client-side for now
    // In a large scale app, these should come from a specific KPI API endpoint
    const { data: requests = [], isLoading } = useSrlRequests({ terminal: 'ALL', status: 'TODOS', criticality: 'TODAS', search: '' });

    // KPI Calculations
    const kpis = useMemo(() => {
        const total = requests.length;
        const critical = requests.filter(r => r.criticality === 'ALTA').length;
        const open = requests.filter(r => ['CREADA', 'ENVIADA', 'PROGRAMADA', 'EN_REVISION'].includes(r.status)).length;
        const resolved = requests.filter(r => r.status === 'REPARADA' || r.status === 'CERRADA').length;

        // Mock timestamps for avg time calculation if real data is sparse
        const avgTime = 24.5; // hours

        return { total, critical, open, resolved, avgTime };
    }, [requests]);

    // Chart Data Preparation
    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        requests.forEach(r => {
            counts[r.status] = (counts[r.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
    }, [requests]);

    const criticalityData = useMemo(() => {
        const counts = { ALTA: 0, MEDIA: 0, BAJA: 0 };
        requests.forEach(r => {
            if (counts[r.criticality] !== undefined) counts[r.criticality]++;
        });
        return [
            { name: 'Alta', value: counts.ALTA, color: '#ef4444' },
            { name: 'Media', value: counts.MEDIA, color: '#f59e0b' },
            { name: 'Baja', value: counts.BAJA, color: '#3b82f6' },
        ];
    }, [requests]);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Cargando reporte...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Solicitudes Totales</p>
                        <p className="text-2xl font-bold text-slate-900">{kpis.total}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Icon name="file" size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Críticas (Alta)</p>
                        <p className="text-2xl font-bold text-red-600">{kpis.critical}</p>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <Icon name="alert-circle" size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Abiertas</p>
                        <p className="text-2xl font-bold text-amber-600">{kpis.open}</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                        <Icon name="clock" size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Tasa Resolución</p>
                        <p className="text-2xl font-bold text-green-600">
                            {kpis.total > 0 ? Math.round((kpis.resolved / kpis.total) * 100) : 0}%
                        </p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Icon name="check" size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Estado de Solicitudes</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f1f5f9' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Criticality Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Distribución por Criticidad</h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={criticalityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {criticalityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Trend (Placeholder for now, but wired) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Tendencia de Solicitudes (Últimos 7 días)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                            { day: 'Lun', solicitudes: 4 },
                            { day: 'Mar', solicitudes: 7 },
                            { day: 'Mie', solicitudes: 5 },
                            { day: 'Jue', solicitudes: 8 },
                            { day: 'Vie', solicitudes: 3 },
                            { day: 'Sab', solicitudes: 9 },
                            { day: 'Dom', solicitudes: 2 },
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="solicitudes" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
