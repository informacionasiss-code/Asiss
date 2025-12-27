import { supabase } from '../../../shared/lib/supabaseClient';
import { SrlRequest, SrlRequestBus, SrlEmailSetting, SrlFilters, SrlStatus, SrlBusImage } from '../types';

// ==========================================
// REQUESTS
// ==========================================

export async function fetchSrlRequests(filters?: SrlFilters) {
    let query = supabase
        .from('srl_requests')
        .select(`
            *,
            srl_request_buses (
                id, bus_ppu, bus_model, problem_type, observation, applus
            )
        `)
        .order('created_at', { ascending: false });

    if (filters?.terminal && filters.terminal !== 'ALL') {
        query = query.eq('terminal_code', filters.terminal);
    }

    if (filters?.status && filters.status !== 'TODOS') {
        query = query.eq('status', filters.status);
    }

    if (filters?.criticality && filters.criticality !== 'TODAS') {
        query = query.eq('criticality', filters.criticality);
    }

    if (filters?.id) {
        query = query.eq('id', filters.id);
    }

    // Client-side search for PPU might be needed if not joining efficiently, 
    // or use a text search index. For now simple filtering.

    const { data, error } = await query;
    if (error) throw error;
    return data as (SrlRequest & { srl_request_buses: SrlRequestBus[] })[];
}

export async function createSrlRequest(request: Partial<SrlRequest>, buses: Partial<SrlRequestBus>[]) {
    // 1. Create Request Header
    const { data: reqData, error: reqError } = await supabase
        .from('srl_requests')
        .insert(request)
        .select()
        .single();

    if (reqError) throw reqError;

    // 2. Create Buses
    const busesWithId = buses.map(b => ({ ...b, request_id: reqData.id }));
    const { error: busError } = await supabase
        .from('srl_request_buses')
        .insert(busesWithId);

    if (busError) throw busError; // Transaction rollback would be ideal but RLS/Policies prevent full SQL logic here easily without RPC

    return reqData;
}

export async function updateSrlRequest(id: string, updates: Partial<SrlRequest>) {
    const { data, error } = await supabase
        .from('srl_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ==========================================
// BUSES & IMAGES
// ==========================================

export async function fetchBusImages(busId: string) {
    const { data, error } = await supabase
        .from('srl_bus_images')
        .select('*')
        .eq('request_bus_id', busId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Generate Public URLs
    return data.map(img => ({
        ...img,
        publicUrl: supabase.storage.from('srl-images').getPublicUrl(img.storage_path).data.publicUrl
    })) as SrlBusImage[];
}

export async function uploadBusImage(busId: string, file: File) {
    const fileName = `${busId}/${Date.now()}_${file.name}`;

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
        .from('srl-images')
        .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Check DB record creation
    const { data, error: dbError } = await supabase
        .from('srl_bus_images')
        .insert({
            request_bus_id: busId,
            storage_path: fileName,
            mime_type: file.type
        })
        .select()
        .single();

    if (dbError) throw dbError;

    return {
        ...data,
        publicUrl: supabase.storage.from('srl-images').getPublicUrl(fileName).data.publicUrl
    };
}

// ==========================================
// SETTINGS
// ==========================================

export async function fetchSrlEmailSettings() {
    const { data, error } = await supabase
        .from('srl_email_settings')
        .select('*')
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
    return data as SrlEmailSetting | null;
}

export async function updateSrlEmailSettings(settings: Partial<SrlEmailSetting>) {
    // Upsert logic (assuming only 1 row or ID handling)
    // We initialized with ID so we might need to fetch first or force ID if singleton
    // Or just update the existing one if it exists

    // Simplest: update all rows (since policies might restrict) or precise ID
    // Assuming singleton design pattern for settings
    const { error } = await supabase
        .from('srl_email_settings')
        .update(settings)
        .gt('created_at', '2000-01-01'); // Dummy condition to update all

    if (error) throw error;
    return true;
}

// ==========================================
// REALTIME SUBSCRIPTIONS
// ==========================================

export function subscribeToSrlChanges(onChange: () => void): () => void {
    const channel = supabase
        .channel('srl_global_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'srl_requests' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'srl_request_buses' }, onChange)
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

