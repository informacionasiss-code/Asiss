import { Icon } from '../../../../shared/components/common/Icon';

export const AseoPendingBuses = () => {
    // TODO: Integration with Estado de Flota
    const mockBuses = [
        { ppu: 'ABCD12', terminal: 'EL_ROBLE', lastCleaning: '2025-12-20', priority: 'HIGH' as const },
        { ppu: 'EFGH34', terminal: 'CERRILLOS', lastCleaning: '2025-12-22', priority: 'MEDIUM' as const },
        { ppu: 'IJKL56', terminal: 'EL_ROBLE', lastCleaning: '2025-12-23', priority: 'LOW' as const },
    ];

    const getPriorityColor = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
        switch (priority) {
            case 'HIGH': return 'from-red-500 to-rose-600';
            case 'MEDIUM': return 'from-yellow-500 to-amber-600';
            case 'LOW': return 'from-green-500 to-emerald-600';
        }
    };

    const getPriorityLabel = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
        switch (priority) {
            case 'HIGH': return 'Alta';
            case 'MEDIUM': return 'Media';
            case 'LOW': return 'Baja';
        }
    };

    const daysSince = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                                <Icon name="truck" size={20} className="text-white" />
                            </div>
                            Buses Pendientes de Limpieza
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                            {mockBuses.length} buses requieren atención
                        </p>
                    </div>
                </div>

                {/* Buses List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mockBuses.map((bus) => {
                        const days = daysSince(bus.lastCleaning);
                        return (
                            <div key={bus.ppu} className="bg-gradient-to-br from-slate-50 to-red-50 rounded-xl p-5 border-2 border-slate-200 hover:border-red-300 transition-all hover:shadow-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-2xl font-black text-slate-900">{bus.ppu}</div>
                                    <span className={`px-3 py-1 bg-gradient-to-r ${getPriorityColor(bus.priority)} text-white text-xs font-bold rounded-full shadow-lg`}>
                                        {getPriorityLabel(bus.priority)}
                                    </span>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Icon name="briefcase" size={14} />
                                        <span className="font-semibold">{bus.terminal}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Icon name="calendar" size={14} />
                                        <span>Última limpieza: hace <strong>{days} días</strong></span>
                                    </div>
                                </div>
                                <button className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
                                    <Icon name="plus" size={16} />
                                    Asignar Limpieza
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Icon name="info" size={20} className="text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-900">
                        <p className="font-bold mb-1">Integración con Estado de Flota</p>
                        <p className="text-blue-700">Esta sección se actualizará automáticamente con datos reales del módulo de Estado de Flota una vez implementada la integración.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
