import { PageHeader } from '../../../shared/components/common/PageHeader';
import { Icon } from '../../../shared/components/common/Icon';
import { ExportMenu } from '../../../shared/components/common/ExportMenu';
import { LoadingState } from '../../../shared/components/common/LoadingState';
import { useTaskKPIs, useTasks } from '../hooks';
import { exportToXlsx } from '../../../shared/utils/exportToXlsx';
import { Task, TaskKPIs } from '../types';

export const ReportsView = () => {
    const kpisQuery = useTaskKPIs();
    const tasksQuery = useTasks();

    const kpis = kpisQuery.data;

    const exportColumns = [
        { key: 'metric', header: 'Métrica', value: (r: { metric: string }) => r.metric },
        { key: 'value', header: 'Valor', value: (r: { value: number }) => r.value.toString() },
    ];

    const exportData = kpis ? [
        { metric: 'Pendientes', value: kpis.pending },
        { metric: 'En Curso', value: kpis.inProgress },
        { metric: 'Terminadas', value: kpis.completed },
        { metric: 'Evaluadas', value: kpis.evaluated },
        { metric: 'Rechazadas', value: kpis.rejected },
        { metric: 'Vencidas', value: kpis.overdue },
    ] : [];

    const KPICard = ({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) => (
        <div className={`card p-4 border-l-4 ${color}`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-2xl font-bold text-slate-800">{value}</div>
                    <div className="text-sm text-slate-500">{label}</div>
                </div>
                <div className="p-3 bg-slate-100 rounded-full">
                    <Icon name={icon as any} size={24} className="text-slate-600" />
                </div>
            </div>
        </div>
    );

    if (kpisQuery.isLoading) return <LoadingState label="Cargando reportes..." />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Reportes de Tareas"
                description="KPIs y métricas de rendimiento"
                actions={
                    <ExportMenu
                        onExportView={() => exportToXlsx({ filename: 'reporte_tareas', sheetName: 'KPIs', rows: exportData, columns: exportColumns })}
                        onExportAll={() => exportToXlsx({ filename: 'reporte_tareas', sheetName: 'KPIs', rows: exportData, columns: exportColumns })}
                    />
                }
            />

            {kpis && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <KPICard label="Pendientes" value={kpis.pending} icon="clock" color="border-slate-400" />
                        <KPICard label="En Curso" value={kpis.inProgress} icon="activity" color="border-blue-500" />
                        <KPICard label="Terminadas" value={kpis.completed} icon="check" color="border-amber-500" />
                        <KPICard label="Evaluadas" value={kpis.evaluated} icon="check-circle" color="border-green-500" />
                        <KPICard label="Rechazadas" value={kpis.rejected} icon="x-circle" color="border-red-500" />
                        <KPICard label="Vencidas" value={kpis.overdue} icon="alert-triangle" color="border-orange-500" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status Distribution */}
                        <div className="card p-6">
                            <h3 className="font-bold text-slate-800 mb-4">Distribución por Estado</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Pendientes', value: kpis.pending, color: 'bg-slate-400' },
                                    { label: 'En Curso', value: kpis.inProgress, color: 'bg-blue-500' },
                                    { label: 'Terminadas', value: kpis.completed, color: 'bg-amber-500' },
                                    { label: 'Evaluadas', value: kpis.evaluated, color: 'bg-green-500' },
                                    { label: 'Rechazadas', value: kpis.rejected, color: 'bg-red-500' },
                                ].map(item => {
                                    const total = kpis.pending + kpis.inProgress + kpis.completed + kpis.evaluated + kpis.rejected;
                                    const pct = total > 0 ? (item.value / total) * 100 : 0;
                                    return (
                                        <div key={item.label}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{item.label}</span>
                                                <span className="font-medium">{item.value}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="card p-6">
                            <h3 className="font-bold text-slate-800 mb-4">Resumen General</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Total de tareas</span>
                                    <span className="text-xl font-bold text-brand-600">
                                        {kpis.pending + kpis.inProgress + kpis.completed + kpis.evaluated + kpis.rejected}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Tasa de cumplimiento</span>
                                    <span className="text-xl font-bold text-green-600">
                                        {(() => {
                                            const completed = kpis.evaluated;
                                            const total = kpis.pending + kpis.inProgress + kpis.completed + kpis.evaluated;
                                            return total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%';
                                        })()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                    <span className="text-slate-600">Requieren atención</span>
                                    <span className="text-xl font-bold text-red-600">{kpis.overdue + kpis.rejected}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
