/**
 * ShiftConfigModal - Modal for assigning shifts to staff
 * With proper error handling and success feedback
 */

import { useState, useEffect } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useShiftTypes, useStaffShift, useUpsertStaffShift, useSpecialTemplate, useUpsertSpecialTemplate } from '../hooks';
import { StaffWithShift, ShiftTypeCode, VariantCode, ShiftType } from '../types';

interface ShiftConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: StaffWithShift | null;
    onSuccess?: () => void; // Callback to force refresh
}

const VARIANT_OPTIONS: { value: VariantCode; label: string }[] = [
    { value: 'PRINCIPAL', label: 'Turno Normal' },
    { value: 'CONTRATURNO', label: 'Contraturno' },
];

// Fallback shift types if DB doesn't have data
const FALLBACK_SHIFT_TYPES: ShiftType[] = [
    {
        id: '1',
        code: '5X2_FIJO',
        name: '5x2 Fijo',
        pattern_json: {
            type: 'fixed',
            description: 'Lunes a Viernes trabaja, Sábado y Domingo libre',
            offDays: [6, 0], // Saturday=6, Sunday=0
        },
        created_at: '',
    },
    {
        id: '2',
        code: '5X2_ROTATIVO',
        name: '5x2 Rotativo',
        pattern_json: {
            type: 'rotating',
            description: 'Semana 1: Miércoles+Domingo libre. Semana 2: Viernes+Sábado libre',
            cycle: 2,
            weeks: [
                { offDays: [3, 0] }, // Wed=3, Sun=0
                { offDays: [5, 6] }, // Fri=5, Sat=6
            ],
        },
        created_at: '',
    },
    {
        id: '3',
        code: '5X2_SUPER',
        name: '5x2 Super',
        pattern_json: {
            type: 'rotating',
            description: 'Semana 1: Miércoles+Domingo libre. Semana 2: Jueves+Viernes libre',
            cycle: 2,
            weeks: [
                { offDays: [3, 0] }, // Wed=3, Sun=0
                { offDays: [4, 5] }, // Thu=4, Fri=5
            ],
        },
        created_at: '',
    },
    {
        id: '4',
        code: 'ESPECIAL',
        name: 'Especial (Manual)',
        pattern_json: {
            type: 'manual',
            description: 'Plantilla de 28 días definida manualmente',
            cycleDays: 28,
        },
        created_at: '',
    },
];

