export type NotificationLevel = 'info' | 'warning' | 'success' | 'error';

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  level: NotificationLevel;
  createdAt: string;
}

export interface NotificationService {
  subscribeNotifications: (cb: (notification: NotificationPayload) => void) => () => void;
  publishNotification: (payload: Omit<NotificationPayload, 'id' | 'createdAt'> & Partial<Pick<NotificationPayload, 'id' | 'createdAt'>>) => NotificationPayload;
  getNotifications: () => NotificationPayload[];
  clear: () => void;
}
