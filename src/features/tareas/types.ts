import { TerminalCode } from '../../shared/types/terminal';

// ==========================================
// ENUMS & STATUS
// ==========================================

export type TaskStatus = 'PENDIENTE' | 'EN_CURSO' | 'TERMINADO' | 'EVALUADO' | 'RECHAZADO';
export type TaskPriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export const TASK_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_CURSO', label: 'En Curso' },
  { value: 'TERMINADO', label: 'Terminado' },
  { value: 'EVALUADO', label: 'Evaluado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'BAJA', label: 'Baja', color: 'bg-slate-100 text-slate-700' },
  { value: 'MEDIA', label: 'Media', color: 'bg-blue-100 text-blue-700' },
  { value: 'ALTA', label: 'Alta', color: 'bg-amber-100 text-amber-700' },
  { value: 'CRITICA', label: 'Critica', color: 'bg-red-100 text-red-700' },
];

export const STATUS_COLUMNS: TaskStatus[] = ['PENDIENTE', 'EN_CURSO', 'TERMINADO', 'EVALUADO', 'RECHAZADO'];

export const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'PENDIENTE': return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'EN_CURSO': return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'TERMINADO': return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'EVALUADO': return 'bg-green-100 text-green-700 border-green-300';
    case 'RECHAZADO': return 'bg-red-100 text-red-700 border-red-300';
  }
};

export const getPriorityColor = (priority: TaskPriority) => {
  return TASK_PRIORITY_OPTIONS.find(p => p.value === priority)?.color || '';
};

// ==========================================
// TASK
// ==========================================

export interface Task {
  id: string;
  title: string;
  description: string | null;
  terminal_code: TerminalCode;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to_staff_id: string | null;
  assigned_to_name: string;
  assigned_to_email: string | null;
  created_by_supervisor: string;
  due_at: string | null;
  period_start: string | null;
  period_end: string | null;
  evaluated_by: string | null;
  evaluated_at: string | null;
  evaluation_note: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFormValues {
  title: string;
  description?: string;
  terminal_code: TerminalCode;
  priority: TaskPriority;
  assigned_to_staff_id?: string;
  assigned_to_name: string;
  assigned_to_email?: string;
  due_at?: string;
  period_start?: string;
  period_end?: string;
}

// ==========================================
// COMMENTS
// ==========================================

export interface TaskComment {
  id: string;
  task_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

// ==========================================
// ATTACHMENTS
// ==========================================

export interface TaskAttachment {
  id: string;
  task_id: string;
  type: 'FILE' | 'URL';
  storage_path: string | null;
  url: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_by: string;
  created_at: string;
}

// ==========================================
// EMAIL SETTINGS
// ==========================================

export interface TaskEmailSettings {
  id: string;
  scope_type: 'GLOBAL' | 'TERMINAL';
  scope_code: string;
  enabled: boolean;
  cc_emails: string | null;
  subject_templates: {
    assigned: string;
    status_change: string;
    overdue: string;
    evaluated_ok: string;
    evaluated_reject: string;
  };
  body_templates: {
    assigned: string;
    status_change: string;
    overdue: string;
    evaluated_ok: string;
    evaluated_reject: string;
  };
  updated_at: string;
}

// ==========================================
// FILTERS
// ==========================================

export interface TaskFilters {
  status?: TaskStatus | 'todos';
  priority?: TaskPriority | 'todos';
  search?: string;
  assigned_to_name?: string;
  date_from?: string;
  date_to?: string;
  due_from?: string;
  due_to?: string;
  only_mine?: boolean;
}

// ==========================================
// KPIs
// ==========================================

export interface TaskKPIs {
  pending: number;
  inProgress: number;
  completed: number;
  evaluated: number;
  rejected: number;
  overdue: number;
}
