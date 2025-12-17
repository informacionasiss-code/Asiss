// Chilean RUT validation and formatting utilities

/**
 * Clean RUT - remove dots, dashes, and spaces
 */
export const cleanRut = (rut: string): string => {
    return rut.replace(/[.\-\s]/g, '').toUpperCase();
};

/**
 * Format RUT with dots and dash (e.g., 12.345.678-9)
 */
export const formatRut = (rut: string): string => {
    const clean = cleanRut(rut);
    if (clean.length < 2) return clean;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    // Add dots every 3 digits from right
    const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formatted}-${dv}`;
};

/**
 * Validate Chilean RUT
 */
export const validateRut = (rut: string): boolean => {
    const clean = cleanRut(rut);

    if (clean.length < 8 || clean.length > 9) return false;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    // Validate body is numeric
    if (!/^\d+$/.test(body)) return false;

    // Calculate verification digit
    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = sum % 11;
    const calculatedDv = remainder === 0 ? '0' : remainder === 1 ? 'K' : String(11 - remainder);

    return dv === calculatedDv;
};

/**
 * Normalize RUT: clean and format
 */
export const normalizeRut = (rut: string): string => {
    const clean = cleanRut(rut);
    return formatRut(clean);
};
