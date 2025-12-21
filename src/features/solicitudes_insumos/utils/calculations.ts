// =============================================
// SUPPLIES CALCULATION UTILITIES
// =============================================

import { ConsumptionProfile, Supply, LocationType, ConsumptionPeriod, LOCATIONS } from '../types';

interface CalculatedItem {
    supply_id: string;
    supply_name: string;
    quantity: number;
}

interface ConsumptionMap {
    [supplyId: string]: number;
}

/**
 * Builds a map of supply_id -> total quantity from profiles
 */
const buildConsumptionMap = (profiles: ConsumptionProfile[]): ConsumptionMap => {
    const map: ConsumptionMap = {};
    profiles.forEach(p => {
        map[p.supply_id] = (map[p.supply_id] || 0) + p.quantity;
    });
    return map;
};

/**
 * Filters profiles by location type, location name, and periods
 */
const filterProfiles = (
    profiles: ConsumptionProfile[],
    locationType: LocationType,
    locationName: string,
    periods: ConsumptionPeriod[]
): ConsumptionProfile[] => {
    return profiles.filter(
        p =>
            p.location_type === locationType &&
            p.location_name === locationName &&
            periods.includes(p.period)
    );
};

/**
 * Calculate weekday request (Monday through Friday)
 * Terminal El Roble:
 * - 5 days DAY consumption
 * - 4 nights NIGHT consumption (Monday-Thursday nights)
 * 
 * Cabezales:
 * - 5 days DAY consumption
 */
export const calculateWeekdayRequest = (
    profiles: ConsumptionProfile[],
    supplies: Supply[]
): CalculatedItem[] => {
    const result: ConsumptionMap = {};

    // Terminal El Roble - Day (5 days)
    const terminalDayProfiles = filterProfiles(profiles, 'TERMINAL', 'El Roble', ['DAY']);
    const terminalDayMap = buildConsumptionMap(terminalDayProfiles);
    Object.entries(terminalDayMap).forEach(([id, qty]) => {
        result[id] = (result[id] || 0) + qty * 5;
    });

    // Terminal El Roble - Night (4 nights: Mon-Thu)
    const terminalNightProfiles = filterProfiles(profiles, 'TERMINAL', 'El Roble', ['NIGHT']);
    const terminalNightMap = buildConsumptionMap(terminalNightProfiles);
    Object.entries(terminalNightMap).forEach(([id, qty]) => {
        result[id] = (result[id] || 0) + qty * 4;
    });

    // Cabezales - Day (5 days each)
    LOCATIONS.CABEZAL.forEach(cabezal => {
        const cabezalDayProfiles = filterProfiles(profiles, 'CABEZAL', cabezal, ['DAY']);
        const cabezalDayMap = buildConsumptionMap(cabezalDayProfiles);
        Object.entries(cabezalDayMap).forEach(([id, qty]) => {
            result[id] = (result[id] || 0) + qty * 5;
        });
    });

    return convertToItems(result, supplies);
};

/**
 * Calculate weekend request (Friday night through Sunday night)
 * Terminal El Roble:
 * - Friday night: 1 NIGHT
 * - Saturday: 1 DAY + 1 NIGHT
 * - Sunday: 1 DAY + 1 NIGHT
 * Total: 2 DAY + 3 NIGHT
 * 
 * Cabezales:
 * - Saturday + Sunday: 2 WEEKEND days
 */
export const calculateWeekendRequest = (
    profiles: ConsumptionProfile[],
    supplies: Supply[]
): CalculatedItem[] => {
    const result: ConsumptionMap = {};

    // Terminal El Roble - Day (Sat + Sun = 2)
    const terminalDayProfiles = filterProfiles(profiles, 'TERMINAL', 'El Roble', ['DAY']);
    const terminalDayMap = buildConsumptionMap(terminalDayProfiles);
    Object.entries(terminalDayMap).forEach(([id, qty]) => {
        result[id] = (result[id] || 0) + qty * 2;
    });

    // Terminal El Roble - Night (Fri + Sat + Sun = 3)
    const terminalNightProfiles = filterProfiles(profiles, 'TERMINAL', 'El Roble', ['NIGHT']);
    const terminalNightMap = buildConsumptionMap(terminalNightProfiles);
    Object.entries(terminalNightMap).forEach(([id, qty]) => {
        result[id] = (result[id] || 0) + qty * 3;
    });

    // Cabezales - Weekend (2 days each)
    LOCATIONS.CABEZAL.forEach(cabezal => {
        const cabezalWeekendProfiles = filterProfiles(profiles, 'CABEZAL', cabezal, ['WEEKEND']);
        const cabezalWeekendMap = buildConsumptionMap(cabezalWeekendProfiles);
        Object.entries(cabezalWeekendMap).forEach(([id, qty]) => {
            result[id] = (result[id] || 0) + qty * 2;
        });
    });

    return convertToItems(result, supplies);
};

/**
 * Convert consumption map to array of items with supply names
 */
const convertToItems = (
    consumptionMap: ConsumptionMap,
    supplies: Supply[]
): CalculatedItem[] => {
    const supplyMap = new Map(supplies.map(s => [s.id, s]));

    return Object.entries(consumptionMap)
        .filter(([, qty]) => qty > 0)
        .map(([supplyId, quantity]) => ({
            supply_id: supplyId,
            supply_name: supplyMap.get(supplyId)?.name || 'Desconocido',
            quantity,
        }))
        .sort((a, b) => a.supply_name.localeCompare(b.supply_name));
};

/**
 * Determine request type based on current day
 * Monday (1) -> SEMANA
 * Friday (5) -> FIN_SEMANA
 * Other days -> EXTRA
 */
export const getAutoRequestType = (): 'SEMANA' | 'FIN_SEMANA' | 'EXTRA' => {
    const day = new Date().getDay();
    if (day === 1) return 'SEMANA';
    if (day === 5) return 'FIN_SEMANA';
    return 'EXTRA';
};

/**
 * Calculate next delivery date based on life_days
 */
export const calculateNextDelivery = (
    deliveredAt: Date,
    lifeDays: number | null
): Date | null => {
    if (!lifeDays) return null;
    const next = new Date(deliveredAt);
    next.setDate(next.getDate() + lifeDays);
    return next;
};

/**
 * Check if a delivery is due (within alert threshold)
 */
export const isDeliveryDue = (
    nextDeliveryAt: string | null,
    alertDays: number = 3
): boolean => {
    if (!nextDeliveryAt) return false;
    const next = new Date(nextDeliveryAt);
    const now = new Date();
    const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= alertDays;
};

/**
 * Format request type for display
 */
export const formatRequestType = (type: 'SEMANA' | 'FIN_SEMANA' | 'EXTRA'): string => {
    const labels: Record<string, string> = {
        SEMANA: 'Semana',
        FIN_SEMANA: 'Fin de Semana',
        EXTRA: 'Extra',
    };
    return labels[type] || type;
};

/**
 * Format status for display
 */
export const formatStatus = (status: 'PENDIENTE' | 'RETIRADO'): string => {
    return status === 'PENDIENTE' ? 'Pendiente' : 'Retirado';
};
