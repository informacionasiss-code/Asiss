/**
 * Permission utilities for Meetings module
 * Only authorized managers can create, edit, or cancel meetings
 */

const MEETING_MANAGERS = [
    'ISAAC AVILA',
    'CLAUDIO ARRIAGADA',
    'CRISTIAN LURASCHI',
];

/**
 * Normalize name for comparison (uppercase, trim, remove extra spaces)
 */
const normalizeName = (name: string): string => {
    return name.toUpperCase().trim().replace(/\s+/g, ' ');
};

/**
 * Check if a user can manage meetings (create, edit, cancel)
 */
export const isMeetingManager = (supervisorName: string): boolean => {
    const normalized = normalizeName(supervisorName);
    return MEETING_MANAGERS.some(manager =>
        normalizeName(manager) === normalized ||
        normalized.includes(normalizeName(manager)) ||
        normalizeName(manager).includes(normalized)
    );
};
