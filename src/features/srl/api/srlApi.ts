import { supabase } from '../../../shared/lib/supabaseClient';
import { SrlRequest, SrlRequestBus, SrlEmailSetting, SrlFilters, SrlStatus, SrlBusImage } from '../types';
import { emailService } from '../../../shared/services/emailService';
import { EmailPayload } from '../../../shared/types/email';

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

    const { data, error } = await query;
    if (error) throw error;
    return data as (SrlRequest & { srl_request_buses: SrlRequestBus[] })[];
}

export async function createSrlRequest(
    request: Partial<SrlRequest>,
    buses: { ppu: string; problem: string; images: File[] }[]
) {
    // Sanitize data
    if (request.required_date === '') {
        request.required_date = null;
    }

    // 1. Create Request Header
    const { data: reqData, error: reqError } = await supabase
        .from('srl_requests')
        .insert(request)
        .select()
        .single();

    if (reqError) throw reqError;

    // 2. Process Buses and Images
    const busErrors: any[] = [];

    for (const bus of buses) {
        // A. Insert Bus
        const { data: busData, error: busError } = await supabase
            .from('srl_request_buses')
            .insert({
                request_id: reqData.id,
                bus_ppu: bus.ppu,
                problem_type: 'GENERAL',
                observation: bus.problem,
                applus: request.applus
            })
            .select()
            .single();

        if (busError) {
            busErrors.push({ bus: bus.ppu, error: busError });
            continue;
        }

        // B. Upload Images
        if (bus.images && bus.images.length > 0) {
            for (const file of bus.images) {
                try {
                    await uploadBusImage(busData.id, file);
                } catch (imgError) {
                    console.error(`Failed to upload image for bus ${bus.ppu}`, imgError);
                }
            }
        }
    }

    // 3. Send Email Notification
    try {
        await sendSrlEmailNotification(reqData.id, 'CREADA');
    } catch (emailError) {
        console.error('Failed to send email notification', emailError);
    }

    return reqData;
}

export async function updateSrlRequest(id: string, updates: Partial<SrlRequest>) {
    // Sanitize
    if (updates.required_date === '') {
        updates.required_date = null;
    }

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

    if (error && error.code !== 'PGRST116') throw error;
    return data as SrlEmailSetting | null;
}

export async function updateSrlEmailSettings(settings: Partial<SrlEmailSetting>) {
    const { error } = await supabase
        .from('srl_email_settings')
        .update(settings)
        .gt('updated_at', '2000-01-01'); // Dummy condition to update all

    if (error) throw error;
    return true;
}

// ==========================================
// EMAIL LOGIC
// ==========================================

export async function sendSrlEmailNotification(requestId: string, trigger: 'CREADA' | 'STATUS_CHANGE') {
    // 1. Fetch Request Details with Relations
    const { data: request, error } = await supabase
        .from('srl_requests')
        .select(`
            *,
            srl_request_buses (
                bus_ppu,
                observation
            )
        `)
        .eq('id', requestId)
        .single();

    if (error || !request) throw new Error('Could not fetch request for email');

    // 2. Fetch Settings
    const settings = await fetchSrlEmailSettings();
    if (!settings || !settings.enabled) return;

    // 3. Prepare Content
    const busesList = request.srl_request_buses
        .map((b: any) => `- PPU: ${b.bus_ppu} | Problema: ${b.observation}`)
        .join('\n');

    const variables: Record<string, string> = {
        '{terminal}': request.terminal_code.replace('_', ' '),
        '{id}': request.id.slice(0, 8),
        '{date}': new Date(request.created_at).toLocaleString('es-CL'),
        '{details}': busesList,
        '{status}': request.status,
        '{buses}': `${request.srl_request_buses.length} Buses`,
        '{criticality}': request.criticality
    };

    let subject = settings.subject_template || 'Solicitud SRL #{id}';
    let body = settings.body_template || 'Nueva solicitud creada.\n\n{details}';

    // Replace variables
    Object.entries(variables).forEach(([key, val]) => {
        const safeVal = val || '';
        subject = subject.replace(new RegExp(key, 'g'), safeVal);
        body = body.replace(new RegExp(key, 'g'), safeVal);
    });

    // 4. Send via Shared Service
    // Need to cast or conform to the existing EmailPayload type which seems strict
    const payload: any = { // Using any to bypass strict checks if types.ts is not fully aligned with service capability, or we align to it
        audience: 'manual',
        manualRecipients: settings.recipients.split(',').map(e => e.trim()).filter(Boolean),
        subject: subject,
        body: body, // usage of body instead of text
        // html: body.replace(/\n/g, '<br/>') // service might not support html field if not in type
    };

    if (settings.cc_emails) {
        payload.cc = settings.cc_emails.split(',').map(e => e.trim()).filter(Boolean);
    }

    return await emailService.sendEmail(payload as EmailPayload);
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
