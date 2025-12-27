import { useState, useEffect } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useCreateSrlRequest, useUpdateSrlRequest, useSrlRequests } from '../hooks';
import { SrlStatus, SrlCriticality } from '../types';
import { TerminalCode } from '../../../shared/types/terminal';
import { useSessionStore } from '../../../shared/state/sessionStore';
import { BusBlock } from './BusBlock';

interface Props {
    requestId: string | null;
    onSuccess: () => void;
}

export const RequestForm = ({ requestId, onSuccess }: Props) => {
    const { session } = useSessionStore();
    const createMutation = useCreateSrlRequest();
    const updateMutation = useUpdateSrlRequest(); // Moved here - hooks must be at top level

    const isEdit = !!requestId;
    const { data: requests } = useSrlRequests(isEdit ? { id: requestId!, terminal: 'ALL', status: 'TODOS', criticality: 'TODAS', search: '' } : undefined);
    const existingRequest = requests?.[0];

    const [formData, setFormData] = useState({
        terminal_code: session?.terminalCode || 'EL_ROBLE',
        criticality: 'BAJA' as SrlCriticality,
        applus: false,
        required_date: '',
    });

    // Integrated State: Bus Info + Images
    const [tempBuses, setTempBuses] = useState<{ ppu: string, problem: string, images: File[] }[]>([
        { ppu: '', problem: '', images: [] }
    ]);

    useEffect(() => {
        if (isEdit && existingRequest) {
            setFormData({
                terminal_code: existingRequest.terminal_code as any,
                criticality: existingRequest.criticality,
                applus: existingRequest.applus,
                required_date: existingRequest.required_date || '',
            });
            setTempBuses([]);
        }
    }, [isEdit, existingRequest]);

    const handleAddBus = () => {
        setTempBuses([...tempBuses, { ppu: '', problem: '', images: [] }]);
    };

    const handleRemoveBus = (index: number) => {
        setTempBuses(tempBuses.filter((_, i) => i !== index));
    };

    const handleBusChange = (index: number, field: 'ppu' | 'problem', value: string) => {
        const newBuses = [...tempBuses];
        // @ts-ignore
        newBuses[index] = { ...newBuses[index], [field]: value };
        setTempBuses(newBuses);
    };

    const handleImageSelect = (index: number, files: FileList | null) => {
        if (!files) return;
        const newBuses = [...tempBuses];
        const newImages = Array.from(files);
        newBuses[index].images = [...newBuses[index].images, ...newImages];
        setTempBuses(newBuses);
    };

    const handleRemoveImage = (busIndex: number, imgIndex: number) => {
        const newBuses = [...tempBuses];
        newBuses[busIndex].images = newBuses[busIndex].images.filter((_, i) => i !== imgIndex);
        setTempBuses(newBuses);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validNewBuses = tempBuses.filter(b => b.ppu.trim() !== '');

        if (!isEdit && validNewBuses.length === 0) {
            alert('Debe agregar al menos un bus');
            return;
        }

        try {
            if (isEdit) {
                if (validNewBuses.length > 0) {
                    alert('Por ahora solo se pueden editar los detalles de la solicitud, no agregar nuevos buses.');
                }
                // TODO: Implement actual update logic with updateMutation.mutateAsync()
                onSuccess();
            } else {
                await createMutation.mutateAsync({
                    request: {
                        ...formData,
                        required_date: formData.required_date || null,
                        status: 'CREADA',
                        created_by: session?.supervisorName || 'unknown',
                        created_at: new Date().toISOString()
                    },
                    buses: validNewBuses.map(b => ({
                        ppu: b.ppu.toUpperCase(),
                        problem: b.problem || 'GENERAL',
                        images: b.images
                    }))
                });
                onSuccess();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al guardar');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Section 1: General Info */}
            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Icon name="file-text" size={20} className="text-blue-500" />
                    Información General
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Terminal</label>
                        <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 font-medium transition-all appearance-none"
                            value={formData.terminal_code}
                            onChange={e => setFormData({ ...formData, terminal_code: e.target.value as any })}
                        >
                            <option value="EL_ROBLE">El Roble</option>
                            <option value="LA_REINA">La Reina</option>
                            <option value="MARIA_ANGELICA">María Angélica</option>
                            <option value="EL_DESCANSO">El Descanso</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nivel de Criticidad</label>
                        <div className="relative">
                            <select
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 font-medium transition-all appearance-none"
                                value={formData.criticality}
                                onChange={e => setFormData({ ...formData, criticality: e.target.value as SrlCriticality })}
                            >
                                <option value="BAJA">Baja (Normal)</option>
                                <option value="MEDIA">Media (Urgente)</option>
                                <option value="ALTA">Alta (Crítica)</option>
                            </select>
                            <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                                <Icon name="chevron-down" size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 flex flex-col md:flex-row md:items-center gap-6 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 rounded-lg transition-colors">
                            <div className={`
                                w-5 h-5 rounded border flex items-center justify-center transition-all duration-200
                                ${formData.applus ? 'bg-blue-600 border-blue-600 scale-110' : 'bg-white border-slate-400 group-hover:border-blue-500'}
                             `}>
                                {formData.applus && <Icon name="check" size={14} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={formData.applus} onChange={e => setFormData({ ...formData, applus: e.target.checked })} />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Requiere Certificación APPLUS</span>
                        </label>

                        <div className="flex-1 max-w-xs ml-auto">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Fecha Requerida (Opcional)</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.required_date}
                                onChange={e => setFormData({ ...formData, required_date: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Buses */}
            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Icon name="truck" size={20} className="text-amber-500" />
                        Flota Afectada
                    </h3>
                    {!isEdit && (
                        <button
                            type="button"
                            onClick={handleAddBus}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 border border-blue-100"
                        >
                            <Icon name="plus" size={16} /> Agregar Bus
                        </button>
                    )}
                </div>

                {/* Existing Buses View */}
                {isEdit && existingRequest?.srl_request_buses && (
                    <div className="space-y-4 mb-6">
                        {existingRequest.srl_request_buses.map(bus => (
                            <BusBlock
                                key={bus.id}
                                busId={bus.id}
                                busPpu={bus.bus_ppu}
                                problem={bus.problem_type || 'Sin problema especificado'}
                                status={existingRequest.status}
                                requestId={existingRequest.id}
                            />
                        ))}
                    </div>
                )}

                {/* New Bus Inputs */}
                <div className="space-y-4">
                    {tempBuses.map((bus, idx) => (
                        <div key={idx} className="p-5 bg-slate-50/50 rounded-xl border border-slate-200 group hover:border-blue-300 hover:bg-white transition-all shadow-sm">
                            <div className="flex flex-col md:flex-row gap-4 items-start mb-4">
                                <div className="w-full md:w-1/3 max-w-[160px]">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">PPU Bus</label>
                                    <input
                                        placeholder="FL-XP-22"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase font-mono font-bold text-slate-800 outline-none text-base"
                                        value={bus.ppu}
                                        onChange={e => handleBusChange(idx, 'ppu', e.target.value)}
                                        autoFocus={idx === tempBuses.length - 1} // Auto focus new rows
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Descripción del Problema</label>
                                    <input
                                        placeholder="Detalle la falla (ej: Aire acondicionado no enfría)"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-700 outline-none"
                                        value={bus.problem}
                                        onChange={e => handleBusChange(idx, 'problem', e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveBus(idx)}
                                    className="md:mt-6 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-end md:self-start"
                                    title="Eliminar bus"
                                >
                                    <Icon name="trash" size={18} />
                                </button>
                            </div>

                            {/* Image Upload for this Bus */}
                            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200/60">
                                <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all text-xs font-semibold text-slate-600 group/upload">
                                    <Icon name="image" size={16} className="text-slate-400 group-hover/upload:text-blue-500 transition-colors" />
                                    Adjuntar Fotos
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageSelect(idx, e.target.files)}
                                    />
                                </label>

                                {bus.images.map((img, imgIdx) => (
                                    <div key={imgIdx} className="relative group/img animate-in zoom-in duration-200">
                                        <div className="h-8 pl-2 pr-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-600 shadow-sm max-w-[180px]">
                                            <Icon name="file" size={12} className="text-slate-400" />
                                            <span className="truncate max-w-[120px]">{img.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx, imgIdx)}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all scale-75 group-hover/img:scale-100"
                                            title="Eliminar foto"
                                        >
                                            <Icon name="x" size={10} />
                                        </button>
                                    </div>
                                ))}
                                {bus.images.length === 0 && <span className="text-xs text-slate-400 italic">Sin fotos adjuntas</span>}
                            </div>
                        </div>
                    ))}

                    {tempBuses.length === 0 && !isEdit && (
                        <div onClick={handleAddBus} className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                                <Icon name="plus" className="text-slate-400 group-hover:text-blue-500" size={28} />
                            </div>
                            <p className="font-bold text-slate-700">Agregar Primer Bus</p>
                            <p className="text-sm text-slate-400 mt-1">Haga clic aquí para comenzar a detallar la flota afectada</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 mt-4 z-10 sticky bottom-0 bg-white/95 backdrop-blur py-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onSuccess}
                    className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-lg shadow-blue-500/30 font-bold text-sm flex items-center gap-2 transform active:scale-95 transition-all disabled:opacity-70 disabled:shadow-none"
                >
                    {createMutation.isPending ? <Icon name="loader" className="animate-spin" size={18} /> : (requestId ? <Icon name="save" size={18} /> : <Icon name="send" size={18} />)}
                    {requestId ? 'Guardar Cambios' : 'Generar Solicitud'}
                </button>
            </div>
        </form>
    );
};