export const ShiftConfigModal = ({ isOpen, onClose, staff, onSuccess }: ShiftConfigModalProps) => {
    const { data: dbShiftTypes = [] } = useShiftTypes();
    const { data: currentShift } = useStaffShift(staff?.id ?? null);
    const { data: currentTemplate } = useSpecialTemplate(staff?.id ?? null);

    // Use DB types if available, otherwise fallback
    const shiftTypes = dbShiftTypes.length > 0 ? dbShiftTypes : FALLBACK_SHIFT_TYPES;

    const upsertShiftMutation = useUpsertStaffShift();
    const upsertTemplateMutation = useUpsertSpecialTemplate();

    const [selectedType, setSelectedType] = useState<ShiftTypeCode>('5X2_FIJO');
    const [selectedVariant, setSelectedVariant] = useState<VariantCode>('PRINCIPAL');
    const [specialOffDays, setSpecialOffDays] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Initialize from current shift
    useEffect(() => {
        if (currentShift) {
            setSelectedType(currentShift.shift_type_code);
            setSelectedVariant(currentShift.variant_code);
        } else {
            setSelectedType('5X2_FIJO');
            setSelectedVariant('PRINCIPAL');
        }
        if (currentTemplate) {
            setSpecialOffDays(currentTemplate.off_days_json);
        } else {
            setSpecialOffDays([]);
        }
        setError(null);
        setSuccess(false);
    }, [currentShift, currentTemplate, staff?.id]);

    if (!isOpen || !staff) return null;

    const handleSave = async () => {
        setError(null);
        setSuccess(false);

        try {
            console.log('Saving shift:', {
                staff_id: staff.id,
                shift_type_code: selectedType,
                variant_code: selectedVariant,
            });

            await upsertShiftMutation.mutateAsync({
                staff_id: staff.id,
                shift_type_code: selectedType,
                variant_code: selectedVariant,
                start_date: '2026-01-01',
            });

            // If ESPECIAL, also save the template
            if (selectedType === 'ESPECIAL' && specialOffDays.length > 0) {
                await upsertTemplateMutation.mutateAsync({
                    staffId: staff.id,
                    offDays: specialOffDays,
                });
            }

            setSuccess(true);

            // Call onSuccess callback to force parent refresh
            if (onSuccess) {
                onSuccess();
            }

            // Close after brief success display
            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (err) {
            console.error('Error saving shift:', err);
            const message = err instanceof Error ? err.message : 'Error desconocido al guardar';
            setError(message);
        }
    };

    const toggleDayInTemplate = (day: number) => {
        setSpecialOffDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const isLoading = upsertShiftMutation.isPending || upsertTemplateMutation.isPending;

    const selectedShiftType = shiftTypes.find((t) => t.code === selectedType);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-t-xl">
                    <div>
                        <h2 className="text-lg font-semibold">Configurar Turno</h2>
                        <p className="text-sm text-brand-100">{staff.nombre}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Icon name="x" size={20} />
                    </button>
                </div>

                {/* Error/Success messages */}
                {error && (
                    <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <Icon name="alert-circle" size={18} className="text-red-600 mt-0.5" />
                        <div className="text-sm text-red-700">{error}</div>
                    </div>
                )}
                {success && (
                    <div className="mx-4 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                        <Icon name="check-circle" size={18} className="text-emerald-600" />
                        <div className="text-sm text-emerald-700 font-medium">¡Turno guardado correctamente!</div>
                    </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-6">
                    {/* Current assignment info */}
                    {currentShift && (
                        <div className="p-3 bg-slate-50 rounded-lg border">
                            <div className="text-xs text-slate-500 mb-1">Turno actual asignado:</div>
                            <div className="font-medium text-slate-800">
                                {shiftTypes.find((t) => t.code === currentShift.shift_type_code)?.name || currentShift.shift_type_code}
                                {' - '}{currentShift.variant_code}
                            </div>
                        </div>
                    )}

                    {/* Shift Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tipo de Turno
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {shiftTypes.map((type) => (
                                <button
                                    key={type.code}
                                    onClick={() => setSelectedType(type.code)}
                                    className={`p-3 rounded-lg border text-left transition-all ${selectedType === type.code
                                            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/30'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="font-medium text-sm">{type.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {type.pattern_json?.description || ''}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Variant (for rotating types) */}
                    {(selectedType === '5X2_ROTATIVO' || selectedType === '5X2_SUPER') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Variante (Semana de inicio)
                            </label>
                            <div className="flex gap-2">
                                {VARIANT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSelectedVariant(opt.value)}
                                        className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedVariant === opt.value
                                                ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/30'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview off days for selected type */}
                    {selectedShiftType && selectedType !== 'ESPECIAL' && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="flex items-start gap-2">
                                <Icon name="calendar" size={16} className="text-amber-600 mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium text-amber-800">Días Libres</div>
                                    <div className="text-xs text-amber-700">
                                        {getOffDaysDescription(selectedShiftType, selectedVariant)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Special Template (28-day cycle) */}
                    {selectedType === 'ESPECIAL' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Días Libres (ciclo 28 días)
                            </label>
                            <p className="text-xs text-slate-500 mb-3">
                                Haz clic en los días que serán libres en el ciclo de 4 semanas
                            </p>
                            <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                                {[0, 1, 2, 3].map((week) => (
                                    <div key={week} className="flex items-center gap-1">
                                        <span className="text-xs text-slate-500 w-16 font-medium">Sem {week + 1}:</span>
                                        <div className="flex gap-1 flex-1">
                                            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                                                const dayIndex = week * 7 + day;
                                                const isOff = specialOffDays.includes(dayIndex);
                                                const dayLabel = ['L', 'M', 'X', 'J', 'V', 'S', 'D'][day];

                                                return (
                                                    <button
                                                        key={dayIndex}
                                                        onClick={() => toggleDayInTemplate(dayIndex)}
                                                        className={`w-9 h-9 rounded text-xs font-bold transition-all ${isOff
                                                                ? 'bg-slate-700 text-white shadow-sm'
                                                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                            }`}
                                                    >
                                                        {dayLabel}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-600 mt-2 font-medium">
                                {specialOffDays.length} días libres seleccionados por ciclo
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center gap-3 p-4 border-t bg-slate-50 rounded-b-xl">
                    <div className="text-xs text-slate-500">
                        Los cambios aplican para todo el año 2026
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading || success}
                            className="px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
                        >
                            {isLoading && <Icon name="loader" size={16} className="animate-spin" />}
                            {success ? '¡Guardado!' : 'Guardar Turno'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Get description of off days for a shift type
 */
function getOffDaysDescription(shiftType: ShiftType, variant: VariantCode): string {
    const pattern = shiftType.pattern_json;
    if (!pattern) return '';

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    if (pattern.type === 'fixed' && pattern.offDays) {
        const offDayNames = pattern.offDays.map((d) => dayNames[d]).join(' y ');
        return `Libre: ${offDayNames} (todas las semanas)`;
    }

    if (pattern.type === 'rotating' && pattern.weeks) {
        const lines: string[] = [];
        pattern.weeks.forEach((week, i) => {
            const adjustedIndex = variant === 'CONTRATURNO' ? (i + 1) % pattern.weeks!.length : i;
            const offDayNames = week.offDays.map((d) => dayNames[d]).join(' + ');
            lines.push(`Semana ${adjustedIndex + 1}: ${offDayNames}`);
        });
        return lines.join(' | ');
    }

    return pattern.description || '';
}
