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
import { useTags } from '../hooks/useMiniCheck';
import { Tag, MiniCheckFilters } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const MiniCheckTagPage = () => {
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
    const { data, isLoading, isError, refetch } = useTags(queryFilters);

    // Derived KPIs
    const kpis: KpiItem[] = useMemo(() => {
        if (!data) return [];
        const total = data.length;
        const sinTag = data.filter(d => !d.tiene).length;
        const conSerie = data.filter(d => d.serie && d.serie.trim().length > 0).length;

        return [
            { label: 'Total Registros', value: total, icon: 'clipboard' },
            { label: 'Sin TAG', value: sinTag, icon: 'alert-circle', colorClass: 'bg-red-50 text-red-600' },
            { label: 'Serie Informada', value: conSerie, icon: 'check', colorClass: 'bg-blue-50 text-blue-600' },
        ];
    }, [data]);

    // Chart Data
    const chartData = useMemo(() => {
        if (!data) return [];
        const conTag = data.filter(d => d.tiene).length;
        const sinTag = data.filter(d => !d.tiene).length;
        return [
            { name: 'Con TAG', value: conTag, color: '#10b981' },
            { name: 'Sin TAG', value: sinTag, color: '#ef4444' },
        ];
    }, [data]);

    // Columns
    const columns: TableColumn<Tag>[] = [
        { key: 'bus_ppu', header: 'PPU', value: (row) => row.bus_ppu },
        { key: 'terminal', header: 'Terminal', render: (row) => displayTerminal(row.terminal as any), value: (row) => row.terminal },
        {
            key: 'tiene',
            header: 'Tiene TAG',
            render: (row) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.tiene ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {row.tiene ? 'SÍ' : 'NO'}
                </span>
            ),
            value: (row) => row.tiene ? 'SI' : 'NO'
        },
        { key: 'serie', header: 'N° Serie', value: (row) => row.serie || '-' },
        { key: 'observacion', header: 'Observación', value: (row) => row.observacion || '' },
        { key: 'updated_at', header: 'Actualizado', render: (row) => formatDate(row.updated_at), value: (row) => formatDate(row.updated_at) },
    ];

    const exportColumns = columns.map(c => ({ header: c.header, key: c.key, value: c.value }));

    const handleExport = () => {
        if (!data) return;
        exportToXlsx({
            filename: `minicheck_tag_${new Date().toISOString().split('T')[0]}`,
            sheetName: 'Tags',
            rows: data,
            columns: exportColumns
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Control de TAG"
                description="Verificación de dispositivos TAG"
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

            {isLoading && <LoadingState label="Cargando tags..." />}
            {isError && <ErrorState message="No se pudieron cargar los datos." onRetry={refetch} />}

            {!isLoading && !isError && (
                <>
                    <MiniCheckKpis items={kpis} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-1 h-80 flex flex-col items-center justify-center">
                            <h3 className="text-sm font-bold text-slate-700 mb-2 w-full text-left">Distribución</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
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
