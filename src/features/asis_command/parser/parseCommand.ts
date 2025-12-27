/**
 * Main Command Parser for Asis Command
 * Orchestrates all extraction modules
 */

import { ParsedCommand } from '../types';
import { extractRut, normalizeRut } from './extractRut';
import { extractDateRange, extractTimeRange } from './extractDates';
import { extractDuration, calculateEndDate } from './extractDuration';
import { extractIntent } from './extractIntent';

/**
 * Extract reason/motivo from command text
 */
function extractReason(text: string): string | null {
    if (!text) return null;

    const lower = text.toLowerCase();

    // "motivo: X", "motivo X", "por motivo de X"
    const motivoMatch = lower.match(/(?:por\s+)?motivo\s*:?\s*(?:de\s+)?(.+?)(?:\.|$)/i);
    if (motivoMatch) {
        return motivoMatch[1].trim();
    }

    // "razón: X"
    const razonMatch = lower.match(/raz[oó]n\s*:?\s*(.+?)(?:\.|$)/i);
    if (razonMatch) {
        return razonMatch[1].trim();
    }

    // "nota: X"
    const notaMatch = lower.match(/nota\s*:?\s*(.+?)(?:\.|$)/i);
    if (notaMatch) {
        return notaMatch[1].trim();
    }

    return null;
}

/**
 * Parse a command string into structured data
 */
export function parseCommand(text: string): ParsedCommand {
    const errors: string[] = [];

    // Extract intent
    const { intent, confidence } = extractIntent(text);

    // Extract RUT
    const rut = extractRut(text);
    const rutNormalized = rut ? normalizeRut(rut) : null;

    if (!rutNormalized && intent !== 'UNKNOWN') {
        errors.push('No se encontró un RUT válido en el comando');
    }

    // Extract dates
    const { startDate, endDate: rawEndDate } = extractDateRange(text);

    if (!startDate && intent !== 'UNKNOWN') {
        errors.push('No se pudo determinar la fecha de inicio');
    }

    // Extract duration
    const durationDays = extractDuration(text);

    // Calculate end date if not provided but duration is
    let endDate = rawEndDate;
    if (!endDate && startDate && durationDays) {
        endDate = calculateEndDate(startDate, durationDays);
    }

    // For single-day events without end date, set end = start
    if (startDate && !endDate && !durationDays) {
        endDate = startDate;
    }

    // Extract times (for permissions and authorizations)
    const { startTime, endTime } = extractTimeRange(text);

    // Extract reason
    const reason = extractReason(text);

    return {
        intent,
        rut,
        rutNormalized,
        startDate,
        endDate,
        startTime,
        endTime,
        durationDays,
        reason,
        rawText: text,
        confidence,
        errors,
    };
}

/**
 * Validate parsed command for execution
 */
export function validateCommand(parsed: ParsedCommand): { isValid: boolean; errors: string[] } {
    const errors: string[] = [...parsed.errors];

    if (parsed.intent === 'UNKNOWN') {
        errors.push('No se reconoció el tipo de comando. Intenta con: vacaciones, licencia, permiso, llegada tardía, salida anticipada');
    }

    if (!parsed.rutNormalized) {
        errors.push('Se requiere un RUT válido');
    }

    if (!parsed.startDate) {
        errors.push('Se requiere una fecha de inicio');
    }

    // Specific validations per intent
    if (parsed.intent === 'VACACIONES' || parsed.intent === 'LICENCIA') {
        if (!parsed.endDate) {
            errors.push('Se requiere una fecha de término o duración (ej: "por 5 días")');
        }
    }

    if (parsed.intent === 'AUTORIZACION_LLEGADA' || parsed.intent === 'AUTORIZACION_SALIDA') {
        if (!parsed.startTime) {
            errors.push('Se requiere una hora (ej: "a las 09:30")');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// Re-export utilities for external use
export { extractRut, normalizeRut, formatRut } from './extractRut';
export { extractDate, extractDateRange, extractTime, extractTimeRange } from './extractDates';
export { extractDuration, calculateEndDate, formatDuration } from './extractDuration';
export { extractIntent, getIntentDescription } from './extractIntent';
