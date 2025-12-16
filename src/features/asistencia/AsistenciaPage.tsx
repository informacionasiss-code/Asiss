import { useState } from 'react';
import { Icon, IconName } from '../../shared/components/common/Icon';
import { NoMarcacionesPage } from './pages/NoMarcacionesPage';
import { SinCredencialesPage } from './pages/SinCredencialesPage';
import { CambiosDeDiaPage } from './pages/CambiosDeDiaPage';
import { AutorizacionesPage } from './pages/AutorizacionesPage';
import { AttendanceSubsection } from './types';

const TABS: { id: AttendanceSubsection; label: string; icon: IconName }[] = [
  { id: 'no-marcaciones', label: 'No Marcaciones', icon: 'clock' },
  { id: 'sin-credenciales', label: 'Sin Credenciales', icon: 'key' },
  { id: 'cambios-dia', label: 'Cambios de Día', icon: 'calendar' },
  { id: 'autorizaciones', label: 'Autorizaciones', icon: 'check-circle' },
];

export const AsistenciaPage = () => {
  const [activeTab, setActiveTab] = useState<AttendanceSubsection>('no-marcaciones');

  const renderContent = () => {
    switch (activeTab) {
      case 'no-marcaciones':
        return <NoMarcacionesPage />;
      case 'sin-credenciales':
        return <SinCredencialesPage />;
      case 'cambios-dia':
        return <CambiosDeDiaPage />;
      case 'autorizaciones':
        return <AutorizacionesPage />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
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

      {/* Content */}
      {renderContent()}
    </div>
  );
};
