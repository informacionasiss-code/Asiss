import { useState, useMemo } from 'react';
import { PageHeader } from '../../../shared/components/common/PageHeader';
import { DataTable, TableColumn } from '../../../shared/components/common/DataTable';
import { LoadingState } from '../../../shared/components/common/LoadingState';
import { ErrorState } from '../../../shared/components/common/ErrorState';
import { EmptyState } from '../../../shared/components/common/EmptyState';
import { ExportMenu } from '../../../shared/components/common/ExportMenu';
import { useTerminalStore } from '../../../shared/state/terminalStore';
import { exportToXlsx } from '../../../shared/utils/exportToXlsx';
import { displayTerminal } from '../../../shared/utils/terminal';
import { formatDate } from '../../../shared/utils/dates';
import { MiniCheckFilters as FiltersComponent } from '../components/MiniCheckFilters';
import { MiniCheckKpis, KpiItem } from '../components/MiniCheckKpis';
import { usePublicidad } from '../hooks/useMiniCheck';
import { Publicidad, MiniCheckFilters } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Icon } from '../../../shared/components/common/Icon';

export const MiniCheckPublicidadPage = () => {
    const terminalContext = useTerminalStore((state) => state.context);
    const setTerminalContext = useTerminalStore((state) => state.setContext);

    // Filter State
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const queryFilters: MiniCheckFilters = useMemo(() => ({
        terminalContext,
        search,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    }), [terminalContext, search, dateFrom, dateTo]);

    // Data Fetch
    const { data, isLoading, isError, refetch } = usePublicidad(queryFilters);

    // Derived KPIs
    const kpis: KpiItem[] = useMemo(() => {
        if (!data) return [];
        const total = data.length;
        const conDanio = data.filter(d => d.danio).length;
        const conResiduos = data.filter(d => d.residuos).length;
        const sinPublicidad = data.filter(d => !d.tiene).length;

        return [
            { label: 'Total Registros', value: total, icon: 'clipboard' },
            { label: 'Con Daño', value: conDanio, icon: 'alert-triangle', colorClass: 'bg-red-50 text-red-600' },
            { label: 'Con Residuos', value: conResiduos, icon: 'trash', colorClass: 'bg-orange-50 text-orange-600' },
            { label: 'Sin Publicidad', value: sinPublicidad, icon: 'x-circle', colorClass: 'bg-gray-50 text-gray-600' },
        ];
    }, [data]);

    // Chart Data
    const chartData = useMemo(() => {
        if (!data) return [];
        const danio = data.filter(d => d.danio).length;
        const residuos = data.filter(d => d.residuos).length;
        const sinPub = data.filter(d => !d.tiene).length;

        return [
            { name: 'Con Daño', value: danio, color: '#ef4444' },
            { name: 'Con Residuos', value: residuos, color: '#f97316' },
            { name: 'Sin Pub.', value: sinPub, color: '#64748b' },
        ];
    }, [data]);

    // Columns
    const columns: TableColumn<Publicidad>[] = [
        { key: 'bus_ppu', header: 'PPU', value: (row) => row.bus_ppu },
        { key: 'terminal', header: 'Terminal', render: (row) => displayTerminal(row.terminal as any), value: (row) => row.terminal },
        {
            key: 'tiene',
            header: 'Tiene',
            render: (row) => row.tiene ? <span className="text-green-600 font-bold">SÍ</span> : <span className="text-gray-400">NO</span>,
            value: (row) => row.tiene ? 'SI' : 'NO'
        },
        {
            key: 'danio',
            header: 'Daño',
            render: (row) => row.danio ? <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-bold">SÍ</span> : <span className="text-gray-400">-</span>,
            value: (row) => row.danio ? 'SI' : 'NO'
        },
        {
            key: 'residuos',
            header: 'Residuos',
            render: (row) => row.residuos ? <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-xs font-bold">SÍ</span> : <span className="text-gray-400">-</span>,
            value: (row) => row.residuos ? 'SI' : 'NO'
        },
        { key: 'nombre_publicidad', header: 'Nombre', value: (row) => row.nombre_publicidad || '-' },
        { key: 'updated_at', header: 'Actualizado', render: (row) => formatDate(row.updated_at), value: (row) => formatDate(row.updated_at) },
    ];

    const exportColumns = columns.map(c => ({ header: c.header, key: c.key, value: c.value }));

    const handleExport = () => {
        if (!data) return;
        exportToXlsx({
            filename: `minicheck_publicidad_${new Date().toISOString().split('T')[0]}`,
            sheetName: 'Publicidad',
            rows: data,
            columns: exportColumns
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Control Publicidad"
                description="Estado de publicidad en buses"
                actions={
                    <div className="flex gap-2">
                        <ExportMenu onExportView={handleExport} onExportAll={handleExport} />
                    </div>
                }
            />

            <FiltersComponent
                terminalContext={terminalContext}
                onTerminalChange={setTerminalContext}
                search={search}
                onSearchChange={setSearch}
                dateFrom={dateFrom}
                onDateFromChange={setDateFrom}
                dateTo={dateTo}
                onDateToChange={setDateTo}
            />

            {isLoading && <LoadingState label="Cargando publicidad..." />}
            {isError && <ErrorState message="No se pudieron cargar los datos." onRetry={refetch} />}

            {!isLoading && !isError && (
                <>
                    <MiniCheckKpis items={kpis} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-1 h-80">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Problemas Detectados</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" name="Cantidad" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="lg:col-span-2">
                            {data && data.length > 0 ? (
                                <DataTable columns={columns} rows={data} />
                            ) : (
                                <EmptyState label="Sin registros" description="No se encontraron datos." />
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
