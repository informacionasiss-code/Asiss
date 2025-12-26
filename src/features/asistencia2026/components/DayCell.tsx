/**
 * DayCell - Individual day cell component for the attendance grid
 * Shows day status with proper badge positioning
 */

import { AttendanceMark, IncidenceCode } from '../types';
import { DAY_COLORS, INCIDENCE_COLORS } from '../utils/colors';

interface DayCellProps {
    date: string;
    statusType: 'WORK' | 'OFF';
    turno?: 'DIA' | 'NOCHE';
    mark?: AttendanceMark;
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
    // Determine cell style based on status priority
    const getCellStyle = () => {
        if (isDisabled) {
            const d = DAY_COLORS.DESVINCULADO;
            return `${d.bg} ${d.text} ${d.border}`;
        }

        // Priority: License > Vacation > Permission > Mark > Off > Pending > Work
        if (licenseCode) {
            const c = DAY_COLORS.LIC;
            return `${c.bg} ${c.text} border ${c.border}`;
        }
        if (vacationCode) {
            const c = DAY_COLORS.VAC;
            return `${c.bg} ${c.text} border ${c.border}`;
        }
        if (permissionCode) {
            const c = DAY_COLORS.PER;
            return `${c.bg} ${c.text} border ${c.border}`;
        }
        if (mark) {
            const c = mark.mark === 'P' ? DAY_COLORS.PRESENTE : DAY_COLORS.AUSENTE;
            return `${c.bg} ${c.text} border ${c.border}`;
        }
        if (statusType === 'OFF') {
            const c = DAY_COLORS.OFF;
            return `${c.bg} ${c.text} border ${c.border}`;
        }
        if (isPending) {
            const c = DAY_COLORS.PENDING;
            return `${c.bg} ${c.text} border ${c.border}`;
        }
        // Scheduled work day
        const c = turno === 'NOCHE' ? DAY_COLORS.WORK_NOCHE : DAY_COLORS.WORK_DIA;
        return `${c.bg} ${c.text} border ${c.border}`;
    };

    // Determine what to show in the center
    const getCenterContent = () => {
        if (licenseCode) return 'LIC';
        if (vacationCode) return 'VAC';
        if (permissionCode) return 'PER';
        if (mark) return mark.mark;
        if (statusType === 'OFF') return 'L';
        if (isPending) return '?';

        // Show turno indicator for scheduled work days
        if (turno === 'NOCHE') return 'N';
        return 'D';
    };

    // Get incidence badges (max 2 to fit)
    const badges = incidencies.slice(0, 2);

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`
                relative w-full h-12 rounded-md transition-all
                flex flex-col items-center justify-center
                ${getCellStyle()}
                ${isToday ? 'ring-2 ring-brand-500 ring-offset-1' : ''}
                ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 cursor-pointer'}
            `}
        >
            {/* Main content */}
            <span className="text-sm font-bold">{getCenterContent()}</span>

            {/* Incidence badges - positioned at bottom */}
            {badges.length > 0 && (
                <div className="absolute bottom-0.5 left-0.5 right-0.5 flex gap-0.5 justify-center">
                    {badges.map((code) => (
                        <span
                            key={code}
                            className={`text-[8px] font-bold px-1 rounded ${INCIDENCE_COLORS[code]}`}
                            title={getIncidenceLabel(code)}
                        >
                            {code}
                        </span>
                    ))}
                </div>
            )}
        </button>
    );
};

function getIncidenceLabel(code: IncidenceCode): string {
    const labels: Record<IncidenceCode, string> = {
        NM: 'No Marcación',
        NC: 'Sin Credencial',
        CD: 'Cambio de Día',
        AUT: 'Autorización',
    };
    return labels[code] || code;
}
