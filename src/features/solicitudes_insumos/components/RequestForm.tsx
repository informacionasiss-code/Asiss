import { useState, useEffect } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import {
    fetchSupplies,
    fetchConsumptionProfiles,
    createSupplyRequest
} from '../api/suppliesApi';
import { Supply, ConsumptionProfile, RequestType, LOCATIONS } from '../types';
import {
    calculateWeekdayRequest,
    calculateWeekendRequest,
    getAutoRequestType,
} from '../utils/calculations';
import { useSessionStore } from '../../../shared/state/sessionStore';

interface Props {
    onSuccess: () => void;
    onCancel: () => void;
}

interface FormItem {
    supply_id: string;
    supply_name: string;
    quantity: number;
    is_extra: boolean;
}

export const RequestForm = ({ onSuccess, onCancel }: Props) => {
    const session = useSessionStore((state) => state.session);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [profiles, setProfiles] = useState<ConsumptionProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [terminal, setTerminal] = useState<string>(LOCATIONS.TERMINAL[0]);
    const [requestType, setRequestType] = useState<RequestType>(getAutoRequestType());
    const [items, setItems] = useState<FormItem[]>([]);
    const [extraItem, setExtraItem] = useState({ supply_id: '', quantity: 0 });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [suppliesData, profilesData] = await Promise.all([
                    fetchSupplies(),
                    fetchConsumptionProfiles(),
                ]);
                setSupplies(suppliesData);
                setProfiles(profilesData);
            } catch (error) {
                console.error('Error loading form data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Recalculate items when request type changes
    useEffect(() => {
        if (supplies.length === 0 || profiles.length === 0) return;

        let calculated: { supply_id: string; supply_name: string; quantity: number }[];

        if (requestType === 'SEMANA') {
            calculated = calculateWeekdayRequest(profiles, supplies);
        } else if (requestType === 'FIN_SEMANA') {
            calculated = calculateWeekendRequest(profiles, supplies);
        } else {
            // EXTRA: start with empty list, user adds manually
            calculated = [];
        }

        setItems(calculated.map((item) => ({ ...item, is_extra: false })));
    }, [requestType, supplies, profiles]);

    const handleQuantityChange = (supplyId: string, value: number) => {
        setItems((prev) =>
            prev.map((item) =>
                item.supply_id === supplyId ? { ...item, quantity: Math.max(0, value) } : item
            )
        );
    };

    const handleAddExtra = () => {
        if (!extraItem.supply_id || extraItem.quantity <= 0) return;

        const supply = supplies.find((s) => s.id === extraItem.supply_id);
        if (!supply) return;

        const existing = items.find((i) => i.supply_id === extraItem.supply_id);
        if (existing) {
            setItems((prev) =>
                prev.map((item) =>
                    item.supply_id === extraItem.supply_id
                        ? { ...item, quantity: item.quantity + extraItem.quantity }
                        : item
                )
            );
        } else {
            setItems((prev) => [
                ...prev,
                {
                    supply_id: extraItem.supply_id,
                    supply_name: supply.name,
                    quantity: extraItem.quantity,
                    is_extra: true,
                },
            ]);
        }

        setExtraItem({ supply_id: '', quantity: 0 });
    };

    const handleRemoveItem = (supplyId: string) => {
        setItems((prev) => prev.filter((item) => item.supply_id !== supplyId));
    };

    const handleSubmit = async () => {
        const validItems = items.filter((item) => item.quantity > 0);
        if (validItems.length === 0) {
            alert('Debe agregar al menos un insumo');
            return;
        }

        setSubmitting(true);
        try {
            const consumptionSnapshot: Record<string, number> = {};
            validItems.forEach((item) => {
                consumptionSnapshot[item.supply_name] = item.quantity;
            });

            await createSupplyRequest(
                {
                    terminal,
                    request_type: requestType,
                    items: validItems.map((item) => ({
                        supply_id: item.supply_id,
                        quantity: item.quantity,
                        is_extra: item.is_extra,
                    })),
                },
                session?.supervisorName || 'Usuario',
                consumptionSnapshot
            );
            onSuccess();
        } catch (error) {
            console.error('Error creating request:', error);
            alert('Error al crear la solicitud');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Terminal & Type Selection */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Terminal
                    </label>
                    <select
                        value={terminal}
                        onChange={(e) => setTerminal(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    >
                        {LOCATIONS.TERMINAL.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Tipo de Solicitud
                    </label>
                    <select
                        value={requestType}
                        onChange={(e) => setRequestType(e.target.value as RequestType)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    >
                        <option value="SEMANA">Semana (Lun-Vie)</option>
                        <option value="FIN_SEMANA">Fin de Semana</option>
                        <option value="EXTRA">Extra</option>
                    </select>
                </div>
            </div>

            {/* Info Banner */}
            {requestType !== 'EXTRA' && (
                <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
                    <div className="flex items-start gap-2">
                        <Icon name="info" size={18} className="mt-0.5 flex-shrink-0" />
                        <p>
                            {requestType === 'SEMANA'
                                ? 'Calculo automatico para Lunes a Viernes incluyendo noches de lunes a jueves.'
                                : 'Calculo automatico para Viernes noche, Sabado y Domingo completos.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Items Table */}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-2">Insumo</th>
                            <th className="px-4 py-2 text-right w-24">Cantidad</th>
                            <th className="px-4 py-2 w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                                    No hay insumos. Agregue items extra.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.supply_id}>
                                    <td className="px-4 py-2 text-slate-800">
                                        {item.supply_name}
                                        {item.is_extra && (
                                            <span className="ml-2 text-xs text-brand-500">(extra)</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                handleQuantityChange(item.supply_id, parseInt(e.target.value) || 0)
                                            }
                                            className="w-full rounded border border-slate-300 px-2 py-1 text-right text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button
                                            onClick={() => handleRemoveItem(item.supply_id)}
                                            className="rounded p-1 text-slate-400 hover:bg-danger-100 hover:text-danger-600"
                                        >
                                            <Icon name="x" size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Extra Item */}
            <div className="rounded-lg border border-dashed border-slate-300 p-4">
                <p className="mb-3 text-sm font-medium text-slate-700">Agregar insumo extra</p>
                <div className="flex gap-3">
                    <select
                        value={extraItem.supply_id}
                        onChange={(e) => setExtraItem((prev) => ({ ...prev, supply_id: e.target.value }))}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    >
                        <option value="">Seleccionar insumo...</option>
                        {supplies
                            .filter((s) => !items.some((i) => i.supply_id === s.id))
                            .map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                    </select>
                    <input
                        type="number"
                        min="1"
                        placeholder="Cant."
                        value={extraItem.quantity || ''}
                        onChange={(e) =>
                            setExtraItem((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))
                        }
                        className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                    <button
                        onClick={handleAddExtra}
                        disabled={!extraItem.supply_id || extraItem.quantity <= 0}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                    >
                        <Icon name="plus" size={18} />
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-600">
                    Total items: {items.filter((i) => i.quantity > 0).length}
                </span>
                <span className="text-sm font-bold text-slate-800">
                    {items.reduce((sum, i) => sum + i.quantity, 0)} unidades
                </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={onCancel}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting || items.filter((i) => i.quantity > 0).length === 0}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                    {submitting && (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Crear Solicitud
                </button>
            </div>
        </div>
    );
};
