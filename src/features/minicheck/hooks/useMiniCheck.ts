import { useQuery } from '@tanstack/react-query';
import { MiniCheckFilters } from '../types';
import {
    fetchExtintores,
    fetchTags,
    fetchMobileye,
    fetchOdometros,
    fetchPublicidad
} from '../api/minicheckApi';

export const useExtintores = (filters: MiniCheckFilters) => {
    return useQuery({
        queryKey: ['minicheck', 'extintores', filters],
        queryFn: () => fetchExtintores(filters),
    });
};

export const useTags = (filters: MiniCheckFilters) => {
    return useQuery({
        queryKey: ['minicheck', 'tags', filters],
        queryFn: () => fetchTags(filters),
    });
};

export const useMobileye = (filters: MiniCheckFilters) => {
    return useQuery({
        queryKey: ['minicheck', 'mobileye', filters],
        queryFn: () => fetchMobileye(filters),
    });
};

export const useOdometros = (filters: MiniCheckFilters) => {
    return useQuery({
        queryKey: ['minicheck', 'odometros', filters],
        queryFn: () => fetchOdometros(filters),
    });
};

export const usePublicidad = (filters: MiniCheckFilters) => {
    return useQuery({
        queryKey: ['minicheck', 'publicidad', filters],
        queryFn: () => fetchPublicidad(filters),
    });
};
