/**
 * Duration extraction for Asis Command
 * Parses Spanish duration expressions using native JavaScript
 */

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Extract duration in days from text
 */
export function extractDuration(text: string): number | null {
    if (!text) return null;

    const lower = text.toLowerCase();

    // "por X días", "durante X días", "X días"
    const diasMatch = lower.match(/(?:por|durante)?\s*(\d+)\s*d[ií]as?/i);
    if (diasMatch) {
        return parseInt(diasMatch[1], 10);
    }

    // "por una semana", "por 2 semanas"
    const semanasMatch = lower.match(/(?:por|durante)?\s*(?:una|(\d+))\s*semanas?/i);
    if (semanasMatch) {
        const weeks = semanasMatch[1] ? parseInt(semanasMatch[1], 10) : 1;
        return weeks * 7;
    }

    // "por un mes"
    const mesMatch = lower.match(/(?:por|durante)?\s*(?:un|(\d+))\s*mes(?:es)?/i);
    if (mesMatch) {
        const months = mesMatch[1] ? parseInt(mesMatch[1], 10) : 1;
        return months * 30; // Approximate
    }

    return null;
}

/**
 * Calculate end date from start date and duration
 */
export function calculateEndDate(startDate: string, durationDays: number): string {
    const start = new Date(startDate + 'T12:00:00');
    start.setDate(start.getDate() + durationDays - 1); // Duration includes start day
    return formatDate(start);
}

/**
 * Extract duration description for display
 */
export function formatDuration(days: number): string {
    if (days === 1) return '1 día';
    if (days < 7) return `${days} días`;
    if (days === 7) return '1 semana';
    if (days % 7 === 0) return `${days / 7} semanas`;
    if (days >= 28 && days <= 31) return '1 mes';
    return `${days} días`;
}
