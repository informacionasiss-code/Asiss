import { useState, useEffect } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import {
    fetchSupplies,
    fetchConsumptionProfiles,
    upsertConsumptionProfile,
    updateSupply,
} from '../api/suppliesApi';
import {
    Supply,
    ConsumptionProfile,
    LocationType,
    ConsumptionPeriod,
    LOCATIONS,
} from '../types';

type TabType = 'consumption' | 'supplies';
type ConsumptionTab = 'TERMINAL' | 'CABEZAL';

export const ConfigConsumption = () => {
    const [activeTab, setActiveTab] = useState<TabType>('consumption');
    const [consumptionTab, setConsumptionTab] = useState<ConsumptionTab>('TERMINAL');
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [profiles, setProfiles] = useState<ConsumptionProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadData = async () => {
        try {
            const [suppliesData, profilesData] = await Promise.all([
                fetchSupplies(),
                fetchConsumptionProfiles(),
            ]);
            setSupplies(suppliesData);
            setProfiles(profilesData);
        } catch (error) {
            console.error('Error loading config data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getProfileQuantity = (
        locationType: LocationType,
        locationName: string,
        period: ConsumptionPeriod,
        supplyId: string
    ): number => {
        const profile = profiles.find(
            (p) =>
                p.location_type === locationType &&
                p.location_name === locationName &&
                p.period === period &&
                p.supply_id === supplyId
        );
        return profile?.quantity || 0;
    };

    const handleProfileChange = async (
        locationType: LocationType,
        locationName: string,
        period: ConsumptionPeriod,
        supplyId: string,
        quantity: number
    ) => {
        setSaving(true);
        try {
            await upsertConsumptionProfile({
                location_type: locationType,
                location_name: locationName,
                period,
                supply_id: supplyId,
                quantity: Math.max(0, quantity),
            });
            await loadData();
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSupplyFieldChange = async (
        supplyId: string,
        field: 'life_days' | 'min_stock',
        value: number | null
    ) => {
        setSaving(true);
        try {
            await updateSupply(supplyId, { [field]: value });
            await loadData();
        } catch (error) {
            console.error('Error updating supply:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    const periods: { key: ConsumptionPeriod; label: string }[] =
        consumptionTab === 'TERMINAL'
            ? [
                { key: 'DAY', label: 'Dia' },
                { key: 'NIGHT', label: 'Noche' },
            ]
            : [
                { key: 'DAY', label: 'Dia (L-V)' },
                { key: 'WEEKEND', label: 'Fin de Semana' },
            ];

    const locations =
        consumptionTab === 'TERMINAL' ? LOCATIONS.TERMINAL : LOCATIONS.CABEZAL;

    return (
        <div className="space-y-4">
            {/* Main Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab('consumption')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'consumption'
                            ? 'bg-brand-500 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    Consumos
                </button>
                <button
                    onClick={() => setActiveTab('supplies')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'supplies'
                            ? 'bg-brand-500 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    Insumos
                </button>
            </div>

            {activeTab === 'consumption' && (
                <div className="space-y-4">
                    {/* Location Type Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setConsumptionTab('TERMINAL')}
                            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${consumptionTab === 'TERMINAL'
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Terminal
                        </button>
                        <button
                            onClick={() => setConsumptionTab('CABEZAL')}
                            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${consumptionTab === 'CABEZAL'
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Cabezales
                        </button>
                    </div>

                    {/* Saving Indicator */}
                    {saving && (
                        <div className="flex items-center gap-2 text-sm text-brand-600">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                            Guardando...
                        </div>
                    )}

                    {/* Consumption Tables */}
                    {locations.map((location) => (
                        <div
                            key={location}
                            className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden"
                        >
                            <div className="border-b border-slate-100 px-4 py-3 bg-slate-50">
                                <h3 className="font-medium text-slate-800">{location}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                            <th className="px-4 py-2">Insumo</th>
                                            {periods.map((p) => (
                                                <th key={p.key} className="px-4 py-2 text-center w-28">
                                                    {p.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {supplies.map((supply) => (
                                            <tr key={supply.id}>
                                                <td className="px-4 py-2 text-slate-800">{supply.name}</td>
                                                {periods.map((p) => (
                                                    <td key={p.key} className="px-4 py-2 text-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={getProfileQuantity(
                                                                consumptionTab,
                                                                location,
                                                                p.key,
                                                                supply.id
                                                            )}
                                                            onChange={(e) =>
                                                                handleProfileChange(
                                                                    consumptionTab,
                                                                    location,
                                                                    p.key,
                                                                    supply.id,
                                                                    parseInt(e.target.value) || 0
                                                                )
                                                            }
                                                            className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'supplies' && (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
                    <div className="border-b border-slate-100 px-4 py-3 bg-slate-50">
                        <h3 className="font-medium text-slate-800">Configuracion de Insumos</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                                    <th className="px-4 py-2">Insumo</th>
                                    <th className="px-4 py-2">Unidad</th>
                                    <th className="px-4 py-2 text-center w-28">Vida Util (dias)</th>
                                    <th className="px-4 py-2 text-center w-28">Stock Minimo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {supplies.map((supply) => (
                                    <tr key={supply.id}>
                                        <td className="px-4 py-2 font-medium text-slate-800">{supply.name}</td>
                                        <td className="px-4 py-2 text-slate-600">{supply.unit}</td>
                                        <td className="px-4 py-2 text-center">
                                            <input
                                                type="number"
                                                min="0"
                                                value={supply.life_days || ''}
                                                placeholder="-"
                                                onChange={(e) =>
                                                    handleSupplyFieldChange(
                                                        supply.id,
                                                        'life_days',
                                                        e.target.value ? parseInt(e.target.value) : null
                                                    )
                                                }
                                                className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <input
                                                type="number"
                                                min="0"
                                                value={supply.min_stock || ''}
                                                placeholder="-"
                                                onChange={(e) =>
                                                    handleSupplyFieldChange(
                                                        supply.id,
                                                        'min_stock',
                                                        parseInt(e.target.value) || 0
                                                    )
                                                }
                                                className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
