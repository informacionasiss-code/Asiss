import { TerminalCode } from '../../shared/types/terminal';

// ==========================================
// ENUMS & STATUS
// ==========================================

export type MeetingStatus = 'PROGRAMADA' | 'REALIZADA' | 'CANCELADA';
export type NotificationStatus = 'PENDIENTE' | 'ENVIADO' | 'ERROR';
export type ActionStatus = 'PENDIENTE' | 'CUMPLIDO' | 'VENCIDO';

export const MEETING_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'PROGRAMADA', label: 'Programada' },
  { value: 'REALIZADA', label: 'Realizada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

export const ACTION_STATUS_OPTIONS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CUMPLIDO', label: 'Cumplido' },
  { value: 'VENCIDO', label: 'Vencido' },
];

// ==========================================
// MEETING
// ==========================================

export interface AgendaItem {
  id: string;
  text: string;
  completed?: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  terminal_code: TerminalCode;
  starts_at: string;
  duration_minutes: number;
  location: string | null;
  meeting_link: string | null;
  status: MeetingStatus;
  cancel_reason: string | null;
  agenda_json: AgendaItem[];
  minutes_text: string | null;
  created_by_supervisor: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingFormValues {
  title: string;
  terminal_code: TerminalCode;
  starts_at: string;
  duration_minutes: number;
  location?: string;
  meeting_link?: string;
  agenda_json: AgendaItem[];
  invitees: InviteeInput[];
}

// ==========================================
// INVITEES
// ==========================================

export interface MeetingInvitee {
  id: string;
  meeting_id: string;
  staff_id: string | null;
  invitee_name: string;
  invitee_email: string | null;
  notification_status: NotificationStatus;
  notified_at: string | null;
  created_at: string;
}

export interface InviteeInput {
  staff_id?: string;
  invitee_name: string;
  invitee_email?: string;
}

// ==========================================
// FILES
// ==========================================

export interface MeetingFile {
  id: string;
  meeting_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
}

// ==========================================
// ACTIONS/AGREEMENTS
// ==========================================

export interface MeetingAction {
  id: string;
  meeting_id: string;
  description: string;
  responsible_staff_id: string | null;
  responsible_name: string | null;
  due_date: string | null;
  status: ActionStatus;
  created_at: string;
  updated_at: string;
}

export interface ActionFormValues {
  description: string;
  responsible_staff_id?: string;
  responsible_name?: string;
  due_date?: string;
}

// ==========================================
// EMAIL SETTINGS
// ==========================================

export interface MeetingEmailSettings {
  id: string;
  scope_type: 'GLOBAL' | 'TERMINAL';
  scope_code: string;
  enabled: boolean;
  cc_emails: string | null;
  subject_template: string;
  body_template: string;
  updated_at: string;
}

// ==========================================
// FILTERS
// ==========================================

export interface MeetingFilters {
  status?: MeetingStatus | 'todos';
  search?: string;
  date_from?: string;
  date_to?: string;
}

// ==========================================
// MEETING WITH COUNTS (for table view)
// ==========================================

export interface MeetingWithCounts extends Meeting {
  invitees_count: number;
  files_count: number;
  actions_count: number;
}
