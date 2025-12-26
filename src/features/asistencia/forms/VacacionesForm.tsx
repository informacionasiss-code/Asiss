import { useState, useEffect, useMemo } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useTerminalStore } from '../../../shared/state/terminalStore';
import { TerminalCode } from '../../../shared/types/terminal';
import { TERMINALS } from '../../../shared/utils/terminal';
import { formatRut, normalizeRut } from '../../personal/utils/rutUtils';
import { useStaffList } from '../../personal/hooks';
import { Staff } from '../../personal/types';
import { VacacionFormValues, Vacacion, VacationConflictInfo } from '../types';
import { calculateBusinessDays, calculateCalendarDays, checkVacationConflicts } from '../api';

interface VacacionesFormProps {
    initialData?: Vacacion;
    onSubmit: (values: VacacionFormValues) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export const VacacionesForm = ({ initialData, onSubmit, onCancel, isLoading }: VacacionesFormProps) => {
    const terminalContext = useTerminalStore((s) => s.context);
    const staffQuery = useStaffList(terminalContext);

    // RUT search state
    const [rutSearch, setRutSearch] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // Form state
    const [formData, setFormData] = useState<VacacionFormValues>({
        rut: '',
        nombre: '',
        cargo: '',
        terminal_code: '' as TerminalCode,
        turno: '',
        start_date: '',
        end_date: '',
        return_date: '',
        conflict_authorized: false,
    });

    // Conflict state
    const [conflictInfo, setConflictInfo] = useState<VacationConflictInfo | null>(null);
    const [checkingConflicts, setCheckingConflicts] = useState(false);

    // Calculated days
    const calendarDays = useMemo(() => {
        if (!formData.start_date || !formData.end_date) return 0;
        return calculateCalendarDays(formData.start_date, formData.end_date);
    }, [formData.start_date, formData.end_date]);

    const businessDays = useMemo(() => {
        if (!formData.start_date || !formData.end_date) return 0;
        return calculateBusinessDays(formData.start_date, formData.end_date);
    }, [formData.start_date, formData.end_date]);

    // Populate from initialData
    useEffect(() => {
        if (initialData) {
            setFormData({
                rut: initialData.rut,
                nombre: initialData.nombre,
                cargo: initialData.cargo,
                terminal_code: initialData.terminal_code,
                turno: initialData.turno,
                start_date: initialData.start_date,
                end_date: initialData.end_date,
                return_date: initialData.return_date,
                conflict_authorized: initialData.conflict_authorized,
            });
            setRutSearch(formatRut(initialData.rut));
        }
    }, [initialData]);

    // Filter staff for autocomplete
    const filteredStaff = useMemo(() => {
        if (!rutSearch || !staffQuery.data) return [];
        const term = normalizeRut(rutSearch).toLowerCase();
        return staffQuery.data
            .filter((s: Staff) => s.status === 'ACTIVO')
            .filter((s: Staff) => s.rut.toLowerCase().includes(term) || s.nombre.toLowerCase().includes(term))
            .slice(0, 8);
    }, [rutSearch, staffQuery.data]);

    // Check conflicts when dates or position change
    useEffect(() => {
        const checkConflicts = async () => {
            if (!formData.cargo || !formData.terminal_code || !formData.turno || !formData.start_date || !formData.end_date) {
                setConflictInfo(null);
                return;
            }

            setCheckingConflicts(true);
            try {
                const info = await checkVacationConflicts(
                    formData.cargo,
                    formData.terminal_code,
                    formData.turno,
                    formData.start_date,
                    formData.end_date,
                    initialData?.rut
                );
                setConflictInfo(info);
            } catch (err) {
                console.error('Error checking conflicts:', err);
            } finally {
                setCheckingConflicts(false);
            }
        };

        checkConflicts();
    }, [formData.cargo, formData.terminal_code, formData.turno, formData.start_date, formData.end_date, initialData?.rut]);

    // Auto-calculate return date (day after end_date)
    useEffect(() => {
        if (formData.end_date) {
            const endDate = new Date(formData.end_date + 'T12:00:00');
            endDate.setDate(endDate.getDate() + 1);
            // Skip weekends for return date
            while (endDate.getDay() === 0 || endDate.getDay() === 6) {
                endDate.setDate(endDate.getDate() + 1);
            }
            setFormData(prev => ({
                ...prev,
                return_date: endDate.toISOString().split('T')[0],
            }));
        }
    }, [formData.end_date]);

    const handleSelectStaff = (staff: Staff) => {
        setSelectedStaff(staff);
        setRutSearch(formatRut(staff.rut));
        setFormData(prev => ({
            ...prev,
            rut: staff.rut,
            nombre: staff.nombre,
            cargo: staff.cargo,
            terminal_code: staff.terminal_code,
            turno: staff.turno,
        }));
        setShowDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    const canSubmit = formData.rut && formData.start_date && formData.end_date && formData.return_date
        && (!conflictInfo?.hasConflict || formData.conflict_authorized);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* RUT Search */}
            <div className="relative">
                <label className="label">Buscar Trabajador por RUT</label>
                <div className="relative">
                    <input
                        type="text"
                        className="input pr-10"
                        placeholder="Ingrese RUT o nombre..."
                        value={rutSearch}
                        onChange={(e) => {
                            setRutSearch(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                    />
                    <Icon name="search" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                {/* Dropdown */}
                {showDropdown && filteredStaff.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredStaff.map((staff) => (
                            <button
                                key={staff.id}
                                type="button"
                                onClick={() => handleSelectStaff(staff)}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b last:border-b-0 border-slate-100"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-slate-800">{staff.nombre}</div>
                                        <div className="text-sm text-slate-500 font-mono">{formatRut(staff.rut)}</div>
                                    </div>
                                    <div className="text-right text-sm text-slate-500">
                                        <div>{staff.cargo}</div>
                                        <div>{staff.turno}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                {showDropdown && rutSearch && filteredStaff.length === 0 && staffQuery.data && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4 text-slate-500 text-sm">
                        No se encontraron trabajadores activos
                    </div>
                )}
            </div>

            {/* Selected Staff Info */}
            {selectedStaff && (
                <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-slate-500 block">Nombre</span>
                            <span className="font-semibold text-slate-800">{selectedStaff.nombre}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Cargo</span>
                            <span className="font-semibold text-slate-800">{selectedStaff.cargo}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Terminal</span>
                            <span className="font-semibold text-slate-800">
                                {TERMINALS[selectedStaff.terminal_code as TerminalCode] || selectedStaff.terminal_code}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">Turno</span>
                            <span className="font-semibold text-slate-800">{selectedStaff.turno}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Date Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="label">Fecha Inicio</label>
                    <input
                        type="date"
                        className="input"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        required
                    />
                </div>
                <div>
                    <label className="label">Fecha Término</label>
                    <input
                        type="date"
                        className="input"
                        value={formData.end_date}
                        min={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        required
                    />
                </div>
                <div>
                    <label className="label">Fecha Vuelta</label>
                    <input
                        type="date"
                        className="input"
                        value={formData.return_date}
                        min={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, return_date: e.target.value }))}
                        required
                    />
                </div>
            </div>

            {/* Days Calculation */}
            {formData.start_date && formData.end_date && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-700">{calendarDays}</div>
                            <div className="text-sm text-slate-500">Días calendario</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-brand-600">{businessDays}</div>
                            <div className="text-sm text-slate-500">Días a descontar</div>
                            <div className="text-xs text-slate-400 mt-1">(sin sábados ni domingos)</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Conflict Warning */}
            {checkingConflicts && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-slate-500">
                    <Icon name="clock" size={20} className="inline-block mr-2 animate-spin" />
                    Verificando disponibilidad...
                </div>
            )}

            {conflictInfo?.hasConflict && !checkingConflicts && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Icon name="alert-triangle" size={24} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-amber-800 mb-2">Conflicto de Personal Detectado</h4>
                            <p className="text-sm text-amber-700 mb-3">
                                Hay {conflictInfo.conflictingVacations.length} persona(s) del mismo cargo, terminal y turno
                                con vacaciones en fechas solapadas.
                            </p>

                            <div className="bg-white/50 rounded p-3 mb-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-amber-700">Personal total:</span>
                                        <span className="font-bold ml-2">{conflictInfo.totalStaffCount}</span>
                                    </div>
                                    <div>
                                        <span className="text-amber-700">Disponibles:</span>
                                        <span className="font-bold ml-2 text-amber-800">
                                            {conflictInfo.availableStaffCount}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-amber-700 mb-3">
                                <strong>En vacaciones:</strong>
                                <ul className="mt-1 space-y-1">
                                    {conflictInfo.conflictingVacations.map((v, i) => (
                                        <li key={i}>• {v.nombre} ({v.start_date} al {v.end_date})</li>
                                    ))}
                                </ul>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.conflict_authorized}
                                    onChange={(e) => setFormData(prev => ({ ...prev, conflict_authorized: e.target.checked }))}
                                    className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                                />
                                <span className="text-sm font-medium text-amber-800">
                                    Autorizo esta solicitud a pesar del conflicto
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {conflictInfo && !conflictInfo.hasConflict && !checkingConflicts && formData.start_date && formData.end_date && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-4 flex items-center gap-3">
                    <Icon name="check-circle" size={24} className="text-green-600" />
                    <div>
                        <span className="font-medium text-green-800">Sin conflictos</span>
                        <span className="text-green-700 text-sm ml-2">
                            ({conflictInfo.availableStaffCount + 1} de {conflictInfo.totalStaffCount} disponibles después de esta solicitud)
                        </span>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={onCancel} className="btn btn-secondary">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={!canSubmit || isLoading}
                    className="btn btn-primary"
                >
                    {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Solicitar Vacaciones'}
                </button>
            </div>
        </form>
    );
};
