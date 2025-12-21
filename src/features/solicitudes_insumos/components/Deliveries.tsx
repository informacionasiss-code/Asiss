import { useState, useEffect } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import {
    fetchSupplies,
    fetchDeliveriesWithSupplies,
    createDelivery
} from '../api/suppliesApi';
import { fetchStaff } from '../../personal/api';
import { Supply, SupplyDelivery, DeliveryFormValues } from '../types';
import { StaffViewModel } from '../../personal/types';
import { isDeliveryDue } from '../utils/calculations';
import { useSessionStore } from '../../../shared/state/sessionStore';

export const Deliveries = () => {
    const session = useSessionStore((state) => state.session);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [deliveries, setDeliveries] = useState<(SupplyDelivery & { supply: Supply })[]>([]);
    const [cleaners, setCleaners] = useState<StaffViewModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState<DeliveryFormValues>({
        supply_id: '',
        staff_rut: '',
        staff_name: '',
        quantity: 1,
        notes: '',
    });

    const loadData = async () => {
        try {
            const [suppliesData, deliveriesData, staffData] = await Promise.all([
                fetchSupplies(),
                fetchDeliveriesWithSupplies(),
                fetchStaff({ mode: 'ALL' }, { cargo: 'cleaner', status: 'ACTIVO' }),
            ]);
            setSupplies(suppliesData);
            setDeliveries(deliveriesData);
            setCleaners(staffData);
        } catch (error) {
            console.error('Error loading deliveries data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCleanerChange = (rut: string) => {
        const cleaner = cleaners.find((c) => c.rut === rut);
        setFormData((prev) => ({
            ...prev,
            staff_rut: rut,
            staff_name: cleaner?.nombre || '',
        }));
    };

    const handleSubmit = async () => {
        if (!formData.supply_id || !formData.staff_rut || formData.quantity <= 0) {
            alert('Complete todos los campos requeridos');
            return;
        }

        setSubmitting(true);
        try {
            const supply = supplies.find((s) => s.id === formData.supply_id);
            await createDelivery(
                formData,
                session?.supervisorName || 'Usuario',
                supply?.life_days || null
            );
            setShowForm(false);
            setFormData({
                supply_id: '',
                staff_rut: '',
                staff_name: '',
                quantity: 1,
                notes: '',
            });
            await loadData();
        } catch (error) {
            console.error('Error creating delivery:', error);
            alert('Error al registrar la entrega');
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    Registro de entregas de insumos a personal de limpieza
                </p>
                <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                    <Icon name="plus" size={18} />
                    <span>Nueva Entrega</span>
                </button>
            </div>

            {/* Deliveries Table */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
                {deliveries.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <Icon name="package" size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No hay entregas registradas</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Personal</th>
                                    <th className="px-4 py-3">Insumo</th>
                                    <th className="px-4 py-3 text-center">Cantidad</th>
                                    <th className="px-4 py-3">Proxima Entrega</th>
                                    <th className="px-4 py-3">Notas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {deliveries.map((delivery) => {
                                    const isDue = isDeliveryDue(delivery.next_delivery_at, 3);
                                    return (
                                        <tr key={delivery.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {new Date(delivery.delivered_at).toLocaleDateString('es-CL')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">
                                                        {delivery.staff_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{delivery.staff_rut}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {delivery.supply?.name || 'Desconocido'}
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm font-medium text-slate-800">
                                                {delivery.quantity}
                                            </td>
                                            <td className="px-4 py-3">
                                                {delivery.next_delivery_at ? (
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isDue
                                                            ? 'bg-danger-100 text-danger-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                            }`}
                                                    >
                                                        {new Date(delivery.next_delivery_at).toLocaleDateString('es-CL')}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500">
                                                {delivery.notes || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* New Delivery Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative mt-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800">Nueva Entrega</h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <Icon name="x" size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Cleaner Selection */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Personal (Cleaner)
                                </label>
                                <select
                                    value={formData.staff_rut}
                                    onChange={(e) => handleCleanerChange(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                >
                                    <option value="">Seleccionar cleaner...</option>
                                    {cleaners.map((c) => (
                                        <option key={c.rut} value={c.rut}>
                                            {c.nombre} ({c.rut})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Supply Selection */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Insumo
                                </label>
                                <select
                                    value={formData.supply_id}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, supply_id: e.target.value }))
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                >
                                    <option value="">Seleccionar insumo...</option>
                                    {supplies.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.unit})
                                            {s.life_days && ` - ${s.life_days} dias vida util`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            quantity: parseInt(e.target.value) || 1,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Notas (opcional)
                                </label>
                                <textarea
                                    value={formData.notes || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, notes: e.target.value }))
                                    }
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                    placeholder="Observaciones..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !formData.supply_id || !formData.staff_rut}
                                    className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                                >
                                    {submitting && (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    )}
                                    Registrar Entrega
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
