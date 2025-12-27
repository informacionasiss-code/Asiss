import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { TerminalContext } from '../../shared/types/terminal';
import {
    fetchStaff,
    fetchStaffById,
    fetchStaffCounts,
    fetchStaffCaps,
    fetchAdmonitions,
    createStaff,
    updateStaff,
    offboardStaff,
    suspendStaff,
    unsuspendStaff,
    createAdmonition,
    subscribeToStaffChanges,
} from './api';
import { StaffFilters, StaffFormValues, Staff } from './types';

// ==========================================
// QUERY KEYS
// ==========================================

export const staffKeys = {
    all: ['staff'] as const,
    lists: () => [...staffKeys.all, 'list'] as const,
    list: (terminalContext: TerminalContext, filters?: StaffFilters) =>
        [...staffKeys.lists(), terminalContext, filters] as const,
    details: () => [...staffKeys.all, 'detail'] as const,
    detail: (id: string) => [...staffKeys.details(), id] as const,
    counts: (terminalContext: TerminalContext) => [...staffKeys.all, 'counts', terminalContext] as const,
    caps: () => [...staffKeys.all, 'caps'] as const,
    admonitions: (staffId: string) => [...staffKeys.all, 'admonitions', staffId] as const,
};

// ==========================================
// QUERIES
// ==========================================

export const useStaffList = (terminalContext: TerminalContext, filters?: StaffFilters) => {
    return useQuery({
        queryKey: staffKeys.list(terminalContext, filters),
        queryFn: () => fetchStaff(terminalContext, filters),
    });
};

export const useStaffById = (id: string | null) => {
    return useQuery({
        queryKey: staffKeys.detail(id || ''),
        queryFn: () => (id ? fetchStaffById(id) : null),
        enabled: Boolean(id),
    });
};

export const useStaffCounts = (terminalContext: TerminalContext) => {
    return useQuery({
        queryKey: staffKeys.counts(terminalContext),
        queryFn: () => fetchStaffCounts(terminalContext),
    });
};

export const useStaffCaps = () => {
    return useQuery({
        queryKey: staffKeys.caps(),
        queryFn: () => fetchStaffCaps('ER_LR'),
    });
};

export const useStaffAdmonitions = (staffId: string | null) => {
    return useQuery({
        queryKey: staffKeys.admonitions(staffId || ''),
        queryFn: () => (staffId ? fetchAdmonitions(staffId) : []),
        enabled: Boolean(staffId),
    });
};

// ==========================================
// MUTATIONS
// ==========================================

export const useCreateStaff = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (values: StaffFormValues) => createStaff(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
            queryClient.invalidateQueries({ queryKey: staffKeys.counts({} as TerminalContext) });
        },
    });
};

export const useUpdateStaff = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, values }: { id: string; values: Partial<StaffFormValues> }) =>
            updateStaff(id, values),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
            queryClient.invalidateQueries({ queryKey: staffKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: staffKeys.counts({} as TerminalContext) });
        },
    });
};

export const useOffboardStaff = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, comment }: { id: string; comment: string }) =>
            offboardStaff(id, comment),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
            queryClient.invalidateQueries({ queryKey: staffKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: staffKeys.counts({} as TerminalContext) });
        },
    });
};

export const useSuspendStaff = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => suspendStaff(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
            queryClient.invalidateQueries({ queryKey: staffKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: staffKeys.counts({} as TerminalContext) });
        },
    });
};

export const useUnsuspendStaff = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => unsuspendStaff(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
            queryClient.invalidateQueries({ queryKey: staffKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: staffKeys.counts({} as TerminalContext) });
        },
    });
};

export const useCreateAdmonition = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            staffId,
            reason,
            admonitionDate,
            file,
        }: {
            staffId: string;
            reason: string;
            admonitionDate: string;
            file: File;
        }) => createAdmonition(staffId, reason, admonitionDate, file),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: staffKeys.admonitions(data.staff_id) });
            queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
        },
    });
};

// ==========================================
// REALTIME SUBSCRIPTION
// ==========================================

export const useStaffRealtime = (terminalContext: TerminalContext) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const unsubscribe = subscribeToStaffChanges(
            (payload) => {
                console.log('Staff change:', payload.eventType);
                // Invalidate queries on any staff change
                queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
                queryClient.invalidateQueries({ queryKey: staffKeys.counts(terminalContext) });

                if (payload.new) {
                    queryClient.invalidateQueries({ queryKey: staffKeys.detail(payload.new.id) });
                }
            },
            (payload) => {
                console.log('Admonition change:', payload.eventType);
                if (payload.new) {
                    queryClient.invalidateQueries({ queryKey: staffKeys.admonitions(payload.new.staff_id) });
                    queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
                }
            }
        );

        return unsubscribe;
    }, [queryClient, terminalContext]);
};
