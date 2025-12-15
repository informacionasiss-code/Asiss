import { create } from 'zustand';
import { NotificationPayload } from '../types/notification';

interface NotificationState {
  items: NotificationPayload[];
  last?: NotificationPayload;
  addNotification: (notification: NotificationPayload) => void;
  setAll: (notifications: NotificationPayload[]) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  last: undefined,
  addNotification: (notification) => set((state) => ({ items: [notification, ...state.items], last: notification })),
  setAll: (notifications) => set({ items: notifications }),
  clear: () => set({ items: [], last: undefined }),
}));
