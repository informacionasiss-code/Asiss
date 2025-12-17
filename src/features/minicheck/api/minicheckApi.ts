import { minicheckSupabase, isMiniCheckConfigured } from './minicheckClient';
import { MiniCheckFilters, Extintor, Tag, Mobileye, Odometro, Publicidad, MiniCheckResponse } from '../types';
import { resolveTerminalsForContext, TERMINALS } from '../../../shared/utils/terminal';
import { TerminalCode } from '../../../shared/types/terminal';

// Generic Fetcher
const fetchTable = async <T>(
    table: string,
    filters: MiniCheckFilters
): Promise<T[]> => {
    if (!isMiniCheckConfigured()) return [];

    let query = minicheckSupabase
        .from(table)
        .select('*');

    // Terminal Filter - Convert codes to display names for MiniCheck database
    if (filters.terminalContext && filters.terminalContext.mode !== 'ALL') {
        const terminalCodes = resolveTerminalsForContext(filters.terminalContext);
        // Convert codes like 'EL_ROBLE' to display names like 'El Roble'
        const terminalNames = terminalCodes.map(code => TERMINALS[code as TerminalCode]).filter(Boolean);
        if (terminalNames.length > 0) {
            query = query.in('terminal', terminalNames);
        }
    }

    // Search (PPU)
    if (filters.search) {
        query = query.ilike('bus_ppu', `%${filters.search}%`);
    }

    // Date Range
    if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
    }

    // Sort
    const sortBy = filters.sortBy || 'updated_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
        console.error(`Error fetching ${table}:`, error);
        throw error;
    }

    return data as T[];
};

// Specific Fetchers
export const fetchExtintores = (filters: MiniCheckFilters) => fetchTable<Extintor>('extintores', filters);
export const fetchTags = (filters: MiniCheckFilters) => fetchTable<Tag>('tags', filters);
export const fetchMobileye = (filters: MiniCheckFilters) => fetchTable<Mobileye>('mobileye', filters);
export const fetchOdometros = (filters: MiniCheckFilters) => fetchTable<Odometro>('odometro', filters);
export const fetchPublicidad = (filters: MiniCheckFilters) => fetchTable<Publicidad>('publicidad', filters);

// TODO: Implement CRUD (Edit/Delete) if RLS allows
// For now, focusing on READ as primary requirement for Dashboard
