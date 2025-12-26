/**
 * Asistencia2026Page - Main page for 2026 attendance management
 */

import { useState, useMemo } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useTerminalStore } from '../../../shared/state/terminalStore';
import { useSessionStore } from '../../../shared/state/sessionStore';
import { TerminalCode } from '../../../shared/types/terminal';
import { emailService } from '../../../shared/services/emailService';
import {
    useShiftTypes,
    useStaffWithShifts,
    useMarksForMonth,
    useLicensesForMonth,
    usePermissionsForMonth,
    useVacationsForMonth,
    useOverridesForMonth,
    useIncidencesForMonth,
    useCreateOffboardingRequest,
    useAsistencia2026Realtime,
} from '../hooks';
import { AttendanceGrid } from '../components/AttendanceGrid';
import { KpiBar } from '../components/KpiBar';
import { ShiftLegend } from '../components/ShiftLegend';
import { RutPdfExportModal } from '../components/RutPdfExportModal';
import { OffboardingRequestModal } from '../components/OffboardingRequestModal';
import { TERMINAL_COLORS, BUTTON_VARIANTS } from '../utils/colors';
import { getMonthName, getTurnoFromHorario, isPastDate } from '../utils/shiftEngine';
import { GridFilters, StaffWithShift, Asistencia2026KPIs } from '../types';
import * as XLSX from 'xlsx';

const TERMINALS: { value: TerminalCode | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'EL_ROBLE', label: 'El Roble' },
    { value: 'LA_REINA', label: 'La Reina' },
];

const TURNO_OPTIONS = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'DIA', label: 'Día' },
    { value: 'NOCHE', label: 'Noche' },
] as const;

