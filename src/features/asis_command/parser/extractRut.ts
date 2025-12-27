/**
 * RUT Utilities for Asis Command
 * Normalize, validate, and extract Chilean RUT
 */

/**
 * Normalize RUT: remove dots, keep dash, uppercase K
 * Input: "18.866.264-1" or "188662641" or "18866264-1"
 * Output: "18866264-1"
 */
export function normalizeRut(rut: string): string {
    if (!rut) return '';

    // Remove dots and spaces
    let normalized = rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();

    // If no dash, insert it before last character
    if (!normalized.includes('-') && normalized.length > 1) {
        normalized = normalized.slice(0, -1) + '-' + normalized.slice(-1);
    }

    return normalized;
}

/**
 * Validate RUT using Chilean algorithm (Módulo 11)
 */
export function validateRut(rut: string): boolean {
    const normalized = normalizeRut(rut);

    const match = normalized.match(/^(\d{7,8})-?([\dkK])$/i);
    if (!match) return false;

    const body = match[1];
    const providedDv = match[2].toUpperCase();

    // Calculate verification digit
    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i], 10) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = sum % 11;
    const calculatedDv = remainder === 0 ? '0' : remainder === 1 ? 'K' : String(11 - remainder);

    return providedDv === calculatedDv;
}

/**
 * Extract RUT from text using regex
 * Returns the first valid RUT found, normalized
 */
export function extractRut(text: string): string | null {
    if (!text) return null;

    // Pattern matches various RUT formats:
    // 18.866.264-1, 18866264-1, 188662641, 18.866.264-K
    const patterns = [
        /\b(\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK])\b/gi,
        /\brut\s*:?\s*(\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK])\b/gi,
        /\bpara\s+(\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK])\b/gi,
    ];

    for (const pattern of patterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const candidate = match[1];
            const normalized = normalizeRut(candidate);
            if (validateRut(normalized)) {
                return normalized;
            }
        }
    }

    // Try more lenient pattern for just numbers
    const lenientPattern = /\b(\d{7,8})[\s-]?([\dkK])\b/gi;
    const lenientMatches = text.matchAll(lenientPattern);
    for (const match of lenientMatches) {
        const candidate = match[1] + '-' + match[2];
        if (validateRut(candidate)) {
            return normalizeRut(candidate);
        }
    }

    return null;
}

/**
 * Format RUT for display: 18.866.264-1
 */
export function formatRut(rut: string): string {
    const normalized = normalizeRut(rut);
    const match = normalized.match(/^(\d+)-?([\dkK])$/i);
    if (!match) return rut;

    const body = match[1];
    const dv = match[2];

    // Add thousands separators
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formatted}-${dv}`;
}
