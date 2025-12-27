import { Icon } from '../../../shared/components/common/Icon';
import { useFetchAseoRecords } from '../hooks';

interface Props {
    cleanerId: string;
}

const CLEANING_TYPE_LABELS: Record<string, string> = {
    'BARRIDO': 'Barrido',
    'BARRIDO_Y_TRAPEADO': 'Barrido + Trapeado',
    'FULL': 'Aseo Completo'
};

export const Stats = ({ cleanerId }: Props) => {
    const { data: records = [] } = useFetchAseoRecords(cleanerId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todayRecords = records.filter(r => new Date(r.created_at) >= today);
    const weekRecords = records.filter(r => new Date(r.created_at) >= weekAgo);

    const byType: Record<string, number> = {};
    records.forEach(r => {
        byType[r.cleaning_type] = (byType[r.cleaning_type] || 0) + 1;
    });

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Resumen</h2>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <Icon name="calendar" size={32} className="mb-2 opacity-80" />
                    <p className="text-3xl font-bold">{todayRecords.length}</p>
                    <p className="text-sm opacity-90">Hoy</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                    <Icon name="bar-chart" size={32} className="mb-2 opacity-80" />
                    <p className="text-3xl font-bold">{weekRecords.length}</p>
                    <p className="text-sm opacity-90">Esta semana</p>
                </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <Icon name="sparkles" size={40} className="mb-2 opacity-80" />
                <p className="text-4xl font-bold">{records.length}</p>
                <p className="text-lg opacity-90">Total de registros</p>
            </div>

            {/* By Type */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-slate-900 mb-4">Por Tipo de Aseo</h3>
                <div className="space-y-3">
                    {Object.entries(byType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                            <span className="text-slate-700">{CLEANING_TYPE_LABELS[type]}</span>
                            <span className="font-bold text-blue-600">{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
