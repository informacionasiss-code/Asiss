import { supabase, isSupabaseConfigured } from '../../../shared/lib/supabaseClient';
import { TerminalContext } from '../../../shared/types/terminal';
import { resolveTerminalsForContext } from '../../../shared/utils/terminal';
import { emailService } from '../../../shared/services/emailService';
import { showSuccessToast, showErrorToast } from '../../../shared/state/toastStore';
import {
    Task,
    TaskFormValues,
    TaskComment,
    TaskAttachment,
    TaskFilters,
    TaskStatus,
    TaskEmailSettings,
    TaskKPIs,
} from '../types';

// ==========================================
// TASKS CRUD
// ==========================================

export const fetchTasks = async (
    terminalContext: TerminalContext,
    filters?: TaskFilters,
    supervisorName?: string
): Promise<Task[]> => {
    if (!isSupabaseConfigured()) return [];

    const terminals = resolveTerminalsForContext(terminalContext);

    let query = supabase
        .from('tasks')
        .select('*')
        .in('terminal_code', terminals)
        .order('updated_at', { ascending: false });

    if (filters?.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
    }

    if (filters?.priority && filters.priority !== 'todos') {
        query = query.eq('priority', filters.priority);
    }

    if (filters?.search) {
        const term = `%${filters.search}%`;
        query = query.or(`title.ilike.${term},description.ilike.${term}`);
    }

    if (filters?.assigned_to_name) {
        query = query.ilike('assigned_to_name', `%${filters.assigned_to_name}%`);
    }

    if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to + 'T23:59:59');
    }

    if (filters?.due_from) {
        query = query.gte('due_at', filters.due_from);
    }

    if (filters?.due_to) {
        query = query.lte('due_at', filters.due_to + 'T23:59:59');
    }

    if (filters?.only_mine && supervisorName) {
        query = query.ilike('assigned_to_name', `%${supervisorName}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const fetchTaskById = async (id: string): Promise<Task | null> => {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
};

export const fetchTaskKPIs = async (terminalContext: TerminalContext): Promise<TaskKPIs> => {
    const terminals = resolveTerminalsForContext(terminalContext);
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('tasks')
        .select('status, due_at')
        .in('terminal_code', terminals);

    if (error) throw error;

    const tasks = data || [];
    return {
        pending: tasks.filter(t => t.status === 'PENDIENTE').length,
        inProgress: tasks.filter(t => t.status === 'EN_CURSO').length,
        completed: tasks.filter(t => t.status === 'TERMINADO').length,
        evaluated: tasks.filter(t => t.status === 'EVALUADO').length,
        rejected: tasks.filter(t => t.status === 'RECHAZADO').length,
        overdue: tasks.filter(t => t.due_at && t.due_at < now && !['EVALUADO', 'RECHAZADO'].includes(t.status)).length,
    };
};

export const createTask = async (
    values: TaskFormValues,
    createdBy: string
): Promise<Task> => {
    const { data, error } = await supabase
        .from('tasks')
        .insert({
            title: values.title,
            description: values.description || null,
            terminal_code: values.terminal_code,
            priority: values.priority,
            assigned_to_staff_id: values.assigned_to_staff_id || null,
            assigned_to_name: values.assigned_to_name,
            assigned_to_email: values.assigned_to_email || null,
            created_by_supervisor: createdBy,
            due_at: values.due_at || null,
            period_start: values.period_start || null,
            period_end: values.period_end || null,
        })
        .select()
        .single();

    if (error) {
        showErrorToast('Error al crear tarea', 'No se pudo guardar la tarea');
        throw error;
    }

    showSuccessToast('Tarea creada', `"${values.title}" asignada a ${values.assigned_to_name}`, createdBy);

    // Send email notification
    if (values.assigned_to_email) {
        await sendTaskEmail('assigned', data, createdBy);
    }

    return data;
};

export const updateTask = async (
    id: string,
    values: Partial<TaskFormValues>
): Promise<Task> => {
    const updateData: Record<string, unknown> = {};

    if (values.title !== undefined) updateData.title = values.title;
    if (values.description !== undefined) updateData.description = values.description || null;
    if (values.terminal_code !== undefined) updateData.terminal_code = values.terminal_code;
    if (values.priority !== undefined) updateData.priority = values.priority;
    if (values.assigned_to_staff_id !== undefined) updateData.assigned_to_staff_id = values.assigned_to_staff_id || null;
    if (values.assigned_to_name !== undefined) updateData.assigned_to_name = values.assigned_to_name;
    if (values.assigned_to_email !== undefined) updateData.assigned_to_email = values.assigned_to_email || null;
    if (values.due_at !== undefined) updateData.due_at = values.due_at || null;
    if (values.period_start !== undefined) updateData.period_start = values.period_start || null;
    if (values.period_end !== undefined) updateData.period_end = values.period_end || null;

    const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateTaskStatus = async (
    id: string,
    status: TaskStatus,
    supervisorName: string
): Promise<void> => {
    const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id);

    if (error) throw error;

    // Send status change notification
    const task = await fetchTaskById(id);
    if (task?.assigned_to_email) {
        await sendTaskEmail('status_change', task, supervisorName);
    }
};

export const evaluateTask = async (
    id: string,
    accepted: boolean,
    evaluator: string,
    note?: string,
    rejectedReason?: string
): Promise<void> => {
    const updateData: Record<string, unknown> = {
        status: accepted ? 'EVALUADO' : 'RECHAZADO',
        evaluated_by: evaluator,
        evaluated_at: new Date().toISOString(),
    };

    if (accepted && note) {
        updateData.evaluation_note = note;
    }

    if (!accepted && rejectedReason) {
        updateData.rejected_reason = rejectedReason;
    }

    const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);

    if (error) throw error;

    // Send evaluation notification
    const task = await fetchTaskById(id);
    if (task?.assigned_to_email) {
        await sendTaskEmail(accepted ? 'evaluated_ok' : 'evaluated_reject', task, evaluator);
    }

    showSuccessToast(
        accepted ? 'Tarea evaluada' : 'Tarea rechazada',
        accepted ? 'La tarea ha sido aceptada' : 'La tarea ha sido devuelta',
        evaluator
    );
};

// ==========================================
// COMMENTS
// ==========================================

export const fetchComments = async (taskId: string): Promise<TaskComment[]> => {
    const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const addComment = async (
    taskId: string,
    body: string,
    authorName: string
): Promise<TaskComment> => {
    const { data, error } = await supabase
        .from('task_comments')
        .insert({
            task_id: taskId,
            author_name: authorName,
            body,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

// ==========================================
// ATTACHMENTS
// ==========================================

export const fetchAttachments = async (taskId: string): Promise<TaskAttachment[]> => {
    const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const uploadAttachment = async (
    taskId: string,
    file: File,
    createdBy: string
): Promise<TaskAttachment> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `tasks/${taskId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('task-files')
        .upload(filePath, file);

    if (uploadError) {
        showErrorToast('Error al subir archivo', uploadError.message);
        throw uploadError;
    }

    const { data, error } = await supabase
        .from('task_attachments')
        .insert({
            task_id: taskId,
            type: 'FILE',
            storage_path: filePath,
            file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            created_by: createdBy,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const addUrlAttachment = async (
    taskId: string,
    url: string,
    label: string,
    createdBy: string
): Promise<TaskAttachment> => {
    const { data, error } = await supabase
        .from('task_attachments')
        .insert({
            task_id: taskId,
            type: 'URL',
            url,
            file_name: label,
            created_by: createdBy,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteAttachment = async (id: string, storagePath?: string | null): Promise<void> => {
    if (storagePath) {
        await supabase.storage.from('task-files').remove([storagePath]);
    }

    const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const getAttachmentUrl = async (storagePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
        .from('task-files')
        .createSignedUrl(storagePath, 3600);

    if (error) throw error;
    return data.signedUrl;
};

// ==========================================
// EMAIL SETTINGS
// ==========================================

export const fetchEmailSettings = async (
    scopeType: 'GLOBAL' | 'TERMINAL',
    scopeCode: string
): Promise<TaskEmailSettings | null> => {
    const { data, error } = await supabase
        .from('task_email_settings')
        .select('*')
        .eq('scope_type', scopeType)
        .eq('scope_code', scopeCode)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
};

export const upsertEmailSettings = async (
    settings: Omit<TaskEmailSettings, 'id' | 'updated_at'>
): Promise<void> => {
    const { error } = await supabase
        .from('task_email_settings')
        .upsert(settings, { onConflict: 'scope_type,scope_code' });

    if (error) throw error;
};

// ==========================================
// EMAIL SENDING
// ==========================================

export const sendTaskEmail = async (
    eventType: 'assigned' | 'status_change' | 'overdue' | 'evaluated_ok' | 'evaluated_reject',
    task: Task,
    senderName: string
): Promise<void> => {
    const settings = await fetchEmailSettings('GLOBAL', 'ALL');
    if (!settings?.enabled || !task.assigned_to_email) return;

    try {
        const subjectTemplate = settings.subject_templates[eventType] || '';
        const bodyTemplate = settings.body_templates[eventType] || '';

        const replace = (text: string) => text
            .replace(/\{\{title\}\}/g, task.title)
            .replace(/\{\{description\}\}/g, task.description || '')
            .replace(/\{\{assigned_name\}\}/g, task.assigned_to_name)
            .replace(/\{\{status\}\}/g, task.status)
            .replace(/\{\{priority\}\}/g, task.priority)
            .replace(/\{\{due_date\}\}/g, task.due_at ? new Date(task.due_at).toLocaleDateString('es-CL') : 'Sin fecha')
            .replace(/\{\{creator\}\}/g, task.created_by_supervisor)
            .replace(/\{\{reason\}\}/g, task.rejected_reason || '');

        await emailService.sendEmail({
            audience: 'manual',
            manualRecipients: [task.assigned_to_email],
            cc: settings.cc_emails?.split(',').map(e => e.trim()).filter(Boolean) || [],
            subject: replace(subjectTemplate),
            body: replace(bodyTemplate).replace(/\n/g, '<br>'),
        });
    } catch (err) {
        console.error('Error sending task email:', err);
    }
};

// ==========================================
// SUPERVISORS (for assignment)
// ==========================================

export const fetchStaffForAssignment = async (): Promise<{ id: string; nombre: string; email: string | null; cargo: string; terminal_code: string }[]> => {
    const { data, error } = await supabase
        .from('staff')
        .select('id, nombre, email, cargo, terminal_code')
        .eq('status', 'ACTIVO')
        .order('nombre');

    if (error) throw error;
    return data || [];
};
