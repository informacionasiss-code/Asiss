import { useState } from 'react';
import { CleanerRegistration } from '../components/CleanerRegistration';
import { BottomNav } from '../components/BottomNav';
import { AseoForm } from '../components/AseoForm';
import { MyRecords } from '../components/MyRecords';
import { Tasks } from '../components/Tasks';
import { Stats } from '../components/Stats';
import { Notifications } from '../components/Notifications';
import { useFetchNotifications } from '../hooks';

type Tab = 'form' | 'records' | 'tasks' | 'stats' | 'notifications';

export const AseoMobilePage = () => {
    const [cleanerId, setCleanerId] = useState<string | null>(null);
    const [cleanerName, setCleanerName] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('form');

    const { data: notifications = [] } = useFetchNotifications(cleanerId || undefined);
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleCleanerSet = (id: string, name: string) => {
        setCleanerId(id);
        setCleanerName(name);
    };

    if (!cleanerId || !cleanerName) {
        return <CleanerRegistration onCleanerSet={handleCleanerSet} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Portal Aseo</h1>
                        <p className="text-sm text-blue-100">Hola, {cleanerName}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold">{cleanerName.charAt(0).toUpperCase()}</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="p-4">
                {activeTab === 'form' && <AseoForm cleanerId={cleanerId} cleanerName={cleanerName} />}
                {activeTab === 'records' && <MyRecords cleanerId={cleanerId} />}
                {activeTab === 'tasks' && <Tasks cleanerId={cleanerId} />}
                {activeTab === 'stats' && <Stats cleanerId={cleanerId} />}
                {activeTab === 'notifications' && <Notifications cleanerId={cleanerId} />}
            </main>

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} unreadCount={unreadCount} />
        </div>
    );
};
