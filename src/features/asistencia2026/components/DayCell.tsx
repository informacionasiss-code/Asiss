/**
 * DayCell - Individual cell in the attendance grid
 */

import { DayStatusType, IncidenceCode, AttendanceMark } from '../types';
import { DAY_COLORS, INCIDENCE_COLORS, TODAY_HIGHLIGHT } from '../utils/colors';
import { Icon } from '../../../shared/components/common/Icon';

interface DayCellProps {
    date: string;
    statusType: DayStatusType;
    horario?: string;
    turno?: 'DIA' | 'NOCHE';
    mark?: AttendanceMark | null;
    incidencies?: IncidenceCode[];
    isPending?: boolean;
    isToday?: boolean;
    isDisabled?: boolean;
    licenseCode?: string;
    vacationCode?: string;
    permissionCode?: string;
    onClick?: () => void;
}

export const DayCell = ({
    statusType,
    horario,
    turno,
    mark,
    incidencies = [],
    isPending = false,
    isToday = false,
    isDisabled = false,
    licenseCode,
    vacationCode,
    permissionCode,
    onClick,
}: DayCellProps) => {
    // Determine cell colors based on status
    const getColors = () => {
        if (isDisabled) return DAY_COLORS.DESVINCULADO;
        if (mark?.mark === 'P') return DAY_COLORS.PRESENTE;
        if (mark?.mark === 'A') return DAY_COLORS.AUSENTE;
        if (licenseCode) return DAY_COLORS.LIC;
        if (vacationCode) return DAY_COLORS.VAC;
        if (permissionCode) return DAY_COLORS.PER;
        if (statusType === 'OFF') return DAY_COLORS.OFF;
        if (isPending) return DAY_COLORS.PENDING;
        return turno === 'NOCHE' ? DAY_COLORS.WORK_NOCHE : DAY_COLORS.WORK_DIA;
    };

    const colors = getColors();

    // Determine display content
    const getContent = () => {
        if (mark?.mark === 'P') return 'P';
        if (mark?.mark === 'A') return 'A';
        if (licenseCode) return 'LIC';
        if (vacationCode) return 'VAC';
        if (permissionCode) return 'PER';
        if (statusType === 'OFF') return 'OFF';

        // Show abbreviated horario for work days
        if (horario) {
            const match = horario.match(/^(\d{1,2}:\d{2})/);
            return match ? match[1] : horario.substring(0, 5);
        }

        return '';
    };

    return (
        <button
            type="button"
            onClick={!isDisabled ? onClick : undefined}
            disabled={isDisabled}
            className={`
        relative w-full min-h-[36px] sm:min-h-[40px] p-1
        flex flex-col items-center justify-center
        text-[10px] sm:text-xs font-medium
        border rounded transition-all
        ${colors.bg} ${colors.text} ${colors.border}
        ${isToday ? TODAY_HIGHLIGHT : ''}
        ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:ring-2 hover:ring-brand-300'}
        ${isPending && !mark ? 'ring-1 ring-yellow-400' : ''}
      `}
            title={[
                horario,
                mark?.mark === 'P' ? 'Presente' : mark?.mark === 'A' ? 'Ausente' : '',
                mark?.note,
                isPending ? 'Pendiente de marcar' : '',
            ].filter(Boolean).join(' - ')}
        >
            {/* Main content */}
            <span className={isDisabled ? 'line-through' : ''}>
                {getContent()}
            </span>

            {/* Incidence badges */}
            {incidencies.length > 0 && (
                <div className="absolute -top-1 -right-1 flex gap-0.5">
                    {incidencies.slice(0, 2).map((code) => (
                        <span
                            key={code}
                            className={`
                px-1 py-0.5 text-[8px] font-bold rounded
                border ${INCIDENCE_COLORS[code]}
              `}
                        >
                            {code}
                        </span>
                    ))}
                    {incidencies.length > 2 && (
                        <span className="px-1 py-0.5 text-[8px] font-bold rounded bg-slate-200 text-slate-600">
                            +{incidencies.length - 2}
                        </span>
                    )}
                </div>
            )}

            {/* Pending indicator */}
            {isPending && !mark && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                    <Icon name="alert-circle" size={10} className="text-yellow-600" />
                </div>
            )}
        </button>
    );
};
