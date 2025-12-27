import { useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { RequestsTable } from '../components/RequestsTable';
import { CalendarView } from '../components/CalendarView';
import { ReportsView } from '../components/ReportsView';
import { ConfigView } from '../components/ConfigView';
import { SrlWorkspace } from '../components/SrlWorkspace';
import { useSrlRealtime } from '../hooks';

type SrlTab = 'requests' | 'calendar' | 'reports' | 'config';

export const SrlPage = () => {
    // Enable Realtime updates
    useSrlRealtime();

    const [activeTab, setActiveTab] = useState<SrlTab>('requests');
    const [workspaceOpen, setWorkspaceOpen] = useState(false);
    const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

    const handleOpenWorkspace = (id: string | null) => {
        setActiveRequestId(id);
        setWorkspaceOpen(true);
    };

    const handleCloseWorkspace = () => {
        setWorkspaceOpen(false);
        setActiveRequestId(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Icon name="wrench" className="w-8 h-8 text-blue-600" />
                        Operación SRL
                    </h1>
                    <p className="text-slate-500">Gestión de solicitudes y mantenimiento técnico de buses</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200">
                <TabButton
                    active={activeTab === 'requests'}
                    onClick={() => setActiveTab('requests')}
                    icon="file"
                    label="Solicitudes"
                />
                <TabButton
                    active={activeTab === 'calendar'}
                    onClick={() => setActiveTab('calendar')}
                    icon="calendar"
                    label="Calendario Técnico"
                />
                <TabButton
                    active={activeTab === 'reports'}
                    onClick={() => setActiveTab('reports')}
                    icon="bar-chart"
                    label="Reportes"
                />
                <TabButton
                    active={activeTab === 'config'}
                    onClick={() => setActiveTab('config')}
                    icon="settings"
                    label="Configuración"
                />
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] p-4">
                {activeTab === 'requests' && (
                    <RequestsTable
                        onCreate={() => handleOpenWorkspace(null)}
                        onView={(id) => handleOpenWorkspace(id)}
                    />
                )}
                {activeTab === 'calendar' && <CalendarView />}
                {activeTab === 'reports' && <ReportsView />}
                {activeTab === 'config' && <ConfigView />}
            </div>

            {/* Workspace Slide-over */}
            <SrlWorkspace
                isOpen={workspaceOpen}
                onClose={handleCloseWorkspace}
                requestId={activeRequestId}
            />
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap
            ${active
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }
        `}
    >
        <Icon name={icon as any} className="w-5 h-5" />
        {label}
    </button>
);
