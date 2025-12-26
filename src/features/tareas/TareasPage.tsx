import { useState } from 'react';
import { Icon, IconName } from '../../shared/components/common/Icon';
import { KanbanView } from './subpages/KanbanView';
import { ListView } from './subpages/ListView';
import { CalendarView } from './subpages/CalendarView';
import { ReportsView } from './subpages/ReportsView';
import { SettingsView } from './subpages/SettingsView';
import { TaskWorkspace } from './workspace/TaskWorkspace';

type Tab = 'kanban' | 'lista' | 'calendario' | 'reportes' | 'config';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'kanban', label: 'Tablero', icon: 'layers' },
  { id: 'lista', label: 'Lista', icon: 'clipboard' },
  { id: 'calendario', label: 'Calendario', icon: 'calendar' },
  { id: 'reportes', label: 'Reportes', icon: 'bar-chart' },
  { id: 'config', label: 'Configuración', icon: 'settings' },
];

export const TareasPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('kanban');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const handleOpenWorkspace = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCloseWorkspace = () => {
    setSelectedTaskId(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'kanban':
        return <KanbanView onOpenTask={handleOpenWorkspace} />;
      case 'lista':
        return <ListView onOpenTask={handleOpenWorkspace} />;
      case 'calendario':
        return <CalendarView onOpenTask={handleOpenWorkspace} />;
      case 'reportes':
        return <ReportsView />;
      case 'config':
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <Icon name={tab.icon} size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {renderContent()}

      {/* Task Workspace Modal */}
      {selectedTaskId && (
        <TaskWorkspace
          taskId={selectedTaskId}
          onClose={handleCloseWorkspace}
        />
      )}
    </div>
  );
};
