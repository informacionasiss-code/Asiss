import { useState } from 'react';
import { useSrlRequests } from '../hooks';
import { Icon } from '../../../shared/components/common/Icon';
import { SrlStatus, SrlCriticality } from '../types';

interface Props {
    onCreate: () => void;
    onView: (id: string) => void;
}

export const RequestsTable = ({ onCreate, onView }: Props) => {
    // Local state for filters
    const [filters, setFilters] = useState({
        terminal: 'ALL',
        status: 'TODOS',
        criticality: 'TODAS',
        search: ''
    });

    const { data: requests = [], isLoading } = useSrlRequests(filters);

    const getStatusBadge = (status: SrlStatus) => {
        const styles = {
            CREADA: 'bg-blue-50 text-blue-700 border-blue-200',
            ENVIADA: 'bg-sky-50 text-sky-700 border-sky-200',
            PROGRAMADA: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            EN_REVISION: 'bg-amber-50 text-amber-700 border-amber-200',
            REPARADA: 'bg-teal-50 text-teal-700 border-teal-200',
            NO_REPARADA: 'bg-red-50 text-red-700 border-red-200',
            REAGENDADA: 'bg-orange-50 text-orange-700 border-orange-200',
            CERRADA: 'bg-slate-100 text-slate-600 border-slate-200',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.CREADA} uppercase tracking-wider`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const getCriticalityBadge = (crit: SrlCriticality) => {
        const styles = {
            BAJA: 'text-slate-500 bg-slate-100',
            MEDIA: 'text-amber-600 bg-amber-50',
            ALTA: 'text-red-600 bg-red-50 font-bold',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs border border-transparent ${styles[crit]}`}>
                {crit}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Icon name="search" className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            placeholder="Buscar PPU, ID..."
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <select
                        className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none text-slate-600 font-medium"
                        value={filters.terminal}
                        onChange={e => setFilters({ ...filters, terminal: e.target.value })}
                    >
                        <option value="ALL">Todo Terminal</option>
                        <option value="EL_ROBLE">El Roble</option>
                        <option value="LA_REINA">La Reina</option>
                        <option value="MARIA_ANGELICA">Maria Angélica</option>
                        <option value="EL_DESCANSO">El Descanso</option>
                    </select>

                    <select
                        className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none text-slate-600 font-medium"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="TODOS">Todo Estado</option>
                        <option value="CREADA">Creada</option>
                        <option value="ENVIADA">Enviada</option>
                        <option value="PROGRAMADA">Programada</option>
                        <option value="REPARADA">Reparada</option>
                        <option value="CERRADA">Cerrada</option>
                    </select>
                </div>

                <button
                    onClick={onCreate}
                    className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <Icon name="plus" size={20} />
                    <span className="md:hidden lg:inline">Nueva Solicitud</span>
                </button>
            </div>

            {/* Table Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin text-blue-600 mb-4"><Icon name="loader" size={32} /></div>
                        <p className="text-slate-500 font-medium">Cargando solicitudes...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4">
                            <Icon name="inbox" size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No hay solicitudes</h3>
                        <p className="text-slate-500 mt-1 max-w-sm mx-auto">No se encontraron registros con los filtros actuales. Intente limpiar los filtros o cree una nueva solicitud.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                    <th className="px-6 py-4">ID / Terminal</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Criticidad</th>
                                    <th className="px-6 py-4">Buses Afectados</th>
                                    <th className="px-6 py-4">Fecha Creación</th>
                                    <th className="px-6 py-4">Required</th>
                                    <th className="px-6 py-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map((req) => (
                                    <tr
                                        key={req.id}
                                        onClick={() => onView(req.id)}
                                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs text-slate-400">#{req.id.slice(0, 8)}</span>
                                                <span className="font-bold text-slate-700 text-sm mt-0.5">{req.terminal_code.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getCriticalityBadge(req.criticality)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {req.srl_request_buses?.slice(0, 3).map((bus, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600" title={bus.bus_ppu}>
                                                        {bus.bus_ppu.slice(0, 2)}
                                                    </div>
                                                ))}
                                                {(req.srl_request_buses?.length || 0) > 3 && (
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                        +{(req.srl_request_buses?.length || 0) - 3}
                                                    </div>
                                                )}
                                                {(req.srl_request_buses?.length === 0) && <span className="text-slate-400 text-xs italic">Sin buses</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(req.created_at))}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {req.required_date ? <span className="text-red-600 font-medium">{req.required_date}</span> : <span className="text-slate-300">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                                                <Icon name="chevron-right" size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
