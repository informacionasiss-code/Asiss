import { NotificationPayload, NotificationService } from '../types/notification';

const subscribers = new Set<(notification: NotificationPayload) => void>();
let notifications: NotificationPayload[] = [];

const nextId = () => crypto.randomUUID();

export const notificationService: NotificationService = {
  subscribeNotifications: (cb) => {
    subscribers.add(cb);
    return () => subscribers.delete(cb);
  },
  publishNotification: (payload) => {
    const notification: NotificationPayload = {
      id: payload.id ?? nextId(),
      createdAt: payload.createdAt ?? new Date().toISOString(),
      ...payload,
    } as NotificationPayload;

    notifications = [notification, ...notifications].slice(0, 50);
    subscribers.forEach((cb) => cb(notification));
    return notification;
  },
  getNotifications: () => notifications,
  clear: () => {
    notifications = [];
  },
};
