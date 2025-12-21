// =============================================
// SUPPLIES API - SUPABASE OPERATIONS
// =============================================

import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import {
    Supply,
    SupplyFormValues,
    ConsumptionProfile,
    SupplyRequest,
    SupplyRequestWithItems,
    SupplyRequestItem,
    RequestFormValues,
    SupplyDelivery,
    DeliveryFormValues,
    SupplyEmailSettings,
} from '../types';
import { calculateNextDelivery } from '../utils/calculations';

// ==========================================
// SUPPLIES CRUD
// ==========================================

export const fetchSupplies = async (): Promise<Supply[]> => {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('supplies')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching supplies:', error);
        throw error;
    }

    return data || [];
};

export const createSupply = async (values: SupplyFormValues): Promise<Supply> => {
    const { data, error } = await supabase
        .from('supplies')
        .insert(values)
        .select()
        .single();

    if (error) {
        console.error('Error creating supply:', error);
        throw error;
    }

    return data;
};

export const updateSupply = async (id: string, values: Partial<SupplyFormValues>): Promise<Supply> => {
    const { data, error } = await supabase
        .from('supplies')
        .update(values)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating supply:', error);
        throw error;
    }

    return data;
};

export const deleteSupply = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('supplies')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting supply:', error);
        throw error;
    }
};

// ==========================================
// CONSUMPTION PROFILES
// ==========================================

export const fetchConsumptionProfiles = async (): Promise<ConsumptionProfile[]> => {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('supply_consumption_profiles')
        .select('*')
        .order('location_type')
        .order('location_name')
        .order('period');

    if (error) {
        console.error('Error fetching consumption profiles:', error);
        throw error;
    }

    return data || [];
};

export const upsertConsumptionProfile = async (
    profile: Omit<ConsumptionProfile, 'id' | 'created_at' | 'updated_at'>
): Promise<ConsumptionProfile> => {
    const { data, error } = await supabase
        .from('supply_consumption_profiles')
        .upsert(profile, {
            onConflict: 'location_type,location_name,period,supply_id',
        })
        .select()
        .single();

    if (error) {
        console.error('Error upserting consumption profile:', error);
        throw error;
    }

    return data;
};

export const deleteConsumptionProfile = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('supply_consumption_profiles')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting consumption profile:', error);
        throw error;
    }
};

// ==========================================
// SUPPLY REQUESTS
// ==========================================

export const fetchSupplyRequests = async (filters?: {
    status?: 'PENDIENTE' | 'RETIRADO';
    terminal?: string;
}): Promise<SupplyRequest[]> => {
    if (!isSupabaseConfigured()) return [];

    let query = supabase
        .from('supply_requests')
        .select('*')
        .order('requested_at', { ascending: false });

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }

    if (filters?.terminal) {
        query = query.eq('terminal', filters.terminal);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching supply requests:', error);
        throw error;
    }

    return data || [];
};

export const fetchSupplyRequestWithItems = async (
    requestId: string
): Promise<SupplyRequestWithItems | null> => {
    if (!isSupabaseConfigured()) return null;

    const { data: request, error: requestError } = await supabase
        .from('supply_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (requestError) {
        console.error('Error fetching supply request:', requestError);
        throw requestError;
    }

    const { data: items, error: itemsError } = await supabase
        .from('supply_request_items')
        .select('*, supply:supplies(*)')
        .eq('request_id', requestId);

    if (itemsError) {
        console.error('Error fetching request items:', itemsError);
        throw itemsError;
    }

    return {
        ...request,
        items: items || [],
    };
};

export const createSupplyRequest = async (
    values: RequestFormValues,
    createdBy: string,
    consumptionSnapshot?: Record<string, number>
): Promise<SupplyRequest> => {
    // Create request
    const { data: request, error: requestError } = await supabase
        .from('supply_requests')
        .insert({
            terminal: values.terminal,
            request_type: values.request_type,
            created_by: createdBy,
            consumption_snapshot: consumptionSnapshot,
        })
        .select()
        .single();

    if (requestError) {
        console.error('Error creating supply request:', requestError);
        throw requestError;
    }

    // Create items
    const itemsToInsert = values.items
        .filter(item => item.quantity > 0)
        .map(item => ({
            request_id: request.id,
            supply_id: item.supply_id,
            quantity: item.quantity,
            is_extra: item.is_extra,
        }));

    if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
            .from('supply_request_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error('Error creating request items:', itemsError);
            throw itemsError;
        }
    }

    return request;
};

export const updateSupplyRequest = async (
    id: string,
    items: { supply_id: string; quantity: number; is_extra: boolean }[]
): Promise<void> => {
    // Delete existing items
    const { error: deleteError } = await supabase
        .from('supply_request_items')
        .delete()
        .eq('request_id', id);

    if (deleteError) {
        console.error('Error deleting request items:', deleteError);
        throw deleteError;
    }

    // Insert new items
    const itemsToInsert = items
        .filter(item => item.quantity > 0)
        .map(item => ({
            request_id: id,
            supply_id: item.supply_id,
            quantity: item.quantity,
            is_extra: item.is_extra,
        }));

    if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
            .from('supply_request_items')
            .insert(itemsToInsert);

        if (insertError) {
            console.error('Error inserting request items:', insertError);
            throw insertError;
        }
    }
};

export const markRequestAsRetrieved = async (id: string): Promise<SupplyRequest> => {
    const { data, error } = await supabase
        .from('supply_requests')
        .update({
            status: 'RETIRADO',
            retrieved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error marking request as retrieved:', error);
        throw error;
    }

    return data;
};

export const deleteSupplyRequest = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('supply_requests')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting supply request:', error);
        throw error;
    }
};

