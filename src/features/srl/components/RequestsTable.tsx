import { useState } from 'react';
import { useSrlRequests } from '../hooks';
import { DataTable, TableColumn } from '../../../shared/components/common/DataTable';
import { Icon } from '../../../shared/components/common/Icon';
import { LoadingState } from '../../../shared/components/common/LoadingState';
import { SrlRequest, SrlStatus, SrlCriticality } from '../types';

const STATUS_LABELS: Record<SrlStatus, string> = {
    'CREADA': 'Creada',
    'ENVIADA': 'Enviada SRL',
    'PROGRAMADA': 'Programada',
    'EN_REVISION': 'En Revisión',
    'REPARADA': 'Reparada',
    'NO_REPARADA': 'No Reparada',
    'REAGENDADA': 'Reagendada',
    'CERRADA': 'Cerrada',
};

const STATUS_COLORS: Record<SrlStatus, string> = {
    'CREADA': 'bg-slate-100 text-slate-700',
    'ENVIADA': 'bg-blue-100 text-blue-700',
    'PROGRAMADA': 'bg-purple-100 text-purple-700',
    'EN_REVISION': 'bg-yellow-100 text-yellow-700',
    'REPARADA': 'bg-green-100 text-green-700',
    'NO_REPARADA': 'bg-red-100 text-red-700',
    'REAGENDADA': 'bg-orange-100 text-orange-700',
    'CERRADA': 'bg-gray-100 text-gray-700',
};

interface Props {
    onCreate: () => void;
    onView: (id: string) => void;
}

export const RequestsTable = ({ onCreate, onView }: Props) => {
    const [filters, setFilters] = useState({
        terminal: 'ALL',
        status: 'TODOS',
        criticality: 'TODAS',
        search: ''
    });

    const { data: requests, isLoading } = useSrlRequests(filters);

    const columns: TableColumn<SrlRequest & { srl_request_buses: any[] }>[] = [
        {
            key: 'created_at',
            header: 'Fecha',
            render: (row) => {
                const date = new Date(row.created_at);
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                            {new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)}
                        </span>
                        <span className="text-xs text-slate-500">
                            {new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(date)}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'terminal_code',
            header: 'Terminal',
            render: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    {row.terminal_code}
                </span>
            )
        },
        {
            key: 'buses',
            header: 'Buses',
            render: (row) => (
                <span className="font-mono text-sm">
                    {row.srl_request_buses?.length || 0}
                </span>
            )
        },
        {
            key: 'criticality',
            header: 'Criticidad',
            render: (row) => {
                const colors: Record<SrlCriticality, string> = {
                    'BAJA': 'bg-green-100 text-green-700',
                    'MEDIA': 'bg-yellow-100 text-yellow-700',
                    'ALTA': 'bg-red-100 text-red-700',
                };
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[row.criticality]}`}>
                        {row.criticality}
                    </span>
                );
            }
        },
        {
            key: 'applus',
            header: 'APPLUS',
            render: (row) => row.applus && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                    APPLUS
                </span>
            )
        },
        {
            key: 'status',
            header: 'Estado',
            render: (row) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status]}`}>
                    {STATUS_LABELS[row.status]}
                </span>
            )
        },
        {
            key: 'actions',
            header: '',
            render: (row) => (
                <button
                    onClick={() => onView(row.id)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    <Icon name="search" size={18} />
                </button>
            )
        }
    ];

    if (isLoading) return <LoadingState label="Cargando solicitudes..." />;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex gap-2">
                    {/* Filters placeholders - implement fully with FiltersBar reuse or custom */}
                    <select
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.terminal}
                        onChange={(e) => setFilters(prev => ({ ...prev, terminal: e.target.value }))}
                    >
                        <option value="ALL">Todos los Terminales</option>
                        <option value="EL_ROBLE">El Roble</option>
                        <option value="LA_REINA">La Reina</option>
                        <option value="MARIA_ANGELICA">María Angélica</option>
                        <option value="EL_DESCANSO">El Descanso</option>
                    </select>

                    <select
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="TODOS">Todos los Estados</option>
                        <option value="CREADA">Creada</option>
                        <option value="ENVIADA">Enviada</option>
                        <option value="PROGRAMADA">Programada</option>
                        <option value="EN_REVISION">En Revisión</option>
                        <option value="CERRADA">Cerrada</option>
                    </select>
                </div>

                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-brand transition-colors font-medium text-sm"
                >
                    <Icon name="plus" size={18} />
                    Nueva Solicitud
                </button>
            </div>

            <DataTable
                columns={columns}
                rows={requests || []}
                emptyMessage="No se encontraron solicitudes SRL"
            />
        </div>
    );
};
