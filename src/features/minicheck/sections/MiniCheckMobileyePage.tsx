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
import { useMobileye } from '../hooks/useMiniCheck';
import { Mobileye, MiniCheckFilters } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Icon } from '../../../shared/components/common/Icon';

export const MiniCheckMobileyePage = () => {
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
    const { data, isLoading, isError, refetch } = useMobileye(queryFilters);

    // Helper
    const isSensorsOk = (row: Mobileye) => row.consola && row.sensor_frontal && row.sensor_izq && row.sensor_der;

    // Derived KPIs
    const kpis: KpiItem[] = useMemo(() => {
        if (!data) return [];
        const total = data.length;
        const conFalla = data.filter(d => !isSensorsOk(d)).length;
        const alertaActiva = data.filter(d => d.alerta_izq || d.alerta_der).length;

        return [
            { label: 'Total Registros', value: total, icon: 'clipboard' },
            { label: 'Falla Sensores', value: conFalla, icon: 'alert-triangle', colorClass: 'bg-red-50 text-red-600' },
            { label: 'Alertas Activas', value: alertaActiva, icon: 'bell', colorClass: 'bg-yellow-50 text-yellow-600' },
        ];
    }, [data]);

    // Chart Data
    const chartData = useMemo(() => {
        if (!data) return [];
        const ok = data.filter(d => isSensorsOk(d)).length;
        const fail = data.filter(d => !isSensorsOk(d)).length;
        return [
            { name: 'Sensores OK', value: ok, color: '#10b981' },
            { name: 'Falla', value: fail, color: '#ef4444' },
        ];
    }, [data]);

    // Columns
    const columns: TableColumn<Mobileye>[] = [
        { key: 'bus_ppu', header: 'PPU', value: (row) => row.bus_ppu },
        { key: 'terminal', header: 'Terminal', render: (row) => displayTerminal(row.terminal as any), value: (row) => row.terminal },
        { key: 'bus_marca', header: 'Marca', value: (row) => row.bus_marca || '-' },
        {
            key: 'consola',
            header: 'Consola',
            render: (row) => row.consola ? <Icon name="check" size={16} className="text-green-500" /> : <Icon name="x" size={16} className="text-red-500" />,
            value: (row) => row.consola ? 'OK' : 'Falla'
        },
        {
            key: 'id', // Dummy key for composite
            header: 'Sensores OK?',
            render: (row) => {
                const ok = isSensorsOk(row);
                return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {ok ? 'SÍ' : 'NO'}
                    </span>
                );
            },
            value: (row) => isSensorsOk(row) ? 'SÍ' : 'NO'
        },
        {
            key: 'id', // Dummy key for composite
            header: 'Alertas',
            render: (row) => {
                const alerts = [];
                if (row.alerta_izq) alerts.push('IZQ');
                if (row.alerta_der) alerts.push('DER');
                return alerts.length > 0 ? <span className="text-red-600 font-bold text-xs">{alerts.join(', ')}</span> : '-';
            },
            value: (row) => {
                const alerts = [];
                if (row.alerta_izq) alerts.push('IZQ');
                if (row.alerta_der) alerts.push('DER');
                return alerts.join(', ');
            }
        },
        { key: 'updated_at', header: 'Actualizado', render: (row) => formatDate(row.updated_at), value: (row) => formatDate(row.updated_at) },
    ];

    const exportColumns = columns.map(c => ({ header: c.header, key: c.key, value: c.value }));

    const handleExport = () => {
        if (!data) return;
        exportToXlsx({
            filename: `minicheck_mobileye_${new Date().toISOString().split('T')[0]}`,
            sheetName: 'Mobileye',
            rows: data,
            columns: exportColumns
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Control Mobileye"
                description="Estado de sensores y cámaras Mobileye"
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

            {isLoading && <LoadingState label="Cargando Mobileye..." />}
            {isError && <ErrorState message="No se pudieron cargar los datos." onRetry={refetch} />}

            {!isLoading && !isError && (
                <>
                    <MiniCheckKpis items={kpis} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-1 h-80">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Estado General Sensores</h3>
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
