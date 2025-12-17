import { supabase } from '../../../shared/lib/supabaseClient';
import {
    BackupCard,
    BackupLoan,
    BackupEmailSettings,
    BackupLoansFilters,
    BackupKpis,
    LoanFormValues,
    CardFormValues,
    INVENTORY_TERMINALS,
    InventoryTerminal,
} from '../types';

// ============================================
// CARDS API
// ============================================

export const fetchCards = async (status?: string, terminal?: string): Promise<BackupCard[]> => {
    let query = supabase.from('backup_cards').select('*').order('card_number', { ascending: true });

    if (status && status !== 'TODAS') {
        query = query.eq('status', status);
    }
    if (terminal) {
        query = query.eq('inventory_terminal', terminal);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as BackupCard[];
};

export const fetchAvailableCards = async (terminal?: string): Promise<BackupCard[]> => {
    let query = supabase.from('backup_cards').select('*').eq('status', 'LIBRE').order('card_number');

    if (terminal) {
        query = query.eq('inventory_terminal', terminal);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as BackupCard[];
};

export const createCard = async (values: CardFormValues): Promise<BackupCard> => {
    const { data, error } = await supabase
        .from('backup_cards')
        .insert({
            card_number: values.card_number,
            inventory_terminal: values.inventory_terminal,
            notes: values.notes || null,
            status: 'LIBRE',
        })
        .select()
        .single();

    if (error) throw error;
    return data as BackupCard;
};

export const updateCardStatus = async (id: string, status: string): Promise<void> => {
    const { error } = await supabase
        .from('backup_cards')
        .update({ status })
        .eq('id', id);

    if (error) throw error;
};

export const deactivateCard = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('backup_cards')
        .update({ status: 'INACTIVA' })
        .eq('id', id);

    if (error) throw error;
};

// ============================================
// LOANS API
// ============================================

export const fetchLoans = async (filters?: BackupLoansFilters): Promise<BackupLoan[]> => {
    let query = supabase
        .from('backup_loans')
        .select('*, backup_cards(*)')
        .order('issued_at', { ascending: false });

    if (filters) {
        if (filters.search) {
            query = query.or(`person_rut.ilike.%${filters.search}%,person_name.ilike.%${filters.search}%`);
        }
        if (filters.terminal) {
            query = query.eq('person_terminal', filters.terminal);
        }
        if (filters.status && filters.status !== 'TODAS') {
            query = query.eq('status', filters.status);
        }
        if (filters.reason && filters.reason !== 'TODAS') {
            query = query.eq('reason', filters.reason);
        }
        if (filters.dateFrom) {
            query = query.gte('issued_at', filters.dateFrom);
        }
        if (filters.dateTo) {
            query = query.lte('issued_at', filters.dateTo + 'T23:59:59');
        }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as BackupLoan[];
};

export const createLoan = async (values: LoanFormValues): Promise<BackupLoan> => {
    // Start a transaction: create loan and update card status
    const { data: loan, error: loanError } = await supabase
        .from('backup_loans')
        .insert({
            card_id: values.card_id,
            person_rut: values.person_rut,
            person_name: values.person_name,
            person_cargo: values.person_cargo || null,
            person_terminal: values.person_terminal,
            person_turno: values.person_turno || null,
            person_horario: values.person_horario || null,
            person_contacto: values.person_contacto || null,
            boss_email: values.boss_email,
            reason: values.reason,
            requested_at: values.requested_at,
            discount_amount: values.discount_amount,
            discount_applied: values.discount_applied,
            created_by_supervisor: values.created_by_supervisor,
            status: 'ASIGNADA',
        })
        .select('*, backup_cards(*)')
        .single();

    if (loanError) throw loanError;

    // Update card status to ASIGNADA
    const { error: cardError } = await supabase
        .from('backup_cards')
        .update({ status: 'ASIGNADA' })
        .eq('id', values.card_id);

    if (cardError) throw cardError;

    return loan as BackupLoan;
};

export const recoverLoan = async (
    id: string,
    recoveredAt: string,
    observation?: string
): Promise<void> => {
    // Get loan to find card_id
    const { data: loan, error: fetchError } = await supabase
        .from('backup_loans')
        .select('card_id')
        .eq('id', id)
        .single();

    if (fetchError) throw fetchError;

    // Update loan status
    const { error: loanError } = await supabase
        .from('backup_loans')
        .update({
            status: 'CERRADA',
            recovered_at: recoveredAt,
            closed_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (loanError) throw loanError;

    // Free the card
    const { error: cardError } = await supabase
        .from('backup_cards')
        .update({ status: 'LIBRE' })
        .eq('id', loan.card_id);

    if (cardError) throw cardError;
};

export const cancelLoan = async (id: string, reason: string): Promise<void> => {
    // Get loan to find card_id
    const { data: loan, error: fetchError } = await supabase
        .from('backup_loans')
        .select('card_id')
        .eq('id', id)
        .single();

    if (fetchError) throw fetchError;

    // Update loan status
    const { error: loanError } = await supabase
        .from('backup_loans')
        .update({
            status: 'CANCELADA',
            cancel_reason: reason,
            closed_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (loanError) throw loanError;

    // Free the card
    const { error: cardError } = await supabase
        .from('backup_cards')
        .update({ status: 'LIBRE' })
        .eq('id', loan.card_id);

    if (cardError) throw cardError;
};

export const updateLoanEmailsSent = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('backup_loans')
        .update({ emails_sent_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
};

export const uploadDiscountEvidence = async (
    loanId: string,
    file: File
): Promise<string> => {
    const filename = `${loanId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from('backup-evidence')
        .upload(filename, file);

    if (uploadError) throw uploadError;

    // Update loan with evidence path
    const { error: updateError } = await supabase
        .from('backup_loans')
        .update({ discount_evidence_path: filename })
        .eq('id', loanId);

    if (updateError) throw updateError;

    return filename;
};

// ============================================
// EMAIL SETTINGS API
// ============================================

export const fetchEmailSettings = async (): Promise<BackupEmailSettings[]> => {
    const { data, error } = await supabase
        .from('backup_email_settings')
        .select('*')
        .order('scope_type', { ascending: false });

    if (error) throw error;
    return data as BackupEmailSettings[];
};

export const upsertEmailSettings = async (
    settings: Omit<BackupEmailSettings, 'id' | 'updated_at'>
): Promise<BackupEmailSettings> => {
    const { data, error } = await supabase
        .from('backup_email_settings')
        .upsert(settings, { onConflict: 'scope_type,scope_code' })
        .select()
        .single();

    if (error) throw error;
    return data as BackupEmailSettings;
};

// ============================================
// KPIS API
// ============================================

export const fetchKpis = async (): Promise<BackupKpis> => {
    // Fetch all cards for availability count
    const { data: cards, error: cardsError } = await supabase
        .from('backup_cards')
        .select('inventory_terminal, status');

    if (cardsError) throw cardsError;

    // Count available by terminal
    const availableByTerminal: Record<InventoryTerminal, number> = {
        'El Roble': 0,
        'La Reina': 0,
        'Maria Angelica': 0,
    };

    cards?.forEach((card) => {
        if (card.status === 'LIBRE') {
            const terminal = card.inventory_terminal as InventoryTerminal;
            if (INVENTORY_TERMINALS.includes(terminal)) {
                availableByTerminal[terminal]++;
            }
        }
    });

    // Fetch active loans
    const { data: activeLoans, error: activeError } = await supabase
        .from('backup_loans')
        .select('id, issued_at, alert_after_days, discount_amount, discount_applied')
        .eq('status', 'ASIGNADA');

    if (activeError) throw activeError;

    const now = new Date();
    let overdueCount = 0;
    let totalDiscounts = 0;

    activeLoans?.forEach((loan) => {
        const issuedAt = new Date(loan.issued_at);
        const daysPassed = Math.floor((now.getTime() - issuedAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysPassed > loan.alert_after_days) {
            overdueCount++;
        }
        if (loan.discount_applied) {
            totalDiscounts += loan.discount_amount;
        }
    });

    // Fetch closed loans for average return time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: closedLoans, error: closedError } = await supabase
        .from('backup_loans')
        .select('issued_at, recovered_at, discount_amount, discount_applied')
        .in('status', ['RECUPERADA', 'CERRADA'])
        .gte('closed_at', thirtyDaysAgo.toISOString());

    if (closedError) throw closedError;

    let totalReturnDays = 0;
    let returnCount = 0;

    closedLoans?.forEach((loan) => {
        if (loan.recovered_at) {
            const issuedAt = new Date(loan.issued_at);
            const recoveredAt = new Date(loan.recovered_at);
            const days = Math.floor((recoveredAt.getTime() - issuedAt.getTime()) / (1000 * 60 * 60 * 24));
            totalReturnDays += days;
            returnCount++;
        }
        if (loan.discount_applied) {
            totalDiscounts += loan.discount_amount;
        }
    });

    return {
        availableByTerminal,
        activeLoans: activeLoans?.length || 0,
        overdueLoans: overdueCount,
        avgReturnDays: returnCount > 0 ? Math.round(totalReturnDays / returnCount) : 0,
        totalDiscounts,
    };
};

// ============================================
// EMAIL SENDING
// ============================================

export const sendBackupEmails = async (
    loan: BackupLoan,
    managerEmail: string,
    cc?: string
): Promise<void> => {
    const emailApiUrl = import.meta.env.VITE_EMAIL_API_URL;
    if (!emailApiUrl) {
        console.warn('Email API URL not configured');
        return;
    }

    const cardNumber = loan.backup_cards?.card_number || 'N/A';

    // Email to manager (new credential request)
    const managerBody = `
Se solicita la creación de una nueva credencial:

Trabajador: ${loan.person_name}
RUT: ${loan.person_rut}
Terminal: ${loan.person_terminal}
Cargo: ${loan.person_cargo || 'No especificado'}
Motivo: ${loan.reason === 'PERDIDA' ? 'Pérdida' : 'Deterioro'}

Tarjeta de respaldo asignada: ${cardNumber}
Fecha de solicitud: ${loan.requested_at}
`;

    await fetch(emailApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            subject: 'Solicitud de Nueva Credencial - ' + loan.person_name,
            body: managerBody,
            audience: 'manual',
            manualRecipients: [managerEmail],
            cc: cc ? cc.split(',').map((e) => e.trim()) : undefined,
        }),
    });

    // Email to boss (notification)
    const bossBody = `
Estimado/a,

Se informa que el trabajador ${loan.person_name} (RUT: ${loan.person_rut}) trabajará con la tarjeta de respaldo N° ${cardNumber} mientras se gestiona la emisión de una nueva credencial.

Motivo: ${loan.reason === 'PERDIDA' ? 'Pérdida de credencial' : 'Deterioro de credencial'}
Terminal: ${loan.person_terminal}
${loan.discount_applied ? `Se ha aplicado un descuento de $${loan.discount_amount.toLocaleString('es-CL')} (1 cuota).` : ''}

Fecha de entrega de respaldo: ${new Date(loan.issued_at).toLocaleDateString('es-CL')}

Saludos cordiales,
Gestión de Personal
`;

    await fetch(emailApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            subject: 'Notificación Credencial de Respaldo - ' + loan.person_name,
            body: bossBody,
            audience: 'manual',
            manualRecipients: [loan.boss_email],
        }),
    });

    // Mark emails as sent
    await updateLoanEmailsSent(loan.id);
};
