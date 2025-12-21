import { useState } from 'react';
import { Icon, IconName } from '../../shared/components/common/Icon';
import { Dashboard } from './components/Dashboard';
import { RequestsTable } from './components/RequestsTable';
import { Deliveries } from './components/Deliveries';
import { ConfigConsumption } from './components/ConfigConsumption';
import { ConfigEmails } from './components/ConfigEmails';

type TabKey = 'dashboard' | 'solicitudes' | 'entregas' | 'config';

interface Tab {
    key: TabKey;
    label: string;
    icon: IconName;
}

const TABS: Tab[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'bar-chart' },
    { key: 'solicitudes', label: 'Solicitudes', icon: 'file-text' },
    { key: 'entregas', label: 'Entregas', icon: 'package' },
    { key: 'config', label: 'Configuracion', icon: 'settings' },
];

export const SolicitudesInsumosPage = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
    const [configSubTab, setConfigSubTab] = useState<'consumption' | 'emails'>('consumption');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => setRefreshKey((prev) => prev + 1);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Solicitudes de Insumos</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Gestion inteligente de insumos, solicitudes y entregas a personal
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab.key
                                ? 'bg-brand-500 text-white shadow-brand'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Icon name={tab.icon} size={18} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div key={refreshKey}>
                {activeTab === 'dashboard' && <Dashboard />}

                {activeTab === 'solicitudes' && <RequestsTable onRefresh={handleRefresh} />}

                {activeTab === 'entregas' && <Deliveries />}

                {activeTab === 'config' && (
                    <div className="space-y-4">
                        {/* Config Sub-Tabs */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfigSubTab('consumption')}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${configSubTab === 'consumption'
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Consumos e Insumos
                            </button>
                            <button
                                onClick={() => setConfigSubTab('emails')}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${configSubTab === 'emails'
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Correos
                            </button>
                        </div>

                        {configSubTab === 'consumption' && <ConfigConsumption />}
                        {configSubTab === 'emails' && <ConfigEmails />}
                    </div>
                )}
            </div>
        </div>
    );
};
