/**
 * AttendanceGrid - Main calendar grid component
 * Shows staff rows with day columns for the selected month
 */

import { useMemo, useState } from 'react';
import { DayCell } from './DayCell';
import { DayActionPanel } from './DayActionPanel';
import { CARGO_COLORS } from '../utils/colors';
import {
    StaffWithShift,
    AttendanceMark,
    AttendanceLicense,
    AttendancePermission,
    ShiftType,
    StaffShiftOverride,
    IncidenceCode,
    CARGO_ORDER,
} from '../types';
import {
    getMonthDates,
    formatDayNumber,
    formatDayOfWeek,
    isToday,
    isPastDate,
    isOffDay,
    isDateInRange,
    getTurnoFromHorario,
} from '../utils/shiftEngine';
import { useSessionStore } from '../../../shared/state/sessionStore';
import {
    useCreateOrUpdateMark,
    useCreateLicense,
    useCreatePermission
} from '../hooks';
import { Icon } from '../../../shared/components/common/Icon';

interface IncidenceMap {
    noMarcaciones: { rut: string; date: string }[];
    sinCredenciales: { rut: string; date: string }[];
    cambiosDia: { rut: string; date: string }[];
    autorizaciones: { rut: string; date: string }[];
}

interface AttendanceGridProps {
    staff: StaffWithShift[];
    shiftTypes: ShiftType[];
    marks: AttendanceMark[];
    licenses: AttendanceLicense[];
    permissions: AttendancePermission[];
    vacations: { staff_id: string; start_date: string; end_date: string }[];
    overrides: StaffShiftOverride[];
    incidences: IncidenceMap;
    year: number;
    month: number;
    isLoading?: boolean;
    onRefresh?: () => void;
    onRequestOffboarding?: (staff: StaffWithShift) => void;
}

