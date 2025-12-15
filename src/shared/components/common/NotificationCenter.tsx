import { useEffect, useState } from 'react';
import { notificationService } from '../../services/notificationService';
import { useNotificationStore } from '../../state/notificationStore';
import { formatDate } from '../../utils/dates';

export const NotificationCenter = () => {
  const { items, addNotification, setAll, last } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    setAll(notificationService.getNotifications());
    const unsubscribe = notificationService.subscribeNotifications((notification) => {
      addNotification(notification);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3500);
    });

    return () => unsubscribe();
  }, [addNotification, setAll]);

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-secondary h-10"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="relative inline-flex items-center">
          <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 17h5l-1.405-1.405A2.032 2.032 0 0117 14.158V11a5.002 5.002 0 00-3-4.584V6a2 2 0 10-4 0v.416A5.002 5.002 0 007 11v3.159c0 .538-.214 1.055-.595 1.436L5 17h5m4 0v1a3 3 0 11-6 0v-1m6 0H8"
            />
          </svg>
          {items.length > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-bold text-white">
              {items.length}
            </span>
          )}
        </span>
        <span className="hidden text-sm font-semibold text-slate-700 sm:inline">Alertas</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Notificaciones</p>
            <button className="text-xs text-brand-600 hover:underline" onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto px-4 pb-4">
            {items.length === 0 && <p className="text-sm text-slate-500">Sin notificaciones por ahora.</p>}
            {items.map((notification) => (
              <div key={notification.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold capitalize">{notification.level}</span>
                  <span>{formatDate(notification.createdAt)}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                <p className="text-sm text-slate-600">{notification.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {toastVisible && last && (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm rounded-md border border-slate-200 bg-white px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase text-brand-700">{last.level}</div>
            <button onClick={() => setToastVisible(false)} className="text-xs text-slate-500 hover:text-slate-700">
              Cerrar
            </button>
          </div>
          <p className="text-sm font-semibold text-slate-900">{last.title}</p>
          <p className="text-sm text-slate-700">{last.message}</p>
        </div>
      )}
    </div>
  );
};
