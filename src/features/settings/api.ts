import { supabase } from '../../shared/lib/supabaseClient';

export interface AppConfig {
    id: string;
    key: string;
    value: any;
    description: string;
    updated_at: string;
}

export interface EmailConfig {
    to: string[];
    cc: string[];
}

export const fetchAppConfig = async <T>(key: string): Promise<T | null> => {
    const { data, error } = await supabase
        .from('app_configuration')
        .select('value')
        .eq('key', key)
        .single();

    if (error) {
        // If config doesn't exist, return null
        if (error.code === 'PGRST116') return null;
        console.error(`Error fetching config ${key}:`, error);
        return null;
    }

    return data.value as T;
};

export const updateAppConfig = async <T extends object>(key: string, value: T, description?: string): Promise<void> => {
    const { error } = await supabase
        .from('app_configuration')
        .upsert({
            key,
            value,
            ...(description ? { description } : {})
        }, { onConflict: 'key' });

    if (error) {
        console.error(`Error updating config ${key}:`, error);
        throw error;
    }
};
