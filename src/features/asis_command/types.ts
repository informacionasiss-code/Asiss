/**
 * Asis Command Types
 * Command palette system for natural language actions
 */

// ==========================================
// COMMAND INTENTS
// ==========================================

export type CommandIntent =
    | 'VACACIONES'
    | 'LICENCIA'
    | 'PERMISO'
    | 'AUTORIZACION_LLEGADA'
    | 'AUTORIZACION_SALIDA'
    | 'CAMBIO_DIA'
    | 'NO_MARCACION'
    | 'SIN_CREDENCIAL'
    | 'UNKNOWN';

export const INTENT_LABELS: Record<CommandIntent, string> = {
    VACACIONES: 'Vacaciones',
    LICENCIA: 'Licencia Médica',
    PERMISO: 'Permiso',
    AUTORIZACION_LLEGADA: 'Autorización Llegada Tardía',
    AUTORIZACION_SALIDA: 'Autorización Salida Anticipada',
    CAMBIO_DIA: 'Cambio de Día',
    NO_MARCACION: 'No Marcación',
    SIN_CREDENCIAL: 'Sin Credencial',
    UNKNOWN: 'Comando no reconocido',
};

export const INTENT_TABLES: Record<CommandIntent, string | null> = {
    VACACIONES: 'attendance_vacations',
    LICENCIA: 'attendance_licenses',
    PERMISO: 'attendance_permissions',
    AUTORIZACION_LLEGADA: 'attendance_autorizaciones',
    AUTORIZACION_SALIDA: 'attendance_autorizaciones',
    CAMBIO_DIA: 'attendance_cambios_dia',
    NO_MARCACION: 'attendance_no_marcaciones',
    SIN_CREDENCIAL: 'attendance_sin_credenciales',
    UNKNOWN: null,
};

// ==========================================
// PARSED COMMAND
// ==========================================

export interface ParsedCommand {
    intent: CommandIntent;
    rut: string | null;
    rutNormalized: string | null;
    startDate: string | null;      // YYYY-MM-DD
    endDate: string | null;        // YYYY-MM-DD
    startTime: string | null;      // HH:mm
    endTime: string | null;        // HH:mm
    durationDays: number | null;
    reason: string | null;
    rawText: string;
    confidence: number;            // 0-1, how confident the parser is
    errors: string[];
}

export interface ResolvedPerson {
    id: string;
    rut: string;
    nombre: string;
    cargo: string;
    terminal_code: string;
    horario: string;
    status: string;
}

export interface CommandPreview {
    parsedCommand: ParsedCommand;
    person: ResolvedPerson | null;
    personNotFound: boolean;
    action: string;
    targetTable: string | null;
    emailRecipients: string[];
    warnings: string[];
    canExecute: boolean;
}

// ==========================================
// COMMAND LOG (DB)
// ==========================================

export interface CommandLog {
    id: string;
    command_text: string;
    parsed_intent: CommandIntent | null;
    payload_json: Record<string, unknown>;
    executed_by: string;
    terminal_code: string | null;
    status: 'OK' | 'ERROR' | 'CANCELLED';
    error_message: string | null;
    created_at: string;
}

export interface CommandLogInsert {
    command_text: string;
    parsed_intent: CommandIntent | null;
    payload_json: Record<string, unknown>;
    executed_by: string;
    terminal_code?: string;
    status: 'OK' | 'ERROR' | 'CANCELLED';
    error_message?: string;
}

// ==========================================
// EMAIL SETTINGS
// ==========================================

export interface CommandEmailSetting {
    id: string;
    intent: CommandIntent;
    recipients: string;
    subject_template: string;
    enabled: boolean;
}

// ==========================================
// QUICK SUGGESTIONS
// ==========================================

export interface QuickSuggestion {
    label: string;
    template: string;
    intent: CommandIntent;
}

export const QUICK_SUGGESTIONS: QuickSuggestion[] = [
    { label: 'Vacaciones', template: 'vacaciones para [RUT] desde [fecha] por [días] días', intent: 'VACACIONES' },
    { label: 'Licencia', template: 'licencia para [RUT] desde [fecha] hasta [fecha]', intent: 'LICENCIA' },
    { label: 'Permiso', template: 'permiso para [RUT] el [fecha] de [hora] a [hora]', intent: 'PERMISO' },
    { label: 'Llegada tardía', template: 'llegada tardía [RUT] el [fecha] a las [hora]', intent: 'AUTORIZACION_LLEGADA' },
    { label: 'Salida anticipada', template: 'salida anticipada [RUT] el [fecha] a las [hora]', intent: 'AUTORIZACION_SALIDA' },
    { label: 'Cambio de día', template: 'cambio de día [RUT] del [día] al [día]', intent: 'CAMBIO_DIA' },
];
