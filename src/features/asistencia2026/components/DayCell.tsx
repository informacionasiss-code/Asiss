/**
 * DayCell - Individual day cell component for the attendance grid
 * Shows actual horario (10:00-20:00) or "L" for libre
 * Implements Ley 40 horas (43 hrs in 2026)
 */

import { AttendanceMark, IncidenceCode } from '../types';
import { DAY_COLORS, INCIDENCE_COLORS } from '../utils/colors';

interface DayCellProps {
    date: string;
    isOff: boolean;
    horario?: string; // Actual work schedule e.g., "10:00-20:00"
    reducido?: boolean; // true if this is a reduced hour day (Ley 40 hrs)
    turno?: 'DIA' | 'NOCHE';
    mark?: AttendanceMark;
    incidencies?: IncidenceCode[];
    isToday?: boolean;
    isDisabled?: boolean;
    licenseCode?: string;
    vacationCode?: string;
    permissionCode?: string;
    onClick?: () => void;
}

export const DayCell = ({
    isOff,
    horario,
    reducido = false,
    turno,
    mark,
    incidencies = [],
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
            return `${d.bg} ${d.text} border ${d.border}`;
        }

        // Priority: License > Vacation > Permission > Mark > Off > Work
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
        if (isOff) {
            const c = DAY_COLORS.OFF;
            return `${c.bg} ${c.text} border ${c.border}`;
        }
        // Scheduled work day
        const c = turno === 'NOCHE' ? DAY_COLORS.WORK_NOCHE : DAY_COLORS.WORK_DIA;
        return `${c.bg} ${c.text} border ${c.border}`;
    };

    // Determine what content to show
    const getCenterContent = () => {
        if (licenseCode) return <span className="text-xs font-bold">LIC</span>;
        if (vacationCode) return <span className="text-xs font-bold">VAC</span>;
        if (permissionCode) return <span className="text-xs font-bold">PER</span>;
        if (mark) return <span className="text-lg font-bold">{mark.mark}</span>;
        if (isOff) return <span className="text-lg font-bold text-slate-500">L</span>;

        // Show horario for work days
        if (horario) {
            // Format horario to show just times, possibly shortened
            const formatted = formatHorario(horario, reducido);
            return (
                <div className="text-center leading-tight">
                    <div className="text-[10px] font-semibold">{formatted}</div>
                    {reducido && <div className="text-[8px] text-amber-600">-1h</div>}
                </div>
            );
        }

        // Fallback: show turno indicator
        return <span className="text-xs font-medium">{turno === 'NOCHE' ? 'N' : 'D'}</span>;
    };

    // Get incidence badges (max 2)
    const badges = incidencies.slice(0, 2);

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`
                relative w-full h-14 rounded-md transition-all
                flex flex-col items-center justify-center
                ${getCellStyle()}
                ${isToday ? 'ring-2 ring-brand-500 ring-offset-1' : ''}
                ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 cursor-pointer hover:shadow-md'}
            `}
        >
            {getCenterContent()}

            {/* Incidence badges - positioned at bottom */}
            {badges.length > 0 && (
                <div className="absolute bottom-0.5 left-0.5 right-0.5 flex gap-0.5 justify-center">
                    {badges.map((code) => (
                        <span
                            key={code}
                            className={`text-[7px] font-bold px-0.5 rounded ${INCIDENCE_COLORS[code]}`}
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

/**
 * Format horario for display in cell
 * Input: "10:00-20:00" or "22:00-06:00"
 * Output: "10-20" or "22-06" (shortened)
 * If reducido, show reduced time
 */
function formatHorario(horario: string, reducido: boolean): string {
    if (!horario) return '';

    // Parse 10:00-20:00 format
    const match = horario.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
    if (!match) return horario;

    let startHour = parseInt(match[1], 10);
    const endHour = parseInt(match[3], 10);

    // If reducido (Ley 40 hrs), add 1 hour to start or subtract from end
    if (reducido) {
        // Show start 1 hour later (shorter work day)
        const adjustedStart = (startHour + 1) % 24;
        return `${adjustedStart.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}`;
    }

    return `${startHour.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}`;
}

function getIncidenceLabel(code: IncidenceCode): string {
    const labels: Record<IncidenceCode, string> = {
        NM: 'No Marcación',
        NC: 'Sin Credencial',
        CD: 'Cambio de Día',
        AUT: 'Autorización',
    };
    return labels[code] || code;
}
