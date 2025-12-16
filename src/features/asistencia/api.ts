import { supabase, isSupabaseConfigured } from '../../shared/lib/supabaseClient';
import { TerminalCode, TerminalContext } from '../../shared/types/terminal';
import { resolveTerminalsForContext } from '../../shared/utils/terminal';
import { normalizeName } from './utils/authorizers';
import {
    NoMarcacion,
    NoMarcacionFormValues,
    SinCredencial,
    SinCredencialFormValues,
    CambioDia,
    CambioDiaFormValues,
    Autorizacion,
    AutorizacionFormValues,
    AttendanceFilters,
    AttendanceKPIs,
    AuthStatus,
} from './types';

// ==========================================
// TABLE NAMES
// ==========================================

type AttendanceTable =
    | 'attendance_no_marcaciones'
    | 'attendance_sin_credenciales'
    | 'attendance_cambios_dia'
    | 'attendance_autorizaciones';

// ==========================================
// NO MARCACIONES
// ==========================================

export const fetchNoMarcaciones = async (
    terminalContext: TerminalContext,
    filters?: AttendanceFilters
): Promise<NoMarcacion[]> => {
    if (!isSupabaseConfigured()) return [];

    const terminals = resolveTerminalsForContext(terminalContext);

    let query = supabase
        .from('attendance_no_marcaciones')
        .select('*')
        .in('terminal_code', terminals)
        .order('date', { ascending: false });

    if (filters?.auth_status && filters.auth_status !== 'todos') {
        query = query.eq('auth_status', filters.auth_status);
    }

    if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(`nombre.ilike.${term},rut.ilike.${term}`);
    }

    if (filters?.date_from) {
        query = query.gte('date', filters.date_from);
    }

    if (filters?.date_to) {
        query = query.lte('date', filters.date_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const createNoMarcacion = async (
    values: NoMarcacionFormValues,
    createdBy: string
): Promise<NoMarcacion> => {
    const { data, error } = await supabase
        .from('attendance_no_marcaciones')
        .insert({
            ...values,
            created_by_supervisor: normalizeName(createdBy),
        })
        .select()
        .single();

    if (error) throw error;

    // Send email notification
    sendRecordCreatedEmail('No Marcaciones', {
        rut: values.rut,
        nombre: values.nombre,
        terminal: values.terminal_code,
        date: values.date,
        createdBy: createdBy,
        details: {
            'Área': values.area || '',
            'Cargo': values.cargo || '',
            'Jefe Terminal': values.jefe_terminal || '',
            'Observaciones': values.observations || '',
        }
    });

    return data;
};

export const updateNoMarcacion = async (
    id: string,
    values: Partial<NoMarcacionFormValues>
): Promise<NoMarcacion> => {
    const { data, error } = await supabase
        .from('attendance_no_marcaciones')
        .update(values)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// ==========================================
// SIN CREDENCIALES
// ==========================================

export const fetchSinCredenciales = async (
    terminalContext: TerminalContext,
    filters?: AttendanceFilters
): Promise<SinCredencial[]> => {
    if (!isSupabaseConfigured()) return [];

    const terminals = resolveTerminalsForContext(terminalContext);

    let query = supabase
        .from('attendance_sin_credenciales')
        .select('*')
        .in('terminal_code', terminals)
        .order('date', { ascending: false });

    if (filters?.auth_status && filters.auth_status !== 'todos') {
        query = query.eq('auth_status', filters.auth_status);
    }

    if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(`nombre.ilike.${term},rut.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const createSinCredencial = async (
    values: SinCredencialFormValues,
    createdBy: string
): Promise<SinCredencial> => {
    const { data, error } = await supabase
        .from('attendance_sin_credenciales')
        .insert({
            ...values,
            created_by_supervisor: normalizeName(createdBy),
        })
        .select()
        .single();

    if (error) throw error;

    // Send email notification
    sendRecordCreatedEmail('Sin Credenciales', {
        rut: values.rut,
        nombre: values.nombre,
        terminal: values.terminal_code,
        date: values.date,
        createdBy: createdBy,
        details: {
            'Cabezal': values.cabezal || '',
            'Horario': `${values.start_time || ''} - ${values.end_time || ''}`,
            'Cargo': values.cargo || '',
            'Supervisor Autoriza': values.supervisor_autoriza || '',
        }
    });

    return data;
};

export const updateSinCredencial = async (
    id: string,
    values: Partial<SinCredencialFormValues>
): Promise<SinCredencial> => {
    const { data, error } = await supabase
        .from('attendance_sin_credenciales')
        .update(values)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// ==========================================
// CAMBIOS DE DÍA
// ==========================================

export const fetchCambiosDia = async (
    terminalContext: TerminalContext,
    filters?: AttendanceFilters
): Promise<CambioDia[]> => {
    if (!isSupabaseConfigured()) return [];

    const terminals = resolveTerminalsForContext(terminalContext);

    let query = supabase
        .from('attendance_cambios_dia')
        .select('*')
        .in('terminal_code', terminals)
        .order('date', { ascending: false });

    if (filters?.auth_status && filters.auth_status !== 'todos') {
        query = query.eq('auth_status', filters.auth_status);
    }

    if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(`nombre.ilike.${term},rut.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const createCambioDia = async (
    values: CambioDiaFormValues,
    createdBy: string
): Promise<CambioDia> => {
    let documentPath: string | null = null;

    if (values.document) {
        const fileExt = values.document.name.split('.').pop();
        const filePath = `cambios-dia/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('attendance-docs')
            .upload(filePath, values.document);

        if (uploadError) throw new Error('Error al subir documento');
        documentPath = filePath;
    }

    const { document: _, ...rest } = values;

    const { data, error } = await supabase
        .from('attendance_cambios_dia')
        .insert({
            ...rest,
            document_path: documentPath,
            created_by_supervisor: normalizeName(createdBy),
        })
        .select()
        .single();

    if (error) throw error;

    // Send email notification
    sendRecordCreatedEmail('Cambios de Día', {
        rut: values.rut,
        nombre: values.nombre,
        terminal: values.terminal_code,
        date: values.date,
        createdBy: createdBy,
        details: {
            'Jornada Programada': `${values.prog_start || ''} - ${values.prog_end || ''}`,
            'Día No Trabaja': values.day_off_date || '',
            'Día Trabaja': values.day_on_date || '',
            'Documento': documentPath ? 'Sí' : 'No',
        }
    });

    return data;
};

export const updateCambioDia = async (
    id: string,
    values: Partial<CambioDiaFormValues>
): Promise<CambioDia> => {
    const { document: _, ...rest } = values;

    const { data, error } = await supabase
        .from('attendance_cambios_dia')
        .update(rest)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getDocumentUrl = async (path: string): Promise<string> => {
    const { data, error } = await supabase.storage
        .from('attendance-docs')
        .createSignedUrl(path, 3600);

    if (error) throw error;
    return data.signedUrl;
};

// ==========================================
// AUTORIZACIONES
// ==========================================

export const fetchAutorizaciones = async (
    terminalContext: TerminalContext,
    filters?: AttendanceFilters
): Promise<Autorizacion[]> => {
    if (!isSupabaseConfigured()) return [];

    const terminals = resolveTerminalsForContext(terminalContext);

    let query = supabase
        .from('attendance_autorizaciones')
        .select('*')
        .in('terminal_code', terminals)
        .order('authorization_date', { ascending: false });

    if (filters?.auth_status && filters.auth_status !== 'todos') {
        query = query.eq('auth_status', filters.auth_status);
    }

    if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(`nombre.ilike.${term},rut.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const createAutorizacion = async (
    values: AutorizacionFormValues,
    createdBy: string
): Promise<Autorizacion> => {
    const { data, error } = await supabase
        .from('attendance_autorizaciones')
        .insert({
            ...values,
            created_by_supervisor: normalizeName(createdBy),
        })
        .select()
        .single();

    if (error) throw error;

    // Send email notification
    sendRecordCreatedEmail('Autorizaciones', {
        rut: values.rut,
        nombre: values.nombre,
        terminal: values.terminal_code,
        date: values.authorization_date,
        createdBy: createdBy,
        details: {
            'Tipo': values.entry_or_exit === 'ENTRADA' ? 'Llegada Tardía' : 'Retiro Anticipado',
            'Horario': values.horario || '',
            'Turno': values.turno || '',
            'Motivo': values.motivo || '',
        }
    });

    return data;
};

export const updateAutorizacion = async (
    id: string,
    values: Partial<AutorizacionFormValues>
): Promise<Autorizacion> => {
    const { data, error } = await supabase
        .from('attendance_autorizaciones')
        .update(values)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// ==========================================
// AUTHORIZATION WORKFLOW
// ==========================================

export const authorizeRecord = async (
    table: AttendanceTable,
    id: string,
    authorizedBy: string
): Promise<void> => {
    const { error } = await supabase
        .from(table)
        .update({
            auth_status: 'AUTORIZADO' as AuthStatus,
            authorized_by: normalizeName(authorizedBy),
            authorized_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) throw error;
};

export const rejectRecord = async (
    table: AttendanceTable,
    id: string,
    authorizedBy: string,
    reason: string
): Promise<void> => {
    const { error } = await supabase
        .from(table)
        .update({
            auth_status: 'RECHAZADO' as AuthStatus,
            authorized_by: normalizeName(authorizedBy),
            authorized_at: new Date().toISOString(),
            rejection_reason: reason,
        })
        .eq('id', id);

    if (error) throw error;
};

// ==========================================
// KPIs
// ==========================================

export const fetchKPIs = async (
    table: AttendanceTable,
    terminalContext: TerminalContext,
    dateColumn = 'date'
): Promise<AttendanceKPIs> => {
    if (!isSupabaseConfigured()) {
        return { pendingToday: 0, pendingTotal: 0, authorizedRange: 0, rejectedRange: 0 };
    }

    const terminals = resolveTerminalsForContext(terminalContext);
    const today = new Date().toISOString().split('T')[0];

    const { count: pendingToday } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .in('terminal_code', terminals)
        .eq('auth_status', 'PENDIENTE')
        .eq(dateColumn, today);

    const { count: pendingTotal } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .in('terminal_code', terminals)
        .eq('auth_status', 'PENDIENTE');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { count: authorizedRange } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .in('terminal_code', terminals)
        .eq('auth_status', 'AUTORIZADO')
        .gte(dateColumn, thirtyDaysAgo);

    const { count: rejectedRange } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .in('terminal_code', terminals)
        .eq('auth_status', 'RECHAZADO')
        .gte(dateColumn, thirtyDaysAgo);

    return {
        pendingToday: pendingToday ?? 0,
        pendingTotal: pendingTotal ?? 0,
        authorizedRange: authorizedRange ?? 0,
        rejectedRange: rejectedRange ?? 0,
    };
};

// ==========================================
// REALTIME
// ==========================================

export const subscribeToAttendanceChanges = (
    onInsert: (table: AttendanceTable) => void,
    onUpdate: (table: AttendanceTable) => void
): (() => void) => {
    const channel = supabase
        .channel('attendance-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_no_marcaciones' }, () => onInsert('attendance_no_marcaciones'))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance_no_marcaciones' }, () => onUpdate('attendance_no_marcaciones'))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_sin_credenciales' }, () => onInsert('attendance_sin_credenciales'))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance_sin_credenciales' }, () => onUpdate('attendance_sin_credenciales'))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_cambios_dia' }, () => onInsert('attendance_cambios_dia'))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance_cambios_dia' }, () => onUpdate('attendance_cambios_dia'))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_autorizaciones' }, () => onInsert('attendance_autorizaciones'))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance_autorizaciones' }, () => onUpdate('attendance_autorizaciones'))
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

// ==========================================
// EMAIL NOTIFICATION
// ==========================================

import { emailService } from '../../shared/services/emailService';
import { displayTerminal } from '../../shared/utils/terminal';

const EMAIL_RECIPIENT = 'isaac.avila@transdev.cl';

const formatDate = (date: string) => {
    const d = new Date(date + 'T12:00:00');
    return d.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const generateDataRow = (label: string, value: string, highlight = false) => `
    <tr>
        <td style="padding: 14px 16px; background: #f8fafc; border-radius: 8px 0 0 8px; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; width: 140px;">${label}</td>
        <td style="padding: 14px 16px; background: #f8fafc; border-radius: 0 8px 8px 0; font-size: 15px; font-weight: ${highlight ? '700' : '500'}; color: ${highlight ? '#1e40af' : '#1e293b'};">${value}</td>
    </tr>
    <tr><td colspan="2" style="height: 8px;"></td></tr>
`;

export const sendAuthorizationEmail = async (
    type: 'AUTORIZADO' | 'RECHAZADO',
    subsection: string,
    rut: string,
    nombre: string,
    terminal: string,
    date: string,
    reason?: string
): Promise<void> => {
    const isApproved = type === 'AUTORIZADO';
    const statusColor = isApproved ? '#16a34a' : '#dc2626';
    const statusBg = isApproved ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
    const statusBorder = isApproved ? '#86efac' : '#fca5a5';

    const subject = `${isApproved ? '✓' : '✗'} ${subsection} ${type} - ${nombre}`;
    const body = `
        <div style="margin-bottom: 24px;">
            <div style="background: ${statusBg}; border: 2px solid ${statusBorder}; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 8px;">${isApproved ? '✓' : '✗'}</div>
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">Estado</div>
                <div style="font-size: 24px; font-weight: 800; color: ${statusColor};">${type}</div>
            </div>
            
            <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
                ${generateDataRow('Subsección', subsection, true)}
                ${generateDataRow('RUT', rut)}
                ${generateDataRow('Trabajador', nombre)}
                ${generateDataRow('Terminal', displayTerminal(terminal as any))}
                ${generateDataRow('Fecha', formatDate(date))}
                ${reason ? generateDataRow('Motivo Rechazo', reason, true) : ''}
            </table>
        </div>
    `.trim();

    try {
        await emailService.sendEmail({
            audience: 'manual',
            manualRecipients: [EMAIL_RECIPIENT],
            subject,
            body,
        });
    } catch (err) {
        console.error('Error sending authorization email:', err);
    }
};

export const sendRecordCreatedEmail = async (
    subsection: string,
    data: {
        rut: string;
        nombre: string;
        terminal: string;
        date: string;
        createdBy: string;
        details?: Record<string, string>;
    }
): Promise<void> => {
    const detailsRows = data.details
        ? Object.entries(data.details)
            .filter(([_, v]) => v && v.trim())
            .map(([k, v]) => generateDataRow(k, v))
            .join('')
        : '';

    const subject = `Nuevo Registro: ${subsection} - ${data.nombre}`;
    const body = `
        <div style="margin-bottom: 24px;">
            <!-- Status Banner -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #fbbf24; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 36px; margin-bottom: 8px;">⏳</div>
                <div style="font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">Estado Actual</div>
                <div style="font-size: 20px; font-weight: 800; color: #78350f;">PENDIENTE DE AUTORIZACIÓN</div>
            </div>
            
            <!-- Badge -->
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; padding: 8px 20px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 50px; color: white; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">${subsection}</span>
            </div>
            
            <!-- Main Data -->
            <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
                ${generateDataRow('RUT', data.rut)}
                ${generateDataRow('Trabajador', data.nombre, true)}
                ${generateDataRow('Terminal', displayTerminal(data.terminal as any))}
                ${generateDataRow('Fecha', formatDate(data.date))}
                ${detailsRows}
            </table>
            
            <!-- Registrado Por -->
            <div style="margin-top: 24px; padding: 20px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border: 1px solid #93c5fd;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 18px;">${data.createdBy.charAt(0)}</div>
                    <div>
                        <div style="font-size: 12px; color: #3b82f6; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Registrado por</div>
                        <div style="font-size: 16px; font-weight: 700; color: #1e40af;">${data.createdBy}</div>
                    </div>
                </div>
            </div>
        </div>
    `.trim();

    try {
        await emailService.sendEmail({
            audience: 'manual',
            manualRecipients: [EMAIL_RECIPIENT],
            subject,
            body,
        });
    } catch (err) {
        console.error('Error sending record created email:', err);
    }
};

