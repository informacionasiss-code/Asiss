/**
 * Permission utilities for Tasks module
 * Only authorized managers can create, edit, reassign, and evaluate tasks
 */

const TASK_MANAGERS = [
    'ISAAC AVILA',
    'CLAUDIO ARRIAGADA',
    'CRISTIAN LURASCHI',
];

const normalizeName = (name: string): string => {
    return name.toUpperCase().trim().replace(/\s+/g, ' ');
};

/**
 * Check if a user is a task manager (can create, edit, reassign, evaluate)
 */
export const isTaskManager = (supervisorName: string): boolean => {
    const normalized = normalizeName(supervisorName);
    return TASK_MANAGERS.some(manager =>
        normalizeName(manager) === normalized ||
        normalized.includes(normalizeName(manager)) ||
        normalizeName(manager).includes(normalized)
    );
};

/**
 * Check if user is assigned to a task
 */
export const isTaskAssigned = (supervisorName: string, assignedName: string): boolean => {
    return normalizeName(supervisorName) === normalizeName(assignedName);
};

/**
 * Get allowed status transitions for a user
 */
export const getAllowedTransitions = (
    currentStatus: string,
    isManager: boolean,
    isAssigned: boolean
): string[] => {
    if (isManager) {
        // Managers can transition to any status
        return ['PENDIENTE', 'EN_CURSO', 'TERMINADO', 'EVALUADO', 'RECHAZADO'];
    }

    if (isAssigned) {
        // Assignees can only advance forward (not to EVALUADO/RECHAZADO)
        switch (currentStatus) {
            case 'PENDIENTE': return ['EN_CURSO'];
            case 'EN_CURSO': return ['TERMINADO'];
            case 'RECHAZADO': return ['EN_CURSO']; // Can restart after rejection
            default: return [];
        }
    }

    return [];
};
