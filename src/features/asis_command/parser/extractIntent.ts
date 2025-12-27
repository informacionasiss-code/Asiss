/**
 * Intent extraction for Asis Command
 * Determines the type of command based on keywords
 */

import { CommandIntent } from '../types';

interface IntentPattern {
    intent: CommandIntent;
    patterns: RegExp[];
    priority: number; // Higher = checked first
}

const INTENT_PATTERNS: IntentPattern[] = [
    {
        intent: 'VACACIONES',
        patterns: [
            /\bvacaciones\b/i,
            /\bvacaci[oó]n\b/i,
            /\bferiado\s+legal\b/i,
        ],
        priority: 10,
    },
    {
        intent: 'LICENCIA',
        patterns: [
            /\blicencia\b/i,
            /\blicencia\s+m[eé]dica\b/i,
            /\blic\.\s*m[eé]dica\b/i,
        ],
        priority: 10,
    },
    {
        intent: 'PERMISO',
        patterns: [
            /\bpermiso\b/i,
            /\bpermiso\s+administrativo\b/i,
            /\bpermiso\s+personal\b/i,
        ],
        priority: 9,
    },
    {
        intent: 'AUTORIZACION_LLEGADA',
        patterns: [
            /\bllegada\s+tard[ií]a\b/i,
            /\bautorizaci[oó]n\s+(?:de\s+)?llegada\b/i,
            /\blleg[oó]\s+tarde\b/i,
            /\batraso\b/i,
            /\bentrada\s+tard[ií]a\b/i,
        ],
        priority: 8,
    },
    {
        intent: 'AUTORIZACION_SALIDA',
        patterns: [
            /\bsalida\s+anticipada\b/i,
            /\bautorizaci[oó]n\s+(?:de\s+)?salida\b/i,
            /\bsalir\s+temprano\b/i,
            /\bsalir\s+antes\b/i,
            /\bretiro\s+anticipado\b/i,
        ],
        priority: 8,
    },
    {
        intent: 'CAMBIO_DIA',
        patterns: [
            /\bcambio\s+de\s+d[ií]a\b/i,
            /\bcambiar\s+(?:el\s+)?d[ií]a\b/i,
            /\bintercambio\s+de\s+d[ií]a\b/i,
            /\bmover\s+(?:el\s+)?turno\b/i,
        ],
        priority: 7,
    },
    {
        intent: 'NO_MARCACION',
        patterns: [
            /\bno\s+marcaci[oó]n\b/i,
            /\bno\s+marc[oó]\b/i,
            /\bsin\s+marcaci[oó]n\b/i,
            /\bolvid[oó]\s+marcar\b/i,
            /\bfalt[oó]\s+marca\b/i,
        ],
        priority: 6,
    },
    {
        intent: 'SIN_CREDENCIAL',
        patterns: [
            /\bsin\s+credencial\b/i,
            /\bolvid[oó]\s+(?:la\s+)?credencial\b/i,
            /\bno\s+tiene\s+credencial\b/i,
            /\bcredencial\s+olvidada\b/i,
        ],
        priority: 5,
    },
];

/**
 * Extract intent from command text
 */
export function extractIntent(text: string): { intent: CommandIntent; confidence: number } {
    if (!text) {
        return { intent: 'UNKNOWN', confidence: 0 };
    }

    const lower = text.toLowerCase();

    // Sort patterns by priority (highest first)
    const sortedPatterns = [...INTENT_PATTERNS].sort((a, b) => b.priority - a.priority);

    for (const { intent, patterns } of sortedPatterns) {
        for (const pattern of patterns) {
            if (pattern.test(lower)) {
                // Calculate confidence based on pattern specificity
                const matchLength = (lower.match(pattern)?.[0]?.length ?? 0);
                const confidence = Math.min(0.9 + (matchLength / text.length) * 0.1, 1);
                return { intent, confidence };
            }
        }
    }

    return { intent: 'UNKNOWN', confidence: 0 };
}

/**
 * Get intent description for display
 */
export function getIntentDescription(intent: CommandIntent): string {
    const descriptions: Record<CommandIntent, string> = {
        VACACIONES: 'Registrar período de vacaciones',
        LICENCIA: 'Registrar licencia médica',
        PERMISO: 'Registrar permiso administrativo',
        AUTORIZACION_LLEGADA: 'Autorizar llegada tardía',
        AUTORIZACION_SALIDA: 'Autorizar salida anticipada',
        CAMBIO_DIA: 'Registrar cambio de día',
        NO_MARCACION: 'Registrar incidencia de no marcación',
        SIN_CREDENCIAL: 'Registrar incidencia sin credencial',
        UNKNOWN: 'Comando no reconocido',
    };
    return descriptions[intent];
}
