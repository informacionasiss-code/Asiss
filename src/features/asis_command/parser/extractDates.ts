/**
 * Date extraction for Asis Command
 * Parses Spanish natural language dates using native JavaScript
 */

// Helpers
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

// Current date reference
const getToday = () => startOfDay(new Date());

/**
 * Spanish month names to numbers
 */
const MONTH_MAP: Record<string, number> = {
    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
    'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
    'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3,
    'may': 4, 'jun': 5, 'jul': 6, 'ago': 7,
    'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
};

/**
 * Get next occurrence of a weekday (0=Sunday, 1=Monday, etc.)
 */
function getNextWeekday(fromDate: Date, targetDay: number): Date {
    const result = new Date(fromDate);
    const currentDay = result.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    result.setDate(result.getDate() + daysToAdd);
    return result;
}

/**
 * Spanish day names to weekday numbers
 */
const DAY_MAP: Record<string, number> = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miércoles': 3, 'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sábado': 6, 'sabado': 6,
};

/**
 * Extract date from Spanish text
 * Returns ISO date string (YYYY-MM-DD)
 */
export function extractDate(text: string): string | null {
    if (!text) return null;

    const lower = text.toLowerCase().trim();
    const today = getToday();

    // "hoy"
    if (/\bhoy\b/.test(lower)) {
        return formatDate(today);
    }

    // "mañana"
    if (/\bma[ñn]ana\b/.test(lower)) {
        return formatDate(addDays(today, 1));
    }

    // "pasado mañana"
    if (/\bpasado\s+ma[ñn]ana\b/.test(lower)) {
        return formatDate(addDays(today, 2));
    }

    // Relative days: "el próximo lunes", "este viernes"
    // "próximo X" = next occurrence of X (if today is Mon and user says "next Mon", it's +7 days)
    for (const [dayName, dayNum] of Object.entries(DAY_MAP)) {
        // Match "próximo lunes"
        if (new RegExp(`\\bpr[oó]ximo\\s+${dayName}\\b`, 'i').test(lower)) {
            let date = getNextWeekday(today, dayNum);
            // If next weekday is essentially today or very close, "próximo" usually means next week's instance
            if ((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) < 1) {
                date = addDays(date, 7);
            }
            return formatDate(date);
        }

        // Match "este lunes", "el lunes"
        if (new RegExp(`\\b(el|este)\\s+${dayName}\\b`, 'i').test(lower) || new RegExp(`\\b${dayName}\\b`).test(lower)) {
            // "el lunes" usually means the immediate next one (or today)
            return formatDate(getNextWeekday(today, dayNum));
        }
    }

    // ISO format: "2026-01-19"
    const isoMatch = lower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (isoMatch) {
        return isoMatch[0];
    }

    // Spanish format: "19 de enero", "19 de enero de 2026"
    const spanishMatch = lower.match(/\b(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+(\d{4}))?\b/);
    if (spanishMatch) {
        const day = parseInt(spanishMatch[1], 10);
        const monthName = spanishMatch[2];
        const month = MONTH_MAP[monthName];

        if (month !== undefined) {
            let year = spanishMatch[3] ? parseInt(spanishMatch[3], 10) : today.getFullYear();

            // If date already passed this year (and year wasn't specified), use next year
            // Exception: if it's currently Dec and we talk about Jan, it's clearly next year
            const candidate = new Date(year, month, day);
            if (!spanishMatch[3] && candidate < today) {
                // Heuristic: if requests is > 6 months in past, assume next year. 
                // If it's 1 week ago, maybe they mean past? For now assume future commands.
                year += 1;
            }

            return formatDate(new Date(year, month, day));
        }
    }

    // Numeric format: "19/01/2026", "19-01-2026", "19.01.2026"
    const numericMatch = lower.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
    if (numericMatch) {
        const day = parseInt(numericMatch[1], 10);
        const month = parseInt(numericMatch[2], 10) - 1;
        let year = parseInt(numericMatch[3], 10);
        if (year < 100) year += 2000;

        return formatDate(new Date(year, month, day));
    }

    // Short numeric: "19/01" (assume current or next year)
    const shortMatch = lower.match(/\b(\d{1,2})[\/\-.](\d{1,2})\b/);
    if (shortMatch) {
        const day = parseInt(shortMatch[1], 10);
        const month = parseInt(shortMatch[2], 10) - 1;
        let year = today.getFullYear();

        const candidate = new Date(year, month, day);
        if (candidate < today) {
            year += 1;
        }

        return formatDate(new Date(year, month, day));
    }

    return null;
}

