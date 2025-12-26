/**
 * Shift Engine - Core logic for calculating work/off days
 * Based on shift type patterns
 */

import {
    ShiftTypeCode,
    VariantCode,
    ShiftPattern,
    StaffShiftSpecialTemplate,
    StaffShiftOverride,
} from '../types';

// Reference date for cycle calculations (Monday, Jan 1, 2026 = Wednesday, so we use Monday Dec 30, 2024)
const CYCLE_REFERENCE_DATE = new Date('2025-12-29'); // Monday before 2026

/**
 * Get the number of days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Get the week number in cycle (0-indexed)
 */
function getWeekInCycle(date: Date, cycleWeeks: number): number {
    const days = daysBetween(CYCLE_REFERENCE_DATE, date);
    const weeks = Math.floor(days / 7);
    return weeks % cycleWeeks;
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
function getDayOfWeek(date: Date): number {
    return date.getDay();
}

/**
 * Check if a date string is within a range
 */
export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
    return date >= startDate && date <= endDate;
}

/**
 * Calculate if a specific date is an OFF day for a shift type
 */
export function isOffDay(
    dateStr: string,
    shiftTypeCode: ShiftTypeCode,
    variantCode: VariantCode,
    pattern: ShiftPattern,
    specialTemplate?: StaffShiftSpecialTemplate,
    override?: StaffShiftOverride
): boolean {
    // Check for override first
    if (override) {
        return override.override_type === 'OFF';
    }

    const date = new Date(dateStr + 'T12:00:00'); // Noon to avoid TZ issues
    const dayOfWeek = getDayOfWeek(date);

    switch (pattern.type) {
        case 'fixed': {
            // 5x2 FIJO: Saturday (6) and Sunday (0) are off
            return pattern.offDays?.includes(dayOfWeek) ?? false;
        }

        case 'rotating': {
            // 5x2 ROTATIVO or 5x2 SUPER with week-based cycle
            if (!pattern.weeks || !pattern.cycle) return false;

            let weekIndex = getWeekInCycle(date, pattern.cycle);

            // For CONTRATURNO variant, invert the week index
            if (variantCode === 'CONTRATURNO') {
                weekIndex = (weekIndex + 1) % pattern.cycle;
            }

            const weekPattern = pattern.weeks[weekIndex];
            return weekPattern?.offDays?.includes(dayOfWeek) ?? false;
        }

        case 'manual': {
            // ESPECIAL: Use 28-day template
            if (!specialTemplate || !pattern.cycleDays) return false;

            const days = daysBetween(CYCLE_REFERENCE_DATE, date);
            const dayInCycle = ((days % pattern.cycleDays) + pattern.cycleDays) % pattern.cycleDays;

            return specialTemplate.off_days_json.includes(dayInCycle);
        }

        default:
            return false;
    }
}

/**
 * Determine if turno is DIA or NOCHE based on horario string
 */
export function getTurnoFromHorario(horario: string): 'DIA' | 'NOCHE' {
    if (!horario) return 'DIA';

    // Parse start time from horario (e.g., "10:00-20:00" or "22:00-06:00")
    const match = horario.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return 'DIA';

    const startHour = parseInt(match[1], 10);

    // Night shift typically starts at 20:00 or later, or before 06:00
    if (startHour >= 20 || startHour < 6) {
        return 'NOCHE';
    }

    return 'DIA';
}

/**
 * Get days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Generate array of dates for a month
 */
export function getMonthDates(year: number, month: number): string[] {
    const daysInMonth = getDaysInMonth(year, month);
    const dates: string[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
}

/**
 * Format date to display day number
 */
export function formatDayNumber(dateStr: string): number {
    return new Date(dateStr + 'T12:00:00').getDate();
}

/**
 * Format date to display day of week abbreviation
 */
export function formatDayOfWeek(dateStr: string): string {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const date = new Date(dateStr + 'T12:00:00');
    return dayNames[date.getDay()];
}

/**
 * Check if a date is today
 */
export function isToday(dateStr: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
}

/**
 * Check if a date is in the past
 */
export function isPastDate(dateStr: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
}

/**
 * Get month name in Spanish
 */
export function getMonthName(month: number): string {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month];
}

/**
 * Calculate day in 28-day cycle for special templates
 */
export function getDayInCycle(dateStr: string, cycleDays: number = 28): number {
    const date = new Date(dateStr + 'T12:00:00');
    const days = daysBetween(CYCLE_REFERENCE_DATE, date);
    return ((days % cycleDays) + cycleDays) % cycleDays;
}

/**
 * Get the Monday of the week containing the given date
 */
export function getWeekStart(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
}

/**
 * Get array of 7 dates for a week starting from Monday
 */
export function getWeekDates(weekStartDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(weekStartDate + 'T12:00:00');

    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }

    return dates;
}

/**
 * Get previous week's Monday
 */
export function getPreviousWeek(weekStartDate: string): string {
    const date = new Date(weekStartDate + 'T12:00:00');
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
}

/**
 * Get next week's Monday
 */
export function getNextWeek(weekStartDate: string): string {
    const date = new Date(weekStartDate + 'T12:00:00');
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
}

/**
 * Format week range for display (e.g., "30 Dic - 5 Ene 2026")
 */
export function formatWeekRange(weekStartDate: string): string {
    const dates = getWeekDates(weekStartDate);
    const start = new Date(dates[0] + 'T12:00:00');
    const end = new Date(dates[6] + 'T12:00:00');

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const startDay = start.getDate();
    const startMonth = monthNames[start.getMonth()];
    const endDay = end.getDate();
    const endMonth = monthNames[end.getMonth()];
    const year = end.getFullYear();

    if (start.getMonth() === end.getMonth()) {
        return `${startDay} - ${endDay} ${startMonth} ${year}`;
    }

    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
}

/**
 * Get reduced hour days for Ley 40 horas
 * In 2026: 43 hours/week = need to reduce 2 days per week by 1 hour each
 * Strategy: Tuesday and Thursday are reduced days (middle of work week)
 */
export function getReducedHourDays(weekStartDate: string): string[] {
    const dates = getWeekDates(weekStartDate);
    // Tuesday (index 1) and Thursday (index 3) are reduced days
    return [dates[1], dates[3]];
}

/**
 * Calculate total weekly hours
 * Standard: 9 hrs/day x 5 days = 45 hrs
 * Ley 40 (2026): 43 hrs = 45 - 2 = 43 hrs
 */
export function calculateWeeklyHours(regularDays: number, reducedDays: number): number {
    const REGULAR_HOURS = 9;
    const REDUCED_HOURS = 8;
    return (regularDays * REGULAR_HOURS) + (reducedDays * REDUCED_HOURS);
}

/**
 * Get horario ajustado for reduced days
 * Input: "10:00-20:00" (10 hrs with 1 hr lunch = 9 work)
 * Output for reduced: "11:00-20:00" (9 hrs with 1 hr lunch = 8 work)
 */
export function getAdjustedHorario(horario: string, isReduced: boolean): string {
    if (!horario || !isReduced) return horario;

    const match = horario.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
    if (!match) return horario;

    const startHour = parseInt(match[1], 10);
    const startMin = match[2];
    const endHour = match[3];
    const endMin = match[4];

    // Add 1 hour to start time
    const newStartHour = (startHour + 1) % 24;
    return `${newStartHour.toString().padStart(2, '0')}:${startMin}-${endHour}:${endMin}`;
}