export const AttendanceGrid = ({
    staff,
    shiftTypes,
    marks,
    licenses,
    permissions,
    vacations,
    overrides,
    incidences,
    year,
    month,
    isLoading = false,
    onRequestOffboarding,
}: AttendanceGridProps) => {
    const session = useSessionStore((s) => s.session);
    const [selectedCell, setSelectedCell] = useState<{
        staff: StaffWithShift;
        date: string;
    } | null>(null);

    const createMarkMutation = useCreateOrUpdateMark();
    const createLicenseMutation = useCreateLicense();
    const createPermissionMutation = useCreatePermission();

    // Get dates for the month
    const dates = useMemo(() => getMonthDates(year, month), [year, month]);

    // Group staff by cargo
    const groupedStaff = useMemo(() => {
        const groups: Record<string, StaffWithShift[]> = {};
        for (const cargo of CARGO_ORDER) {
            groups[cargo] = [];
        }

        for (const s of staff) {
            const cargoUpper = s.cargo.toUpperCase();
            // Map cargo to display group
            let group = 'CLEANER';
            if (cargoUpper.includes('SUPERVISOR')) group = 'SUPERVISOR';
            else if (cargoUpper.includes('INSPECTOR')) group = 'INSPECTOR';
            else if (cargoUpper.includes('CONDUCTOR')) group = 'CONDUCTOR';
            else if (cargoUpper.includes('PLANILLERO')) group = 'PLANILLERO';

            if (groups[group]) {
                groups[group].push(s);
            }
        }

        return groups;
    }, [staff]);

    // Build lookup maps for quick access
    const marksMap = useMemo(() => {
        const map = new Map<string, AttendanceMark>();
        for (const m of marks) {
            map.set(`${m.staff_id}-${m.mark_date}`, m);
        }
        return map;
    }, [marks]);

    const shiftTypesMap = useMemo(() => {
        const map = new Map<string, ShiftType>();
        for (const st of shiftTypes) {
            map.set(st.code, st);
        }
        return map;
    }, [shiftTypes]);

    const overridesMap = useMemo(() => {
        const map = new Map<string, StaffShiftOverride>();
        for (const o of overrides) {
            map.set(`${o.staff_id}-${o.override_date}`, o);
        }
        return map;
    }, [overrides]);

    // Check if staff has license/vacation/permission on a date
    const getLicenseForDate = (staffId: string, date: string) => {
        return licenses.find(
            (l) => l.staff_id === staffId && isDateInRange(date, l.start_date, l.end_date)
        );
    };

    const getVacationForDate = (staffId: string, date: string) => {
        return vacations.find(
            (v) => v.staff_id === staffId && isDateInRange(date, v.start_date, v.end_date)
        );
    };

    const getPermissionForDate = (staffId: string, date: string) => {
        return permissions.find(
            (p) => p.staff_id === staffId && isDateInRange(date, p.start_date, p.end_date)
        );
    };

    // Get incidences for a staff+date
    const getIncidencesForDate = (rut: string, date: string): IncidenceCode[] => {
        const codes: IncidenceCode[] = [];
        if (incidences.noMarcaciones.some((i) => i.rut === rut && i.date === date)) {
            codes.push('NM');
        }
        if (incidences.sinCredenciales.some((i) => i.rut === rut && i.date === date)) {
            codes.push('NC');
        }
        if (incidences.cambiosDia.some((i) => i.rut === rut && i.date === date)) {
            codes.push('CD');
        }
        if (incidences.autorizaciones.some((i) => i.rut === rut && i.date === date)) {
            codes.push('AUT');
        }
        return codes;
    };

    // Calculate day status for a staff on a date
    const getDayStatus = (s: StaffWithShift, date: string) => {
        const mark = marksMap.get(`${s.id}-${date}`);
        const license = getLicenseForDate(s.id, date);
        const vacation = getVacationForDate(s.id, date);
        const permission = getPermissionForDate(s.id, date);
        const override = overridesMap.get(`${s.id}-${date}`);
        const inc = getIncidencesForDate(s.rut, date);

        // Determine if OFF day
        const shiftType = s.shift ? shiftTypesMap.get(s.shift.shift_type_code) : null;
        const pattern = shiftType?.pattern_json;

        let isOff = false;
        if (s.shift && pattern) {
            isOff = isOffDay(date, s.shift.shift_type_code, s.shift.variant_code, pattern, undefined, override);
        }

        // Check if work day in past without mark (pending)
        const isPending =
            !isOff &&
            isPastDate(date) &&
            !mark &&
            !license &&
            !vacation &&
            !permission;

        return {
            mark,
            license,
            vacation,
            permission,
            isOff,
            isPending,
            incidencies: inc,
            turno: getTurnoFromHorario(s.horario),
        };
    };

    // Handle actions
    const handleMarkPresent = () => {
        if (!selectedCell || !session) return;

        createMarkMutation.mutate({
            values: {
                staff_id: selectedCell.staff.id,
                mark_date: selectedCell.date,
                mark: 'P',
            },
            createdBy: session.supervisorName,
        });
        setSelectedCell(null);
    };

    const handleMarkAbsent = (note: string) => {
        if (!selectedCell || !session) return;

        createMarkMutation.mutate({
            values: {
                staff_id: selectedCell.staff.id,
                mark_date: selectedCell.date,
                mark: 'A',
                note,
            },
            createdBy: session.supervisorName,
        });
        setSelectedCell(null);
    };

    const handleRegisterLicense = (startDate: string, endDate: string, note?: string) => {
        if (!selectedCell || !session) return;

        createLicenseMutation.mutate({
            values: {
                staff_id: selectedCell.staff.id,
                start_date: startDate,
                end_date: endDate,
                note,
            },
            createdBy: session.supervisorName,
        });
        setSelectedCell(null);
    };

    const handleRegisterPermission = (
        startDate: string,
        endDate: string,
        type: string,
        note?: string
    ) => {
        if (!selectedCell || !session) return;

        createPermissionMutation.mutate({
            values: {
                staff_id: selectedCell.staff.id,
                start_date: startDate,
                end_date: endDate,
                permission_type: type,
                note,
            },
            createdBy: session.supervisorName,
        });
        setSelectedCell(null);
    };

    const isManager = session && ['Isaac', 'Claudio', 'Cristian'].some(
        (n) => session.supervisorName?.includes(n)
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icon name="loader" size={24} className="animate-spin text-brand-600" />
                <span className="ml-2 text-slate-600">Cargando...</span>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto border rounded-lg bg-white">
                <table className="w-full border-collapse text-sm">
                    {/* Header row with dates */}
                    <thead className="sticky top-0 z-20 bg-slate-50">
                        <tr>
                            <th className="sticky left-0 z-30 bg-slate-100 border-b border-r p-2 text-left min-w-[180px]">
                                <span className="text-slate-700 font-semibold">Personal</span>
                            </th>
                            {dates.map((date) => {
                                const dayNum = formatDayNumber(date);
                                const dayName = formatDayOfWeek(date);
                                const today = isToday(date);

                                return (
                                    <th
                                        key={date}
                                        className={`
                      border-b p-1 text-center min-w-[50px] max-w-[60px]
                      ${today ? 'bg-brand-50 ring-2 ring-inset ring-brand-200' : 'bg-slate-50'}
                    `}
                                    >
                                        <div className="text-[10px] text-slate-500">{dayName}</div>
                                        <div className="text-sm font-semibold text-slate-700">{dayNum}</div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {CARGO_ORDER.map((cargo) => {
                            const staffInGroup = groupedStaff[cargo] || [];
                            if (staffInGroup.length === 0) return null;

                            return (
                                <React.Fragment key={cargo}>
                                    {/* Cargo header row */}
                                    <tr className={CARGO_COLORS[cargo]}>
                                        <td
                                            colSpan={dates.length + 1}
                                            className="sticky left-0 p-2 font-semibold text-slate-700 border-b"
                                        >
                                            {cargo} ({staffInGroup.length})
                                        </td>
                                    </tr>

                                    {/* Staff rows */}
                                    {staffInGroup.map((s) => {
                                        const isDesvinculado = s.status === 'DESVINCULADO';

                                        return (
                                            <tr
                                                key={s.id}
                                                className={`
                          hover:bg-slate-50/50 transition-colors
                          ${isDesvinculado ? 'bg-slate-50 opacity-60' : ''}
                        `}
                                            >
                                                {/* Staff name cell - sticky */}
                                                <td className="sticky left-0 z-10 bg-white border-b border-r p-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`font-medium text-slate-800 truncate ${isDesvinculado ? 'line-through' : ''}`}>
                                                                {s.nombre}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 truncate">
                                                                {s.rut} | {s.horario}
                                                            </div>
                                                        </div>
                                                        {s.admonitionCount && s.admonitionCount > 0 && (
                                                            <span
                                                                className="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded"
                                                                title={`${s.admonitionCount} amonestación(es)`}
                                                            >
                                                                {s.admonitionCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Day cells */}
                                                {dates.map((date) => {
                                                    const status = getDayStatus(s, date);

                                                    return (
                                                        <td key={date} className="border-b p-0.5">
                                                            <DayCell
                                                                date={date}
                                                                statusType={status.isOff ? 'OFF' : 'WORK'}
                                                                horario={status.isOff ? undefined : s.horario}
                                                                turno={status.turno}
                                                                mark={status.mark}
                                                                incidencies={status.incidencies}
                                                                isPending={status.isPending}
                                                                isToday={isToday(date)}
                                                                isDisabled={isDesvinculado}
                                                                licenseCode={status.license ? 'LIC' : undefined}
                                                                vacationCode={status.vacation ? 'VAC' : undefined}
                                                                permissionCode={status.permission ? 'PER' : undefined}
                                                                onClick={() => setSelectedCell({ staff: s, date })}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Action panel */}
            <DayActionPanel
                isOpen={selectedCell !== null}
                onClose={() => setSelectedCell(null)}
                staff={selectedCell?.staff ?? null}
                date={selectedCell?.date ?? ''}
                currentMark={selectedCell ? marksMap.get(`${selectedCell.staff.id}-${selectedCell.date}`)?.mark : undefined}
                currentNote={selectedCell ? marksMap.get(`${selectedCell.staff.id}-${selectedCell.date}`)?.note ?? undefined : undefined}
                incidencies={selectedCell ? getIncidencesForDate(selectedCell.staff.rut, selectedCell.date) : []}
                onMarkPresent={handleMarkPresent}
                onMarkAbsent={handleMarkAbsent}
                onRegisterLicense={handleRegisterLicense}
                onRegisterPermission={handleRegisterPermission}
                onRegisterVacation={() => { }}
                onRequestOffboarding={
                    isManager && onRequestOffboarding && selectedCell
                        ? () => onRequestOffboarding(selectedCell.staff)
                        : undefined
                }
                isManager={isManager ?? false}
            />
        </>
    );
};

// React import for Fragment
import React from 'react';
