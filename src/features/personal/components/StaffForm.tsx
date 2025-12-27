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
const TALLA_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const TALLA_PANTALON_OPTIONS = ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60'];
const TALLA_ZAPATO_OPTIONS = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

const validateEmail = (email: string): boolean => {
    if (!email) return true; // Empty is valid (optional field)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const StaffForm = ({ initialData, onSubmit, onCancel, isLoading }: Props) => {
    const [formData, setFormData] = useState<StaffFormValues>({
        rut: '',
        nombre: '',
        cargo: 'conductor',
        terminal_code: 'EL_ROBLE',
        turno: 'Mañana',
        horario: '08:00-18:00',
        contacto: '',
        email: '',
        talla_polera: '',
        talla_chaqueta: '',
        talla_pantalon: '',
        talla_zapato_seguridad: '',
        talla_chaleco_reflectante: '',
    });

    const [rutError, setRutError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [rutDisplay, setRutDisplay] = useState('');
    const [tallasExpanded, setTallasExpanded] = useState(false);

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
                email: initialData.email || '',
                talla_polera: initialData.talla_polera || '',
                talla_chaqueta: initialData.talla_chaqueta || '',
                talla_pantalon: initialData.talla_pantalon || '',
                talla_zapato_seguridad: initialData.talla_zapato_seguridad || '',
                talla_chaleco_reflectante: initialData.talla_chaleco_reflectante || '',
            });
            setRutDisplay(formatRut(initialData.rut));
            // Expand tallas section if any talla field has data
            const hasTallas = initialData.email || initialData.talla_polera || initialData.talla_chaqueta ||
                initialData.talla_pantalon || initialData.talla_zapato_seguridad || initialData.talla_chaleco_reflectante;
            setTallasExpanded(Boolean(hasTallas));
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

    const handleEmailChange = (value: string) => {
        setFormData((prev) => ({ ...prev, email: value }));
        if (value && !validateEmail(value)) {
            setEmailError('Formato de correo inválido');
        } else {
            setEmailError(null);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const validation = validateRut(formData.rut);
        if (!validation.valid) {
            setRutError(validation.error || 'RUT inválido');
            return;
        }

        if (formData.email && !validateEmail(formData.email)) {
            setEmailError('Formato de correo inválido');
            return;
        }

        onSubmit(formData);
    };

    const isEdit = Boolean(initialData);

    const renderTallaSelect = (
        label: string,
        field: keyof StaffFormValues,
        options: string[]
    ) => (
        <div>
            <label className="label">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    className="input"
                    list={`${field}-options`}
                    value={formData[field] || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder="Seleccionar o escribir..."
                />
                <datalist id={`${field}-options`}>
                    {options.map((opt) => (
                        <option key={opt} value={opt} />
                    ))}
                </datalist>
            </div>
        </div>
    );

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

            {/* Tallas y Correo - Collapsible Section */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                    type="button"
                    onClick={() => setTallasExpanded(!tallasExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                    <span className="font-medium text-slate-700 flex items-center gap-2">
                        <Icon name="tag" size={18} />
                        Tallas y Correo
                    </span>
                    <Icon
                        name="chevron-down"
                        size={18}
                        className={`text-slate-500 transition-transform ${tallasExpanded ? 'rotate-180' : ''}`}
                    />
                </button>

                {tallasExpanded && (
                    <div className="p-4 space-y-4 bg-white">
                        {/* Email */}
                        <div>
                            <label className="label">Correo Electrónico</label>
                            <input
                                type="email"
                                className={`input ${emailError ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                                value={formData.email || ''}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                placeholder="trabajador@ejemplo.com"
                            />
                            {emailError && <p className="mt-1 text-xs text-danger-600">{emailError}</p>}
                        </div>

                        {/* Tallas Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {renderTallaSelect('Talla Polera', 'talla_polera', TALLA_OPTIONS)}
                            {renderTallaSelect('Talla Chaqueta', 'talla_chaqueta', TALLA_OPTIONS)}
                            {renderTallaSelect('Talla Pantalón', 'talla_pantalon', TALLA_PANTALON_OPTIONS)}
                            {renderTallaSelect('Talla Zapato de Seguridad', 'talla_zapato_seguridad', TALLA_ZAPATO_OPTIONS)}
                            {renderTallaSelect('Talla Chaleco Reflectante', 'talla_chaleco_reflectante', TALLA_OPTIONS)}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading || Boolean(rutError) || Boolean(emailError)}>
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

