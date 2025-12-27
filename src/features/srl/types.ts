export type SrlCriticality = 'BAJA' | 'MEDIA' | 'ALTA';
export type SrlStatus =
    | 'CREADA' // Just created, editable
    | 'ENVIADA' // Emailed to SRL
    | 'PROGRAMADA' // Tech visit scheduled
    | 'EN_REVISION' // Tech is working
    | 'REPARADA' // Fixed
    | 'NO_REPARADA' // Not fixed, needs follow up
    | 'REAGENDADA' // Rescheduled
    | 'CERRADA'; // Finished process

export interface SrlRequest {
    id: string;
    terminal_code: string;
    required_date: string | null;
    criticality: SrlCriticality;
    applus: boolean;
    status: SrlStatus;

    // Creation
    created_by: string;
    created_at: string;

    // Workflow
    sent_at: string | null;
    closed_at: string | null;

    // Technician
    technician_name: string | null;
    technician_visit_at: string | null;
    technician_message: string | null;
    result: 'OPERATIVO' | 'NO_OPERATIVO' | null;
    next_visit_at: string | null;

    updated_at: string;
}

export interface SrlRequestBus {
    id: string;
    request_id: string;
    bus_ppu: string;
    bus_model: string | null;
    problem_type: string | null;
    observation: string | null;
    applus: boolean;
    created_at: string;
    images?: SrlBusImage[]; // Join
}

export interface SrlBusImage {
    id: string;
    request_bus_id: string;
    storage_path: string;
    mime_type: string | null;
    created_at: string;
    // For UI handling
    publicUrl?: string;
}

export interface SrlReport {
    id: string;
    request_id: string;
    storage_path: string;
    uploaded_at: string;
    uploaded_by: string | null;
    // For UI
    publicUrl?: string;
}

export interface SrlEmailSetting {
    id: string;
    enabled: boolean;
    recipients: string;
    cc_emails: string | null;
    subject_template: string | null;
    body_template: string | null;
    updated_at: string;
}

// UI specific types
export interface SrlFilters {
    terminal: string;
    status: string;
    criticality: string;
    search: string;
    id?: string;
}

export interface SrlKPIs {
    openRequests: number;
    criticalRequests: number;
    applusRequests: number;
    avgReactionTimeHours: number;
    avgRepairTimeHours: number;
    byStatus: Record<SrlStatus, number>;
}
