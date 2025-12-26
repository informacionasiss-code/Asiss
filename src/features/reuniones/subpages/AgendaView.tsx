import { useState, useMemo } from 'react';
import { PageHeader } from '../../../shared/components/common/PageHeader';
import { Icon } from '../../../shared/components/common/Icon';
import { useTerminalStore } from '../../../shared/state/terminalStore';
import { useMeetings } from '../hooks';
import { displayTerminal } from '../../../shared/utils/terminal';
import { MeetingWithCounts } from '../types';

interface AgendaViewProps {
    onOpenMeeting: (id: string) => void;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const AgendaView = ({ onOpenMeeting }: AgendaViewProps) => {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const query = useMeetings({ status: 'todos' });

    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        let startDay = firstDay.getDay();

        const days: (number | null)[] = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);
        return days;
    }, [currentYear, currentMonth]);

    const getMeetingsForDay = (day: number): MeetingWithCounts[] => {
        if (!query.data) return [];
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return query.data.filter(m => m.starts_at.startsWith(dateStr));
    };

    const upcomingMeetings = useMemo(() => {
        if (!query.data) return [];
        const now = new Date().toISOString();
        return query.data
            .filter(m => m.status === 'PROGRAMADA' && m.starts_at >= now)
            .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
            .slice(0, 5);
    }, [query.data]);

    const selectedDayMeetings = selectedDate ? getMeetingsForDay(parseInt(selectedDate.split('-')[2])) : [];

    const goToPreviousMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
        else setCurrentMonth(currentMonth - 1);
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
        else setCurrentMonth(currentMonth + 1);
    };

    const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'REALIZADA': return 'bg-green-500';
            case 'CANCELADA': return 'bg-red-500';
            default: return 'bg-brand-500';
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Agenda" description="Vista de calendario de reuniones" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={goToPreviousMonth} className="btn btn-ghost btn-icon">
                            <Icon name="chevron-right" size={20} className="rotate-180" />
                        </button>
                        <h3 className="text-lg font-bold text-slate-800">{MONTHS[currentMonth]} {currentYear}</h3>
                        <button onClick={goToNextMonth} className="btn btn-ghost btn-icon">
                            <Icon name="chevron-right" size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => {
                            if (day === null) return <div key={`e-${i}`} className="h-16" />;
                            const dayMeetings = getMeetingsForDay(day);
                            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                            const isSelected = selectedDate === dateStr;

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={`h-16 rounded-lg border text-left p-1 transition-all ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-transparent hover:bg-slate-50'
                                        } ${isToday ? 'ring-2 ring-brand-400' : ''}`}
                                >
                                    <span className={`text-sm font-medium ${isToday ? 'text-brand-600' : 'text-slate-700'}`}>{day}</span>
                                    <div className="mt-1 space-y-0.5">
                                        {dayMeetings.slice(0, 2).map(m => (
                                            <div key={m.id} className={`h-1 rounded ${getStatusColor(m.status)}`} />
                                        ))}
                                        {dayMeetings.length > 2 && <span className="text-[10px] text-slate-500">+{dayMeetings.length - 2}</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Selected day meetings */}
                    {selectedDate && (
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-slate-700 mb-2">
                                Reuniones del {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
                            </h4>
                            {selectedDayMeetings.length === 0 ? (
                                <p className="text-sm text-slate-500">Sin reuniones programadas</p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedDayMeetings.map(m => (
                                        <button key={m.id} onClick={() => onOpenMeeting(m.id)} className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${getStatusColor(m.status)}`} />
                                                <span className="font-medium">{m.title}</span>
                                                <span className="text-sm text-slate-500 ml-auto">{formatTime(m.starts_at)}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Upcoming meetings */}
                <div className="card p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Icon name="clock" size={18} /> Próximas reuniones
                    </h3>
                    {upcomingMeetings.length === 0 ? (
                        <p className="text-sm text-slate-500">Sin reuniones próximas</p>
                    ) : (
                        <div className="space-y-3">
                            {upcomingMeetings.map(m => (
                                <button key={m.id} onClick={() => onOpenMeeting(m.id)} className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                                    <div className="font-medium text-slate-800">{m.title}</div>
                                    <div className="text-sm text-slate-500 mt-1">
                                        {new Date(m.starts_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} - {formatTime(m.starts_at)}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">{displayTerminal(m.terminal_code)}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
