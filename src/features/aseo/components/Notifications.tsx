import { Icon } from '../../../shared/components/common/Icon';
import { useFetchNotifications, useMarkNotificationRead } from '../hooks';

interface Props {
    cleanerId: string;
}

const NOTIFICATION_ICONS: Record<string, any> = {
    'TAREA_NUEVA': 'check-square',
    'OBSERVACION': 'message-circle',
    'CAMBIO_ESTADO': 'info'
};

const NOTIFICATION_COLORS: Record<string, string> = {
    'TAREA_NUEVA': 'from-blue-500 to-blue-600',
    'OBSERVACION': 'from-amber-500 to-amber-600',
    'CAMBIO_ESTADO': 'from-slate-500 to-slate-600'
};

export const Notifications = ({ cleanerId }: Props) => {
    const { data: notifications = [], isLoading } = useFetchNotifications(cleanerId);
    const markReadMutation = useMarkNotificationRead();

    const handleMarkRead = async (notificationId: string) => {
        try {
            await markReadMutation.mutateAsync(notificationId);
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Icon name="loader" size={32} className="text-blue-600 mx-auto mb-2 animate-spin" />
                <p className="text-slate-600">Cargando notificaciones...</p>
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Icon name="bell" size={48} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-semibold">No tienes notificaciones</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Notificaciones</h2>

            <div className="space-y-3">
                {notifications.map(notification => (
                    <div
                        key={notification.id}
                        onClick={() => !notification.read && handleMarkRead(notification.id)}
                        className={`rounded-xl shadow-md p-4 cursor-pointer transition-all ${notification.read
                            ? 'bg-white'
                            : 'bg-gradient-to-r ' + NOTIFICATION_COLORS[notification.type] + ' text-white shadow-lg'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.read ? 'bg-slate-100' : 'bg-white/20'
                                }`}>
                                <Icon
                                    name={NOTIFICATION_ICONS[notification.type]}
                                    size={20}
                                    className={notification.read ? 'text-slate-600' : 'text-white'}
                                />
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold mb-1 ${notification.read ? 'text-slate-900' : 'text-white'}`}>
                                    {notification.title}
                                </h4>
                                {notification.message && (
                                    <p className={`text-sm ${notification.read ? 'text-slate-600' : 'text-white/90'}`}>
                                        {notification.message}
                                    </p>
                                )}
                                <p className={`text-xs mt-2 ${notification.read ? 'text-slate-400' : 'text-white/70'}`}>
                                    {new Date(notification.created_at).toLocaleString('es-CL', {
                                        dateStyle: 'short',
                                        timeStyle: 'short'
                                    })}
                                </p>
                            </div>
                            {!notification.read && (
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
