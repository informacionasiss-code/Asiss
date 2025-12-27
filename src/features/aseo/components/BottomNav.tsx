import { Icon } from '../../../shared/components/common/Icon';

type Tab = 'form' | 'records' | 'tasks' | 'stats' | 'notifications';

interface Props {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    unreadCount?: number;
}

export const BottomNav = ({ activeTab, onTabChange, unreadCount = 0 }: Props) => {
    const tabs: Array<{ id: Tab; icon: any; label: string }> = [
        { id: 'form', icon: 'plus-circle', label: 'Registrar' },
        { id: 'records', icon: 'list', label: 'Registros' },
        { id: 'tasks', icon: 'check-square', label: 'Tareas' },
        { id: 'stats', icon: 'bar-chart-2', label: 'Resumen' },
        { id: 'notifications', icon: 'bell', label: 'Avisos' }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50">
            <div className="flex items-center justify-around px-2 py-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${activeTab === tab.id
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <div className="relative">
                            <Icon name={tab.icon} size={24} />
                            {tab.id === 'notifications' && unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-semibold mt-1">{tab.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};