// ==========================================
// RECEIPT UPLOAD
// ==========================================

export const uploadReceipt = async (
    requestId: string,
    file: File
): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${requestId}_${Date.now()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('supply-receipts')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading receipt:', uploadError);
        throw uploadError;
    }

    // Update request with receipt path
    const { error: updateError } = await supabase
        .from('supply_requests')
        .update({ receipt_path: filePath })
        .eq('id', requestId);

    if (updateError) {
        console.error('Error updating receipt path:', updateError);
        throw updateError;
    }

    return filePath;
};

export const getReceiptUrl = async (path: string): Promise<string> => {
    const { data } = await supabase.storage
        .from('supply-receipts')
        .createSignedUrl(path, 3600);

    return data?.signedUrl || '';
};

// ==========================================
// DELIVERIES
// ==========================================

export const fetchDeliveries = async (filters?: {
    staff_rut?: string;
    supply_id?: string;
}): Promise<SupplyDelivery[]> => {
    if (!isSupabaseConfigured()) return [];

    let query = supabase
        .from('supply_deliveries')
        .select('*')
        .order('delivered_at', { ascending: false });

    if (filters?.staff_rut) {
        query = query.eq('staff_rut', filters.staff_rut);
    }

    if (filters?.supply_id) {
        query = query.eq('supply_id', filters.supply_id);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching deliveries:', error);
        throw error;
    }

    return data || [];
};

export const fetchDeliveriesWithSupplies = async (): Promise<(SupplyDelivery & { supply: Supply })[]> => {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('supply_deliveries')
        .select('*, supply:supplies(*)')
        .order('delivered_at', { ascending: false });

    if (error) {
        console.error('Error fetching deliveries with supplies:', error);
        throw error;
    }

    return data || [];
};

export const createDelivery = async (
    values: DeliveryFormValues,
    createdBy: string,
    supplyLifeDays: number | null
): Promise<SupplyDelivery> => {
    const deliveredAt = new Date();
    const nextDeliveryAt = calculateNextDelivery(deliveredAt, supplyLifeDays);

    const { data, error } = await supabase
        .from('supply_deliveries')
        .insert({
            ...values,
            created_by: createdBy,
            delivered_at: deliveredAt.toISOString(),
            next_delivery_at: nextDeliveryAt?.toISOString() || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating delivery:', error);
        throw error;
    }

    return data;
};

// ==========================================
// EMAIL SETTINGS
// ==========================================

export const fetchEmailSettings = async (): Promise<SupplyEmailSettings[]> => {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('supply_email_settings')
        .select('*')
        .order('trigger');

    if (error) {
        console.error('Error fetching email settings:', error);
        throw error;
    }

    return data || [];
};

export const updateEmailSettings = async (
    id: string,
    values: Partial<Omit<SupplyEmailSettings, 'id' | 'trigger' | 'updated_at'>>
): Promise<SupplyEmailSettings> => {
    const { data, error } = await supabase
        .from('supply_email_settings')
        .update(values)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating email settings:', error);
        throw error;
    }

    return data;
};

export const createEmailSettings = async (
    trigger: 'MONDAY' | 'FRIDAY' | 'MANUAL',
    values: { recipients: string; subject: string; body: string; enabled: boolean }
): Promise<SupplyEmailSettings> => {
    const { data, error } = await supabase
        .from('supply_email_settings')
        .insert({ trigger, ...values })
        .select()
        .single();

    if (error) {
        console.error('Error creating email settings:', error);
        throw error;
    }

    return data;
};

export const ensureDefaultEmailSettings = async (): Promise<SupplyEmailSettings[]> => {
    const existing = await fetchEmailSettings();
    if (existing.length > 0) return existing;

    const defaults = [
        { trigger: 'MONDAY' as const, recipients: '', subject: 'Solicitud Semanal de Insumos', body: '', enabled: true },
        { trigger: 'FRIDAY' as const, recipients: '', subject: 'Solicitud Fin de Semana - Insumos', body: '', enabled: true },
        { trigger: 'MANUAL' as const, recipients: '', subject: 'Solicitud Manual de Insumos', body: '', enabled: true },
    ];

    const created: SupplyEmailSettings[] = [];
    for (const def of defaults) {
        try {
            const setting = await createEmailSettings(def.trigger, {
                recipients: def.recipients,
                subject: def.subject,
                body: def.body,
                enabled: def.enabled,
            });
            created.push(setting);
        } catch (err) {
            console.error(`Error creating default email setting for ${def.trigger}:`, err);
        }
    }

    return created;
};

// ==========================================
// STATS
// ==========================================

export const fetchRequestStats = async (): Promise<{ pending: number; retrieved: number }> => {
    if (!isSupabaseConfigured()) return { pending: 0, retrieved: 0 };

    const { data, error } = await supabase
        .from('supply_requests')
        .select('status');

    if (error) {
        console.error('Error fetching request stats:', error);
        throw error;
    }

    const pending = data?.filter(r => r.status === 'PENDIENTE').length || 0;
    const retrieved = data?.filter(r => r.status === 'RETIRADO').length || 0;

    return { pending, retrieved };
};

export const fetchUpcomingDeliveries = async (alertDays: number = 7): Promise<SupplyDelivery[]> => {
    if (!isSupabaseConfigured()) return [];

    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + alertDays);

    const { data, error } = await supabase
        .from('supply_deliveries')
        .select('*, supply:supplies(*)')
        .not('next_delivery_at', 'is', null)
        .lte('next_delivery_at', alertDate.toISOString())
        .order('next_delivery_at');

    if (error) {
        console.error('Error fetching upcoming deliveries:', error);
        throw error;
    }

    return data || [];
};