export const Asistencia2026Page = () => {
    const terminalContext = useTerminalStore((s) => s.context);
    const session = useSessionStore((s) => s.session);

    // Filters
    const today = new Date();
    const [filters, setFilters] = useState<GridFilters>({
        month: today.getMonth(),
        year: today.getFullYear(),
        terminal: 'ALL',
        turno: 'TODOS',
        search: '',
    });

    // Modals
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [offboardingStaff, setOffboardingStaff] = useState<StaffWithShift | null>(null);

    // Subscribe to realtime changes
    useAsistencia2026Realtime();

    // Data queries
    const { data: shiftTypes = [], isLoading: loadingTypes } = useShiftTypes();
    const { data: staff = [], isLoading: loadingStaff } = useStaffWithShifts(terminalContext, filters);

    const staffIds = useMemo(() => staff.map((s) => s.id), [staff]);

    const { data: marks = [], isLoading: loadingMarks } = useMarksForMonth(
        staffIds,
        filters.year,
        filters.month
    );
    const { data: licenses = [], isLoading: loadingLicenses } = useLicensesForMonth(
        staffIds,
        filters.year,
        filters.month
    );
    const { data: permissions = [], isLoading: loadingPermissions } = usePermissionsForMonth(
        staffIds,
        filters.year,
        filters.month
    );
    const { data: vacations = [], isLoading: loadingVacations } = useVacationsForMonth(
        staffIds,
        filters.year,
        filters.month
    );
    const { data: overrides = [], isLoading: loadingOverrides } = useOverridesForMonth(
        staffIds,
        filters.year,
        filters.month
    );
    const { data: incidences, isLoading: loadingIncidences } = useIncidencesForMonth(
        terminalContext,
        filters.year,
        filters.month
    );

    const offboardingMutation = useCreateOffboardingRequest();

    const isLoading =
        loadingTypes ||
        loadingStaff ||
        loadingMarks ||
        loadingLicenses ||
        loadingPermissions ||
        loadingVacations ||
        loadingOverrides ||
        loadingIncidences;

    // Calculate KPIs
    const kpis = useMemo<Asistencia2026KPIs>(() => {
        const byPosition = {
            SUPERVISOR: 0,
            INSPECTOR: 0,
            CONDUCTOR: 0,
            PLANILLERO: 0,
            CLEANER: 0,
        };

        let programmmedDay = 0;
        let programmedNight = 0;
        let onLicense = 0;
        let onVacation = 0;
        let onPermission = 0;
        let withIncidencies = 0;
        let pendingMarks = 0;

        const todayStr = today.toISOString().split('T')[0];
        const activeIncidenceRuts = new Set<string>();

        if (incidences) {
            incidences.noMarcaciones.forEach((i) => activeIncidenceRuts.add(i.rut));
            incidences.sinCredenciales.forEach((i) => activeIncidenceRuts.add(i.rut));
            incidences.cambiosDia.forEach((i) => activeIncidenceRuts.add(i.rut));
            incidences.autorizaciones.forEach((i) => activeIncidenceRuts.add(i.rut));
        }

        for (const s of staff) {
            // Count by position
            const cargoUpper = s.cargo.toUpperCase();
            if (cargoUpper.includes('SUPERVISOR')) byPosition.SUPERVISOR++;
            else if (cargoUpper.includes('INSPECTOR')) byPosition.INSPECTOR++;
            else if (cargoUpper.includes('CONDUCTOR')) byPosition.CONDUCTOR++;
            else if (cargoUpper.includes('PLANILLERO')) byPosition.PLANILLERO++;
            else byPosition.CLEANER++;

            // Count by turno
            const turno = getTurnoFromHorario(s.horario);
            if (turno === 'DIA') programmmedDay++;
            else programmedNight++;

            // Check absences for today
            const hasLicenseToday = licenses.some(
                (l) => l.staff_id === s.id && todayStr >= l.start_date && todayStr <= l.end_date
            );
            const hasVacationToday = vacations.some(
                (v) => v.staff_id === s.id && todayStr >= v.start_date && todayStr <= v.end_date
            );
            const hasPermissionToday = permissions.some(
                (p) => p.staff_id === s.id && todayStr >= p.start_date && todayStr <= p.end_date
            );

            if (hasLicenseToday) onLicense++;
            if (hasVacationToday) onVacation++;
            if (hasPermissionToday) onPermission++;

            // Count incidences
            if (activeIncidenceRuts.has(s.rut)) withIncidencies++;

            // Count pending marks (work days in past without mark)
            const staffMarks = marks.filter((m) => m.staff_id === s.id);
            const datesInMonth = Array.from(
                { length: new Date(filters.year, filters.month + 1, 0).getDate() },
                (_, i) => {
                    const d = new Date(filters.year, filters.month, i + 1);
                    return d.toISOString().split('T')[0];
                }
            );

            for (const dateStr of datesInMonth) {
                if (!isPastDate(dateStr)) continue;
                const hasMark = staffMarks.some((m) => m.mark_date === dateStr);
                const hasAbsence =
                    licenses.some(
                        (l) => l.staff_id === s.id && dateStr >= l.start_date && dateStr <= l.end_date
                    ) ||
                    vacations.some(
                        (v) => v.staff_id === s.id && dateStr >= v.start_date && dateStr <= v.end_date
                    ) ||
                    permissions.some(
                        (p) => p.staff_id === s.id && dateStr >= p.start_date && dateStr <= p.end_date
                    );

                if (!hasMark && !hasAbsence) {
                    pendingMarks++;
                    break; // Count staff once, not each day
                }
            }
        }

        return {
            byPosition,
            programmmedDay,
            programmedNight,
            onLicense,
            onVacation,
            onPermission,
            withIncidencies,
            pendingMarks,
        };
    }, [staff, marks, licenses, permissions, vacations, incidences, filters, today]);

    // Handle terminal change
    const handleTerminalChange = (terminal: TerminalCode | 'ALL') => {
        setFilters((f) => ({ ...f, terminal }));
    };

    // Handle month navigation
    const handlePrevMonth = () => {
        setFilters((f) => {
            const newMonth = f.month - 1;
            if (newMonth < 0) {
                return { ...f, month: 11, year: f.year - 1 };
            }
            return { ...f, month: newMonth };
        });
    };

    const handleNextMonth = () => {
        setFilters((f) => {
            const newMonth = f.month + 1;
            if (newMonth > 11) {
                return { ...f, month: 0, year: f.year + 1 };
            }
            return { ...f, month: newMonth };
        });
    };

    // Export to XLSX
    const handleExportXlsx = () => {
        const data = staff.map((s) => {
            const staffMarks = marks.filter((m) => m.staff_id === s.id);
            return {
                RUT: s.rut,
                Nombre: s.nombre,
                Cargo: s.cargo,
                Terminal: s.terminal_code,
                Horario: s.horario,
                Turno: s.turno,
                Estado: s.status,
                Presentes: staffMarks.filter((m) => m.mark === 'P').length,
                Ausentes: staffMarks.filter((m) => m.mark === 'A').length,
                Licencias: licenses.filter((l) => l.staff_id === s.id).length,
                Permisos: permissions.filter((p) => p.staff_id === s.id).length,
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
        XLSX.writeFile(wb, `Asistencia_${getMonthName(filters.month)}_${filters.year}.xlsx`);
    };

    // Handle offboarding request
    const handleOffboardingRequest = async (reason: string) => {
        if (!offboardingStaff || !session) return;

        try {
            await offboardingMutation.mutateAsync({
                values: {
                    staff_id: offboardingStaff.id,
                    staff_rut: offboardingStaff.rut,
                    staff_name: offboardingStaff.nombre,
                    terminal_code: offboardingStaff.terminal_code,
                    reason,
                },
                requestedBy: session.supervisorName,
            });

            // Send email notification
            await emailService.sendEmail({
                audience: 'manual',
                manualRecipients: ['rrhh@empresa.cl'], // TODO: Get from settings
                subject: `Solicitud de Desvinculación - ${offboardingStaff.nombre}`,
                body: `
Se ha solicitado la desvinculación del siguiente trabajador:

Nombre: ${offboardingStaff.nombre}
RUT: ${offboardingStaff.rut}
Cargo: ${offboardingStaff.cargo}
Terminal: ${offboardingStaff.terminal_code}

Motivo:
${reason}

Solicitado por: ${session.supervisorName}
Fecha: ${new Date().toLocaleString('es-CL')}
        `.trim(),
                module: 'asistencia',
            });

            setOffboardingStaff(null);
        } catch (error) {
            console.error('Error creating offboarding request:', error);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header bar */}
            <div className="bg-white rounded-lg border p-4 space-y-4">
                {/* Row 1: Month selector + Terminal buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Month selector */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Icon name="chevron-left" size={20} />
                        </button>
                        <div className="text-center min-w-[140px]">
                            <div className="font-semibold text-slate-800">
                                {getMonthName(filters.month)} {filters.year}
                            </div>
                        </div>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Icon name="chevron-right" size={20} />
                        </button>
                    </div>

                    {/* Terminal buttons */}
                    <div className="flex flex-wrap gap-2">
                        {TERMINALS.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => handleTerminalChange(t.value)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filters.terminal === t.value
                                    ? TERMINAL_COLORS[t.value]
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Row 2: Turno filter + Search + Export buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Turno filter */}
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                        {TURNO_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setFilters((f) => ({ ...f, turno: opt.value }))}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filters.turno === opt.value
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-xs">
                        <Icon
                            name="search"
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                            placeholder="Buscar RUT o nombre..."
                            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                    </div>

                    {/* Export buttons */}
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={() => setIsPdfModalOpen(true)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${BUTTON_VARIANTS.secondary}`}
                        >
                            <Icon name="file-text" size={16} />
                            <span className="hidden sm:inline">PDF por RUT</span>
                        </button>
                        <button
                            onClick={handleExportXlsx}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${BUTTON_VARIANTS.secondary}`}
                        >
                            <Icon name="download" size={16} />
                            <span className="hidden sm:inline">Exportar XLSX</span>
                        </button>
                    </div>
                </div>

                {/* Row 3: KPIs */}
                <KpiBar kpis={kpis} isLoading={isLoading} />
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg border p-3">
                <ShiftLegend />
            </div>

            {/* Grid */}
            <AttendanceGrid
                staff={staff}
                shiftTypes={shiftTypes}
                marks={marks}
                licenses={licenses}
                permissions={permissions}
                vacations={vacations}
                overrides={overrides}
                incidences={incidences || { noMarcaciones: [], sinCredenciales: [], cambiosDia: [], autorizaciones: [] }}
                year={filters.year}
                month={filters.month}
                isLoading={isLoading}
                onRequestOffboarding={(s) => setOffboardingStaff(s)}
            />

            {/* PDF Export Modal */}
            <RutPdfExportModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                staff={staff}
                marks={marks}
                licenses={licenses}
                permissions={permissions}
                vacations={vacations}
                year={filters.year}
                month={filters.month}
            />

            {/* Offboarding Modal */}
            <OffboardingRequestModal
                isOpen={offboardingStaff !== null}
                onClose={() => setOffboardingStaff(null)}
                staff={offboardingStaff}
                onSubmit={handleOffboardingRequest}
                isSubmitting={offboardingMutation.isPending}
            />
        </div>
    );
};