/**
 * Extract start and end dates from text
 */
export function extractDateRange(text: string): { startDate: string | null; endDate: string | null } {
    if (!text) return { startDate: null, endDate: null };

    const lower = text.toLowerCase();

    // "desde X hasta Y"
    const desdeHastaMatch = lower.match(/desde\s+(.+?)\s+hasta\s+(.+?)(?:\s|$)/);
    if (desdeHastaMatch) {
        return {
            startDate: extractDate(desdeHastaMatch[1]),
            endDate: extractDate(desdeHastaMatch[2]),
        };
    }

    // "del X al Y"
    const delAlMatch = lower.match(/del?\s+(.+?)\s+al?\s+(.+?)(?:\s|$)/);
    if (delAlMatch) {
        return {
            startDate: extractDate(delAlMatch[1]),
            endDate: extractDate(delAlMatch[2]),
        };
    }

    // "desde X"
    const desdeMatch = lower.match(/desde\s+(.+?)(?:\s+por|\s+durante|$)/);
    if (desdeMatch) {
        return {
            startDate: extractDate(desdeMatch[1]),
            endDate: null,
        };
    }

    // "el X" (single date)
    const elMatch = lower.match(/\bel\s+(.+?)(?:\s+a\s+las|\s+motivo|$)/);
    if (elMatch) {
        const date = extractDate(elMatch[1]);
        return { startDate: date, endDate: date };
    }

    // Fallback: try to find any date in text
    const anyDate = extractDate(text);
    return { startDate: anyDate, endDate: null };
}

/**
 * Extract time from text (HH:mm format)
 */
export function extractTime(text: string): string | null {
    if (!text) return null;

    const lower = text.toLowerCase();

    // "14:00", "14:30", "9:00"
    const timeMatch = lower.match(/\b(\d{1,2}):(\d{2})\b/);
    if (timeMatch) {
        const hour = parseInt(timeMatch[1], 10);
        const minute = parseInt(timeMatch[2], 10);
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
    }

    // "a las 14", "a las 9"
    const alasMatch = lower.match(/a\s+las?\s+(\d{1,2})(?:\s*(?:hrs?|horas?))?/);
    if (alasMatch) {
        const hour = parseInt(alasMatch[1], 10);
        if (hour >= 0 && hour <= 23) {
            return `${hour.toString().padStart(2, '0')}:00`;
        }
    }

    return null;
}

/**
 * Extract time range from text
 */
export function extractTimeRange(text: string): { startTime: string | null; endTime: string | null } {
    if (!text) return { startTime: null, endTime: null };

    const lower = text.toLowerCase();

    // "de 14:00 a 16:00", "14:00-16:00", "14:00 a 16:00"
    const rangeMatch = lower.match(/(\d{1,2}:\d{2})\s*[-a]\s*(\d{1,2}:\d{2})/);
    if (rangeMatch) {
        return {
            startTime: extractTime(rangeMatch[1]),
            endTime: extractTime(rangeMatch[2]),
        };
    }

    // "de 14 a 16"
    const simpleRange = lower.match(/de\s+(\d{1,2})\s+a\s+(\d{1,2})/);
    if (simpleRange) {
        const start = parseInt(simpleRange[1], 10);
        const end = parseInt(simpleRange[2], 10);
        if (start >= 0 && start <= 23 && end >= 0 && end <= 23) {
            return {
                startTime: `${start.toString().padStart(2, '0')}:00`,
                endTime: `${end.toString().padStart(2, '0')}:00`,
            };
        }
    }

    // Single time
    const singleTime = extractTime(text);
    return { startTime: singleTime, endTime: null };
}
