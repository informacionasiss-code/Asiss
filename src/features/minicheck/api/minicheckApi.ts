import { minicheckSupabase, isMiniCheckConfigured } from './minicheckClient';
import { MiniCheckFilters, Extintor, Tag, Mobileye, Odometro, Publicidad, MiniCheckResponse } from '../types';
import { resolveTerminalsForContext } from '../../../shared/utils/terminal';

// Generic Fetcher
const fetchTable = async <T>(
    table: string,
    filters: MiniCheckFilters
): Promise<T[]> => {
    if (!isMiniCheckConfigured()) return [];

    let query = minicheckSupabase
        .from(table)
        .select('*');

    // Terminal Filter
    if (filters.terminalContext) {
        const terminals = resolveTerminalsForContext(filters.terminalContext);
        if (terminals.length > 0) {
            query = query.in('terminal', terminals);
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
