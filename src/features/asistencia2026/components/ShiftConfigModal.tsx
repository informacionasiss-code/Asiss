/**
 * ShiftConfigModal - Modal for assigning shifts to staff
 */

import { useState, useEffect } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useShiftTypes, useStaffShift, useUpsertStaffShift, useSpecialTemplate, useUpsertSpecialTemplate } from '../hooks';
import { StaffWithShift, ShiftTypeCode, VariantCode } from '../types';

interface ShiftConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: StaffWithShift | null;
}

const VARIANT_OPTIONS: { value: VariantCode; label: string }[] = [
    { value: 'PRINCIPAL', label: 'Turno Normal' },
    { value: 'CONTRATURNO', label: 'Contraturno' },
];

export const ShiftConfigModal = ({ isOpen, onClose, staff }: ShiftConfigModalProps) => {
    const { data: shiftTypes = [] } = useShiftTypes();
    const { data: currentShift } = useStaffShift(staff?.id ?? null);
    const { data: currentTemplate } = useSpecialTemplate(staff?.id ?? null);

    const upsertShiftMutation = useUpsertStaffShift();
    const upsertTemplateMutation = useUpsertSpecialTemplate();

    const [selectedType, setSelectedType] = useState<ShiftTypeCode>('5X2_FIJO');
    const [selectedVariant, setSelectedVariant] = useState<VariantCode>('PRINCIPAL');
    const [specialOffDays, setSpecialOffDays] = useState<number[]>([]);

    // Initialize from current shift
    useEffect(() => {
        if (currentShift) {
            setSelectedType(currentShift.shift_type_code);
            setSelectedVariant(currentShift.variant_code);
        }
        if (currentTemplate) {
            setSpecialOffDays(currentTemplate.off_days_json);
        }
    }, [currentShift, currentTemplate]);

    if (!isOpen || !staff) return null;

    const handleSave = async () => {
        try {
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

            onClose();
        } catch (error) {
            console.error('Error saving shift:', error);
        }
    };

    const toggleDayInTemplate = (day: number) => {
        setSpecialOffDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const isLoading = upsertShiftMutation.isPending || upsertTemplateMutation.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Configurar Turno</h2>
                        <p className="text-sm text-slate-500">{staff.nombre}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <Icon name="x" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6">
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
                                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="font-medium text-sm">{type.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">{type.pattern_json?.description || ''}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Variant (for rotating types) */}
                    {(selectedType === '5X2_ROTATIVO' || selectedType === '5X2_SUPER') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Variante
                            </label>
                            <div className="flex gap-2">
                                {VARIANT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSelectedVariant(opt.value)}
                                        className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedVariant === opt.value
                                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
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
                            <div className="space-y-2">
                                {[0, 1, 2, 3].map((week) => (
                                    <div key={week} className="flex items-center gap-1">
                                        <span className="text-xs text-slate-500 w-14">Sem {week + 1}:</span>
                                        <div className="flex gap-1 flex-1">
                                            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                                                const dayIndex = week * 7 + day;
                                                const isOff = specialOffDays.includes(dayIndex);
                                                const dayLabel = ['L', 'M', 'X', 'J', 'V', 'S', 'D'][day];

                                                return (
                                                    <button
                                                        key={dayIndex}
                                                        onClick={() => toggleDayInTemplate(dayIndex)}
                                                        className={`w-8 h-8 rounded text-xs font-medium transition-all ${isOff
                                                            ? 'bg-slate-600 text-white'
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
                            <p className="text-xs text-slate-500 mt-2">
                                {specialOffDays.length} días libres seleccionados
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && <Icon name="loader" size={16} className="animate-spin" />}
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};
