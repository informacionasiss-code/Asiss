/**
 * Utilidades para validación y formateo de RUT chileno
 */

/**
 * Normaliza un RUT removiendo puntos, guiones y espacios
 * Ej: "12.345.678-9" -> "123456789"
 */
export const normalizeRut = (rut: string): string => {
    return rut.replace(/[.\-\s]/g, '').toUpperCase();
};

/**
 * Formatea un RUT para display
 * Ej: "123456789" -> "12.345.678-9"
 */
export const formatRut = (rut: string): string => {
    const normalized = normalizeRut(rut);
    if (normalized.length < 2) return normalized;

    const body = normalized.slice(0, -1);
    const dv = normalized.slice(-1);

    // Add dots every 3 digits from right
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formatted}-${dv}`;
};

/**
 * Calcula el dígito verificador de un RUT
 */
export const calculateDV = (rutBody: string): string => {
    const cleanBody = rutBody.replace(/\D/g, '');
    let sum = 0;
    let multiplier = 2;

    for (let i = cleanBody.length - 1; i >= 0; i--) {
        sum += parseInt(cleanBody[i], 10) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = 11 - (sum % 11);

    if (remainder === 11) return '0';
    if (remainder === 10) return 'K';
    return String(remainder);
};

/**
 * Valida un RUT chileno (formato y dígito verificador)
 * Returns: { valid: boolean; error?: string }
 */
export const validateRut = (rut: string): { valid: boolean; error?: string } => {
    if (!rut || rut.trim() === '') {
        return { valid: false, error: 'RUT es requerido' };
    }

    const normalized = normalizeRut(rut);

    // Check format: 7-9 digits + 1 DV
    if (!/^\d{7,9}[0-9K]$/i.test(normalized)) {
        return { valid: false, error: 'Formato de RUT inválido' };
    }

    const body = normalized.slice(0, -1);
    const dv = normalized.slice(-1).toUpperCase();
    const expectedDV = calculateDV(body);

    if (dv !== expectedDV) {
        return { valid: false, error: 'Dígito verificador inválido' };
    }

    return { valid: true };
};

/**
 * Valida y normaliza un RUT, retornando el valor normalizado o null si es inválido
 */
export const parseRut = (rut: string): string | null => {
    const validation = validateRut(rut);
    if (!validation.valid) return null;
    return normalizeRut(rut);
};
