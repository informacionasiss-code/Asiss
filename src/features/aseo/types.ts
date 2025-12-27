export type CleaningType = 'BARRIDO' | 'BARRIDO_Y_TRAPEADO' | 'FULL';
export type TaskStatus = 'PENDIENTE' | 'TERMINADA';
export type NotificationType = 'TAREA_NUEVA' | 'OBSERVACION' | 'CAMBIO_ESTADO';

export interface AseoCleaner {
  id: string;
  name: string;
  created_at: string;
  last_active_at: string;
}

export interface AseoRecord {
  id: string;
  cleaner_id: string;
  cleaner_name: string;
  bus_ppu: string;
  terminal_code: string;
  cleaning_type: CleaningType;
  graffiti_removed: boolean;
  stickers_removed: boolean;
  photo_url: string;
  created_at: string;
}

export interface AseoTask {
  id: string;
  cleaner_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  evidence_url: string | null;
  created_by: string;
  created_at: string;
  completed_at: string | null;
}

export interface AseoNotification {
  id: string;
  cleaner_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  read: boolean;
  related_id: string | null;
  created_at: string;
}

export interface CreateAseoRecordInput {
  bus_ppu: string;
  terminal_code: string;
  cleaning_type: CleaningType;
  graffiti_removed: boolean;
  stickers_removed: boolean;
}
