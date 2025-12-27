/**
 * Asis Command API
 * Supabase CRUD operations for command logs and settings
 */

import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { CommandLog, CommandLogInsert, CommandEmailSetting, CommandIntent, ResolvedPerson } from '../types';

// ==========================================
// COMMAND LOGS
// ==========================================

/**
 * Fetch recent command logs
 */
export async function fetchCommandLogs(
    limit: number = 20,
    executedBy?: string
): Promise<CommandLog[]> {
    if (!isSupabaseConfigured()) return [];

    let query = supabase
        .from('asis_command_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (executedBy) {
        query = query.eq('executed_by', executedBy);
    }

    const { data, error } = await query;

    if (error) {
        console.error('fetchCommandLogs error:', error.message);
        return [];
    }

    return data || [];
}

/**
 * Create command log entry
 */
export async function createCommandLog(log: CommandLogInsert): Promise<CommandLog | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('asis_command_logs')
        .insert(log)
        .select()
        .single();

    if (error) {
        console.error('createCommandLog error:', error.message);
        return null;
    }

    return data;
}

// ==========================================
// EMAIL SETTINGS
// ==========================================

/**
 * Fetch email settings for all intents
 */
export async function fetchEmailSettings(): Promise<CommandEmailSetting[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('asis_command_email_settings')
        .select('*')
        .order('intent');

    if (error) {
        console.error('fetchEmailSettings error:', error.message);
        return [];
    }

    return data || [];
}

/**
 * Get email setting for specific intent
 */
export async function getEmailSettingForIntent(intent: CommandIntent): Promise<CommandEmailSetting | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('asis_command_email_settings')
        .select('*')
        .eq('intent', intent)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('getEmailSettingForIntent error:', error.message);
    }

    return data || null;
}

/**
 * Update email setting
 */
export async function updateEmailSetting(
    intent: CommandIntent,
    recipients: string,
    subjectTemplate: string,
    enabled: boolean
): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
        .from('asis_command_email_settings')
        .upsert({
            intent,
            recipients,
            subject_template: subjectTemplate,
            enabled,
        }, { onConflict: 'intent' });

    if (error) {
        console.error('updateEmailSetting error:', error.message);
        return false;
    }

    return true;
}

// ==========================================
// PERSON RESOLUTION
// ==========================================

/**
 * Find person by RUT
 */
export async function findPersonByRut(rut: string): Promise<ResolvedPerson | null> {
    if (!isSupabaseConfigured() || !rut) return null;

    // Normalize RUT for search (try both with and without separators)
    const rutPatterns = [
        rut,
        rut.replace(/-/g, ''),
        rut.replace(/\./g, '').replace(/-/g, ''),
    ];

    for (const rutPattern of rutPatterns) {
        const { data, error } = await supabase
            .from('staff')
            .select('id, rut, nombre, cargo, terminal_code, horario, status')
            .or(`rut.eq.${rutPattern},rut.ilike.%${rutPattern}%`)
            .limit(1)
            .single();

        if (data && !error) {
            return data as ResolvedPerson;
        }
    }

    return null;
}

// ==========================================
// COMMAND EXECUTION
// ==========================================

/**
 * Execute vacation command
 */
export async function executeVacation(
    staffId: string,
    startDate: string,
    endDate: string,
    note: string,
    createdBy: string
): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase no configurado' };

    const { error } = await supabase
        .from('attendance_vacations')
        .insert({
            staff_id: staffId,
            start_date: startDate,
            end_date: endDate,
            note,
            created_by: createdBy,
        });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Execute license command
 */
export async function executeLicense(
    staffId: string,
    startDate: string,
    endDate: string,
    note: string,
    createdBy: string
): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase no configurado' };

    const { error } = await supabase
        .from('attendance_licenses')
        .insert({
            staff_id: staffId,
            start_date: startDate,
            end_date: endDate,
            note,
            created_by: createdBy,
        });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Execute permission command
 */
export async function executePermission(
    staffId: string,
    startDate: string,
    endDate: string,
    permissionType: string,
    note: string,
    createdBy: string
): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase no configurado' };

    const { error } = await supabase
        .from('attendance_permissions')
        .insert({
            staff_id: staffId,
            start_date: startDate,
            end_date: endDate,
            permission_type: permissionType,
            note,
            created_by: createdBy,
        });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}
