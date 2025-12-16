import { useState, useEffect, FormEvent } from 'react';
import { Staff, StaffFormValues, STAFF_CARGOS, StaffCargo } from '../types';
import { TerminalCode } from '../../../shared/types/terminal';
import { terminalOptions } from '../../../shared/utils/terminal';
import { validateRut, formatRut, normalizeRut } from '../utils/rutUtils';
import { Icon } from '../../../shared/components/common/Icon';

interface Props {
    initialData?: Staff | null;
    onSubmit: (values: StaffFormValues) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const TURNO_OPTIONS = ['Mañana', 'Tarde', 'Noche', 'Rotativo'];

export const StaffForm = ({ initialData, onSubmit, onCancel, isLoading }: Props) => {
    const [formData, setFormData] = useState<StaffFormValues>({
        rut: '',
        nombre: '',
        cargo: 'conductor',
        terminal_code: 'EL_ROBLE',
        turno: 'Mañana',
        horario: '08:00-18:00',
        contacto: '',
    });

    const [rutError, setRutError] = useState<string | null>(null);
    const [rutDisplay, setRutDisplay] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                rut: initialData.rut,
                nombre: initialData.nombre,
                cargo: initialData.cargo,
                terminal_code: initialData.terminal_code,
                turno: initialData.turno,
                horario: initialData.horario,
                contacto: initialData.contacto,
            });
            setRutDisplay(formatRut(initialData.rut));
        }
    }, [initialData]);

    const handleRutChange = (value: string) => {
        setRutDisplay(value);
        const validation = validateRut(value);
        if (validation.valid) {
            setRutError(null);
            setFormData((prev) => ({ ...prev, rut: normalizeRut(value) }));
        } else {
            setRutError(validation.error || null);
        }
    };

    const handleRutBlur = () => {
        if (formData.rut) {
            setRutDisplay(formatRut(formData.rut));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const validation = validateRut(formData.rut);
        if (!validation.valid) {
            setRutError(validation.error || 'RUT inválido');
            return;
        }

        onSubmit(formData);
    };

    const isEdit = Boolean(initialData);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* RUT */}
            <div>
                <label className="label">RUT</label>
                <div className="relative">
                    <input
                        type="text"
                        className={`input ${rutError ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                        value={rutDisplay}
                        onChange={(e) => handleRutChange(e.target.value)}
                        onBlur={handleRutBlur}
                        placeholder="12.345.678-9"
                        disabled={isEdit}
                        required
                    />
                    {isEdit && (
                        <Icon
                            name="key"
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    )}
                </div>
                {rutError && <p className="mt-1 text-xs text-danger-600">{rutError}</p>}
                {isEdit && (
                    <p className="mt-1 text-xs text-slate-500">El RUT no puede modificarse</p>
                )}
            </div>

            {/* Nombre */}
            <div>
                <label className="label">Nombre Completo</label>
                <input
                    type="text"
                    className="input"
                    value={formData.nombre}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Juan Pérez González"
                    required
                />
            </div>

            {/* Cargo & Terminal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="label">Cargo</label>
                    <select
                        className="input"
                        value={formData.cargo}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, cargo: e.target.value as StaffCargo }))
                        }
                        required
                    >
                        {STAFF_CARGOS.map((cargo) => (
                            <option key={cargo.value} value={cargo.value}>
                                {cargo.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="label">Terminal</label>
                    <select
                        className="input"
                        value={formData.terminal_code}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, terminal_code: e.target.value as TerminalCode }))
                        }
                        required
                    >
                        {terminalOptions.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Turno & Horario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="label">Turno</label>
                    <select
                        className="input"
                        value={formData.turno}
                        onChange={(e) => setFormData((prev) => ({ ...prev, turno: e.target.value }))}
                        required
                    >
                        {TURNO_OPTIONS.map((turno) => (
                            <option key={turno} value={turno}>
                                {turno}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="label">Horario</label>
                    <input
                        type="text"
                        className="input"
                        value={formData.horario}
                        onChange={(e) => setFormData((prev) => ({ ...prev, horario: e.target.value }))}
                        placeholder="08:00-18:00"
                        required
                    />
                </div>
            </div>

            {/* Contacto */}
            <div>
                <label className="label">Contacto</label>
                <input
                    type="text"
                    className="input"
                    value={formData.contacto}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contacto: e.target.value }))}
                    placeholder="Teléfono o email"
                    required
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading || Boolean(rutError)}>
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                            Guardando...
                        </span>
                    ) : isEdit ? (
                        'Guardar Cambios'
                    ) : (
                        'Crear Trabajador'
                    )}
                </button>
            </div>
        </form>
    );
};
