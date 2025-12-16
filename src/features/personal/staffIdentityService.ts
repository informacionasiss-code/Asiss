import { fetchStaffByRut } from './api';
import { StaffIdentity } from './types';

/**
 * Service for other sections to look up staff by RUT
 * This provides a minimal identity object without coupling to the UI
 */
export const staffIdentityService = {
    /**
     * Fetch a staff member's identity by RUT
     * Returns null if not found
     */
    getByRut: async (rut: string): Promise<StaffIdentity | null> => {
        const staff = await fetchStaffByRut(rut);

        if (!staff) return null;

        return {
            id: staff.id,
            rut: staff.rut,
            nombre: staff.nombre,
            cargo: staff.cargo,
            terminal_code: staff.terminal_code,
            status: staff.status,
        };
    },

    /**
     * Check if a RUT exists in the system
     */
    exists: async (rut: string): Promise<boolean> => {
        const staff = await fetchStaffByRut(rut);
        return staff !== null;
    },
};
