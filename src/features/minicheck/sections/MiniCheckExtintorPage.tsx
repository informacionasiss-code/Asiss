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
import { useExtintores } from '../hooks/useMiniCheck';
import { Extintor, MiniCheckFilters } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const MiniCheckExtintorPage = () => {
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
    const { data, isLoading, isError, refetch } = useExtintores(queryFilters);

    // Derived KPIs
    const kpis: KpiItem[] = useMemo(() => {
        if (!data) return [];
        const total = data.length;
        const vencidos = data.filter(d => d.certificacion === 'VENCIDA').length;
        const sinExtintor = data.filter(d => !d.tiene).length;
        const presionBaja = data.filter(d => d.presion === 'BAJA_CARGA').length;

        return [
            { label: 'Total Registros', value: total, icon: 'clipboard' },
            { label: 'Vencidos', value: vencidos, icon: 'alert-triangle', colorClass: 'bg-red-50 text-red-600' },
            { label: 'Sin Extintor', value: sinExtintor, icon: 'x', colorClass: 'bg-orange-50 text-orange-600' },
            { label: 'Presión Baja', value: presionBaja, icon: 'activity', colorClass: 'bg-yellow-50 text-yellow-600' },
        ];
    }, [data]);

    // Chart Data
    const chartData = useMemo(() => {
        if (!data) return [];
        const vigente = data.filter(d => d.certificacion === 'VIGENTE').length;
        const vencida = data.filter(d => d.certificacion === 'VENCIDA').length;
        return [
            { name: 'VIGENTE', value: vigente, color: '#10b981' }, // Emerald-500
            { name: 'VENCIDA', value: vencida, color: '#ef4444' }, // Red-500
        ];
    }, [data]);

    // Columns
    const columns: TableColumn<Extintor>[] = [
        { key: 'bus_ppu', header: 'PPU', value: (row) => row.bus_ppu },
        { key: 'terminal', header: 'Terminal', render: (row) => displayTerminal(row.terminal as any), value: (row) => row.terminal },
        {
            key: 'tiene',
            header: 'Tiene',
            render: (row) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.tiene ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {row.tiene ? 'SÍ' : 'NO'}
                </span>
            ),
            value: (row) => row.tiene ? 'SI' : 'NO'
        },
        {
            key: 'certificacion',
            header: 'Certificación',
            render: (row) => (
                <span className={`text-xs font-bold ${row.certificacion === 'VIGENTE' ? 'text-green-600' : 'text-red-600'}`}>
                    {row.certificacion || '-'}
                </span>
            ),
            value: (row) => row.certificacion || '-'
        },
        {
            key: 'vencimiento_mes',
            header: 'Vencimiento',
            render: (row) => row.vencimiento_mes && row.vencimiento_anio ? `${row.vencimiento_mes}/${row.vencimiento_anio}` : '-',
            value: (row) => `${row.vencimiento_mes}/${row.vencimiento_anio}`
        },
        { key: 'presion', header: 'Presión', value: (row) => row.presion || '-' },
        { key: 'cilindro', header: 'Cilindro OK', render: (row) => row.cilindro ? 'Sí' : 'No', value: (row) => row.cilindro ? 'Sí' : 'No' },
        { key: 'updated_at', header: 'Actualizado', render: (row) => formatDate(row.updated_at), value: (row) => formatDate(row.updated_at) },
    ];

    const exportColumns = columns.map(c => ({ header: c.header, key: c.key, value: c.value }));

    const handleExport = () => {
        if (!data) return;
        exportToXlsx({
            filename: `minicheck_extintor_${new Date().toISOString().split('T')[0]}`,
            sheetName: 'Extintores',
            rows: data,
            columns: exportColumns
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Control de Extintores"
                description="Validación de estado y vencimiento de extintores"
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

            {isLoading && <LoadingState label="Cargando extintores..." />}
            {isError && <ErrorState message="No se pudieron obtener los registros de extintores." onRetry={refetch} />}

            {!isLoading && !isError && (
                <>
                    <MiniCheckKpis items={kpis} />

                    {/* Chart & Table Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-1 h-80">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Estado Certificación</h3>
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

                        {/* Table */}
                        <div className="lg:col-span-2">
                            {data && data.length > 0 ? (
                                <DataTable columns={columns} rows={data} />
                            ) : (
                                <EmptyState label="Sin registros" description="No se encontraron extintores con los filtros seleccionados." />
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
