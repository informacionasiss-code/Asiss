import { useEffect, useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import {
    fetchSupplies,
    fetchRequestStats,
    fetchUpcomingDeliveries,
    fetchSupplyRequests,
} from '../api/suppliesApi';
import { Supply, SupplyDelivery, SupplyRequest } from '../types';
import { isDeliveryDue, formatRequestType } from '../utils/calculations';

interface DashboardStats {
    supplies: Supply[];
    requestStats: { pending: number; retrieved: number };
    upcomingDeliveries: SupplyDelivery[];
    recentRequests: SupplyRequest[];
}

export const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats>({
        supplies: [],
        requestStats: { pending: 0, retrieved: 0 },
        upcomingDeliveries: [],
        recentRequests: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [supplies, requestStats, upcomingDeliveries, recentRequests] =
                    await Promise.all([
                        fetchSupplies(),
                        fetchRequestStats(),
                        fetchUpcomingDeliveries(7),
                        fetchSupplyRequests(),
                    ]);

                setStats({
                    supplies,
                    requestStats,
                    upcomingDeliveries,
                    recentRequests: recentRequests.slice(0, 5),
                });
            } catch (error) {
                console.error('Error loading dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    const lowStockSupplies = stats.supplies.filter(
        (s) => s.min_stock > 0 && s.min_stock > 0
    );

    const dueDeliveries = stats.upcomingDeliveries.filter((d) =>
        isDeliveryDue(d.next_delivery_at, 3)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Insumos Registrados */}
                <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                            <Icon name="package" size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Insumos
                            </p>
                            <p className="text-2xl font-bold text-slate-800">
                                {stats.supplies.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Solicitudes Pendientes */}
                <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-100 text-warning-600">
                            <Icon name="clock" size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Pendientes
                            </p>
                            <p className="text-2xl font-bold text-slate-800">
                                {stats.requestStats.pending}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Solicitudes Retiradas */}
                <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-100 text-success-600">
                            <Icon name="check-circle" size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Retiradas
                            </p>
                            <p className="text-2xl font-bold text-slate-800">
                                {stats.requestStats.retrieved}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Alertas */}
                <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${dueDeliveries.length > 0
                                ? 'bg-danger-100 text-danger-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                            <Icon name="alert-triangle" size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Alertas
                            </p>
                            <p className="text-2xl font-bold text-slate-800">
                                {dueDeliveries.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Requests */}
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h3 className="font-semibold text-slate-800">Solicitudes Recientes</h3>
                        <Icon name="file-text" size={18} className="text-slate-400" />
                    </div>
                    <div className="divide-y divide-slate-100">
                        {stats.recentRequests.length === 0 ? (
                            <div className="px-5 py-8 text-center text-sm text-slate-500">
                                No hay solicitudes registradas
                            </div>
                        ) : (
                            stats.recentRequests.map((req) => (
                                <div key={req.id} className="flex items-center gap-4 px-5 py-3.5">
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${req.status === 'PENDIENTE'
                                            ? 'bg-warning-100 text-warning-600'
                                            : 'bg-success-100 text-success-600'
                                        }`}>
                                        <Icon
                                            name={req.status === 'PENDIENTE' ? 'clock' : 'check'}
                                            size={16}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">
                                            {formatRequestType(req.request_type)} - {req.terminal}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(req.requested_at).toLocaleDateString('es-CL')}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${req.status === 'PENDIENTE'
                                            ? 'bg-warning-100 text-warning-700'
                                            : 'bg-success-100 text-success-700'
                                        }`}>
                                        {req.status === 'PENDIENTE' ? 'Pendiente' : 'Retirado'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Upcoming Deliveries */}
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h3 className="font-semibold text-slate-800">Entregas Proximas</h3>
                        <Icon name="calendar" size={18} className="text-slate-400" />
                    </div>
                    <div className="divide-y divide-slate-100">
                        {stats.upcomingDeliveries.length === 0 ? (
                            <div className="px-5 py-8 text-center text-sm text-slate-500">
                                No hay entregas programadas
                            </div>
                        ) : (
                            stats.upcomingDeliveries.slice(0, 5).map((delivery) => {
                                const isDue = isDeliveryDue(delivery.next_delivery_at, 3);
                                return (
                                    <div key={delivery.id} className="flex items-center gap-4 px-5 py-3.5">
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isDue
                                                ? 'bg-danger-100 text-danger-600'
                                                : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            <Icon name="user" size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">
                                                {delivery.staff_name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {delivery.next_delivery_at
                                                    ? new Date(delivery.next_delivery_at).toLocaleDateString('es-CL')
                                                    : 'Sin fecha'}
                                            </p>
                                        </div>
                                        {isDue && (
                                            <span className="inline-flex items-center rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-medium text-danger-700">
                                                Vencida
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Supplies List */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="font-semibold text-slate-800">Catalogo de Insumos</h3>
                    <span className="text-sm text-slate-500">{stats.supplies.length} insumos</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                <th className="px-5 py-3">Nombre</th>
                                <th className="px-5 py-3">Unidad</th>
                                <th className="px-5 py-3 text-center">Vida Util</th>
                                <th className="px-5 py-3 text-center">Stock Min</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.supplies.map((supply) => (
                                <tr key={supply.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 text-sm font-medium text-slate-800">
                                        {supply.name}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-slate-600">{supply.unit}</td>
                                    <td className="px-5 py-3 text-center text-sm text-slate-600">
                                        {supply.life_days ? `${supply.life_days} dias` : '-'}
                                    </td>
                                    <td className="px-5 py-3 text-center text-sm text-slate-600">
                                        {supply.min_stock > 0 ? supply.min_stock : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
