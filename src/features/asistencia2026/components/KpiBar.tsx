/**
 * KpiBar - Counter badges for attendance overview
 */

import { Icon } from '../../../shared/components/common/Icon';
import { KPI_COLORS } from '../utils/colors';
import { Asistencia2026KPIs } from '../types';

interface KpiBarProps {
    kpis: Asistencia2026KPIs;
    isLoading?: boolean;
}

export const KpiBar = ({ kpis, isLoading }: KpiBarProps) => {
    if (isLoading) {
        return (
            <div className="flex flex-wrap gap-2">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    const positionItems = [
        { label: 'Sup', value: kpis.byPosition.SUPERVISOR },
        { label: 'Insp', value: kpis.byPosition.INSPECTOR },
        { label: 'Cond', value: kpis.byPosition.CONDUCTOR },
        { label: 'Plan', value: kpis.byPosition.PLANILLERO },
        { label: 'Clean', value: kpis.byPosition.CLEANER },
    ];

    const total = Object.values(kpis.byPosition).reduce((a, b) => a + b, 0);

    return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Position counts */}
            <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg ${KPI_COLORS.count}`}>
                <Icon name="users" size={14} />
                <span className="font-medium">{total}</span>
                <span className="text-slate-500 hidden sm:inline">Total</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
                {positionItems.map((item) => (
                    <div
                        key={item.label}
                        className="px-2 py-1 rounded bg-slate-50 text-slate-600 font-medium"
                        title={item.label}
                    >
                        {item.value}
                    </div>
                ))}
            </div>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            {/* Programmed day/night */}
            <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg ${KPI_COLORS.programmed}`}>
                <Icon name="sun" size={14} />
                <span className="font-medium">{kpis.programmmedDay}</span>
                <span className="hidden sm:inline">Día</span>
            </div>

            <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg bg-indigo-100 text-indigo-700`}>
                <Icon name="moon" size={14} />
                <span className="font-medium">{kpis.programmedNight}</span>
                <span className="hidden sm:inline">Noche</span>
            </div>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            {/* Absences */}
            {kpis.onLicense > 0 && (
                <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg ${KPI_COLORS.license}`}>
                    <Icon name="file-text" size={14} />
                    <span className="font-medium">{kpis.onLicense}</span>
                    <span className="hidden sm:inline">Lic</span>
                </div>
            )}

            {kpis.onVacation > 0 && (
                <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg ${KPI_COLORS.vacation}`}>
                    <Icon name="palmtree" size={14} />
                    <span className="font-medium">{kpis.onVacation}</span>
                    <span className="hidden sm:inline">Vac</span>
                </div>
            )}

            {kpis.onPermission > 0 && (
                <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg ${KPI_COLORS.permission}`}>
                    <Icon name="clock" size={14} />
                    <span className="font-medium">{kpis.onPermission}</span>
                    <span className="hidden sm:inline">Per</span>
                </div>
            )}

            {/* Incidents & pending */}
            {kpis.withIncidencies > 0 && (
                <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg ${KPI_COLORS.incident}`}>
                    <Icon name="alert-triangle" size={14} />
                    <span className="font-medium">{kpis.withIncidencies}</span>
                    <span className="hidden sm:inline">Inc</span>
                </div>
            )}

            {kpis.pendingMarks > 0 && (
                <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg ${KPI_COLORS.pending}`}>
                    <Icon name="alert-circle" size={14} />
                    <span className="font-medium">{kpis.pendingMarks}</span>
                    <span className="hidden sm:inline">Pend</span>
                </div>
            )}
        </div>
    );
};
