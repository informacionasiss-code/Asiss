import { useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { AseoAdminDashboard } from '../components/admin/AseoAdminDashboard';
import { AseoRecordsGallery } from '../components/admin/AseoRecordsGallery';
import { AseoStaffAnalytics } from '../components/admin/AseoStaffAnalytics';
import { AseoTaskManager } from '../components/admin/AseoTaskManager';
import { AseoReportsPanel } from '../components/admin/AseoReportsPanel';
import { AseoPendingBuses } from '../components/admin/AseoPendingBuses';

type AdminSection = 'dashboard' | 'records' | 'staff' | 'tasks' | 'reports' | 'buses';

export const AseoAdminPage = () => {
    const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

    const sections: Array<{ id: AdminSection; label: string; icon: 'bar-chart' | 'image' | 'users' | 'check-circle' | 'file-text' | 'truck' }> = [
        { id: 'dashboard', label: 'Dashboard', icon: 'bar-chart' },
        { id: 'records', label: 'Registros', icon: 'image' },
        { id: 'staff', label: 'Personal', icon: 'users' },
        { id: 'tasks', label: 'Tareas', icon: 'check-circle' },
        { id: 'reports', label: 'Reportes', icon: 'file-text' },
        { id: 'buses', label: 'Buses Pendientes', icon: 'truck' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
                <div className="max-w-[1800px] mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                                <Icon name="sparkles" size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight">Panel de Supervisión - Aseo</h1>
                                <p className="text-blue-100 text-sm font-medium">Gestión Profesional de Limpieza</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                                <div className="text-xs text-blue-100 font-medium">Hoy</div>
                                <div className="text-lg font-bold text-white">{new Date().toLocaleDateString('es-CL')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ${activeSection === section.id
                                        ? 'bg-white text-indigo-700 shadow-lg scale-105'
                                        : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                                    }`}
                            >
                                <Icon name={section.icon} size={18} />
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1800px] mx-auto px-6 py-8">
                {activeSection === 'dashboard' && <AseoAdminDashboard />}
                {activeSection === 'records' && <AseoRecordsGallery />}
                {activeSection === 'staff' && <AseoStaffAnalytics />}
                {activeSection === 'tasks' && <AseoTaskManager />}
                {activeSection === 'reports' && <AseoReportsPanel />}
                {activeSection === 'buses' && <AseoPendingBuses />}
            </div>
        </div>
    );
};
