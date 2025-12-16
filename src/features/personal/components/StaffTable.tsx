import { StaffViewModel, STAFF_CARGOS } from '../types';
import { formatRut } from '../utils/rutUtils';
import { displayTerminal } from '../../../shared/utils/terminal';
import { Icon } from '../../../shared/components/common/Icon';

interface Props {
    staff: StaffViewModel[];
    onEdit: (staff: StaffViewModel) => void;
    onOffboard: (staff: StaffViewModel) => void;
    onAdmonish: (staff: StaffViewModel) => void;
}

const getCargoLabel = (cargo: string): string => {
    return STAFF_CARGOS.find((c) => c.value === cargo)?.label || cargo;
};

export const StaffTable = ({ staff, onEdit, onOffboard, onAdmonish }: Props) => {
    if (!staff.length) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-4">
                    <Icon name="users" size={28} className="text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No hay personal registrado</p>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                    Comienza agregando trabajadores con el botón "Nuevo Trabajador"
                </p>
            </div>
        );
    }

    return (
        <div className="table-container overflow-x-auto">
            <table className="table">
                <thead className="table-header">
                    <tr>
                        <th scope="col" className="table-header-cell">RUT</th>
                        <th scope="col" className="table-header-cell">Nombre</th>
                        <th scope="col" className="table-header-cell">Cargo</th>
                        <th scope="col" className="table-header-cell">Terminal</th>
                        <th scope="col" className="table-header-cell">Turno</th>
                        <th scope="col" className="table-header-cell">Horario</th>
                        <th scope="col" className="table-header-cell">Contacto</th>
                        <th scope="col" className="table-header-cell">Estado</th>
                        <th scope="col" className="table-header-cell text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="table-body">
                    {staff.map((row) => {
                        const isOffboarded = row.status === 'DESVINCULADO';

                        return (
                            <tr
                                key={row.id}
                                className={`table-row ${isOffboarded ? 'bg-danger-50 hover:bg-danger-100' : ''}`}
                            >
                                <td className="table-cell font-mono text-sm">{formatRut(row.rut)}</td>
                                <td className="table-cell">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-900">{row.nombre}</span>
                                        {row.admonition_count > 0 && (
                                            <span
                                                className="badge badge-warning text-xs"
                                                title={`${row.admonition_count} amonestación(es)`}
                                            >
                                                ⚠️ {row.admonition_count}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="table-cell">{getCargoLabel(row.cargo)}</td>
                                <td className="table-cell">{displayTerminal(row.terminal_code)}</td>
                                <td className="table-cell">{row.turno}</td>
                                <td className="table-cell font-mono text-xs">{row.horario}</td>
                                <td className="table-cell text-sm">{row.contacto}</td>
                                <td className="table-cell">
                                    <span
                                        className={`badge ${isOffboarded ? 'badge-danger' : 'badge-success'
                                            }`}
                                    >
                                        {row.status}
                                    </span>
                                </td>
                                <td className="table-cell">
                                    <div className="flex items-center justify-end gap-1">
                                        {!isOffboarded && (
                                            <>
                                                <button
                                                    onClick={() => onEdit(row)}
                                                    className="btn btn-ghost btn-icon text-slate-600 hover:text-brand-600"
                                                    title="Modificar"
                                                >
                                                    <Icon name="clipboard" size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onAdmonish(row)}
                                                    className="btn btn-ghost btn-icon text-slate-600 hover:text-warning-600"
                                                    title="Amonestar"
                                                >
                                                    <Icon name="megaphone" size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onOffboard(row)}
                                                    className="btn btn-ghost btn-icon text-slate-600 hover:text-danger-600"
                                                    title="Desvincular"
                                                >
                                                    <Icon name="logout" size={16} />
                                                </button>
                                            </>
                                        )}
                                        {isOffboarded && (
                                            <span className="text-xs text-danger-600">
                                                {row.terminated_at
                                                    ? new Date(row.terminated_at).toLocaleDateString('es-CL')
                                                    : 'Desvinculado'}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
