import { createClient } from '@supabase/supabase-js';

const minicheckUrl = import.meta.env.VITE_MINICHECK_SUPABASE_URL;
const minicheckAnonKey = import.meta.env.VITE_MINICHECK_SUPABASE_ANON_KEY;

if (!minicheckUrl || !minicheckAnonKey) {
    console.warn('MiniCheck Supabase credentials not configured.');
}

export const minicheckSupabase = createClient(
    minicheckUrl || 'https://placeholder.supabase.co',
    minicheckAnonKey || 'placeholder-key',
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    }
);

export const isMiniCheckConfigured = (): boolean => {
    return Boolean(minicheckUrl && minicheckAnonKey);
};
