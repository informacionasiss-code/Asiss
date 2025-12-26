import { useState, useMemo } from 'react';
import { PageHeader } from '../../../shared/components/common/PageHeader';
import { Icon } from '../../../shared/components/common/Icon';
import { useTasks } from '../hooks';
import { Task, getPriorityColor } from '../types';

interface CalendarViewProps {
    onOpenTask: (id: string) => void;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const CalendarView = ({ onOpenTask }: CalendarViewProps) => {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const query = useTasks();

    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();

        const days: (number | null)[] = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);
        return days;
    }, [currentYear, currentMonth]);

    const getTasksForDay = (day: number): Task[] => {
        if (!query.data) return [];
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        return query.data.filter(t => {
            // Check due_at
            if (t.due_at && t.due_at.startsWith(dateStr)) return true;
            // Check period range
            if (t.period_start && t.period_end) {
                return dateStr >= t.period_start && dateStr <= t.period_end;
            }
            return false;
        });
    };

    const selectedDayTasks = selectedDate ? getTasksForDay(parseInt(selectedDate.split('-')[2])) : [];

    const goToPreviousMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
        else setCurrentMonth(currentMonth - 1);
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
        else setCurrentMonth(currentMonth + 1);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Calendario de Tareas" description="Vista mensual con vencimientos y periodos" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                            if (day === null) return <div key={`e-${i}`} className="h-20" />;
                            const dayTasks = getTasksForDay(day);
                            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                            const isSelected = selectedDate === dateStr;

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(dateStr)}
                                    className={`h-20 rounded-lg border text-left p-1 transition-all ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-transparent hover:bg-slate-50'
                                        } ${isToday ? 'ring-2 ring-brand-400' : ''}`}
                                >
                                    <span className={`text-sm font-medium ${isToday ? 'text-brand-600' : 'text-slate-700'}`}>{day}</span>
                                    <div className="mt-1 space-y-0.5 overflow-hidden">
                                        {dayTasks.slice(0, 2).map(t => (
                                            <div key={t.id} className={`text-[10px] px-1 rounded truncate ${getPriorityColor(t.priority)}`}>
                                                {t.title}
                                            </div>
                                        ))}
                                        {dayTasks.length > 2 && <span className="text-[10px] text-slate-500">+{dayTasks.length - 2}</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Icon name="clipboard" size={18} />
                        {selectedDate ? `Tareas: ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}` : 'Selecciona un día'}
                    </h3>
                    {selectedDate === null ? (
                        <p className="text-sm text-slate-500">Haz clic en un día para ver las tareas</p>
                    ) : selectedDayTasks.length === 0 ? (
                        <p className="text-sm text-slate-500">Sin tareas para este día</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedDayTasks.map(t => (
                                <button key={t.id} onClick={() => onOpenTask(t.id)} className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                                    <div className="font-medium text-sm">{t.title}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                                        <span className="text-xs text-slate-500">{t.assigned_to_name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
