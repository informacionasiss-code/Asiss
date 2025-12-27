import { useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useSrlRequests } from '../hooks';
import { SrlRequest } from '../types';

export const CalendarView = () => {
    // Basic calendar logic
    const [currentDate, setCurrentDate] = useState(new Date());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const { data: requests = [] } = useSrlRequests();

    // Helpers
    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => {
        const day = new Date(y, m, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust for Monday start (0=Mon, 6=Sun)
    };

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Generate dates
    const dates = [];
    for (let i = 0; i < firstDay; i++) {
        dates.push(null); // Padding
    }
    for (let i = 1; i <= daysInMonth; i++) {
        dates.push(new Date(year, month, i));
    }

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Get events for a date
    const getEventsForDate = (date: Date) => {
        return requests.filter(r => {
            // Check creation date or required date or visit date
            const dateStr = date.toISOString().split('T')[0];
            const created = r.created_at.split('T')[0];
            const visit = r.technician_visit_at?.split('T')[0];

            return created === dateStr || visit === dateStr;
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-250px)]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
                        {monthNames[month]} {year}
                    </h2>
                    <div className="flex bg-white rounded-lg border border-slate-300 shadow-sm">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-l-lg border-r border-slate-200">
                            <Icon name="chevron-left" size={20} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 text-sm font-medium hover:bg-slate-50 text-slate-600">
                            Hoy
                        </button>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-r-lg border-l border-slate-200">
                            <Icon name="chevron-right" size={20} />
                        </button>
                    </div>
                </div>
                {/* Legend */}
                <div className="flex gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div> Solicitudes
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div> Visitas Téc.
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 flex flex-col">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                        <div key={d} className="py-2 text-center text-xs font-bold text-slate-500 uppercase">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {dates.map((date, idx) => {
                        if (!date) return <div key={`empty-${idx}`} className="bg-slate-50/50 border-r border-b border-slate-100"></div>;

                        const events = getEventsForDate(date);
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                            <div key={date.toISOString()} className={`
                                border-r border-b border-slate-100 p-2 min-h-[100px] relative transition-colors hover:bg-slate-50
                                ${isToday ? 'bg-blue-50/30' : ''}
                            `}>
                                <div className={`
                                    text-xs font-semibold mb-2 w-6 h-6 flex items-center justify-center rounded-full
                                    ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}
                                `}>
                                    {date.getDate()}
                                </div>

                                <div className="space-y-1 overflow-y-auto max-h-[80px]">
                                    {events.map(ev => {
                                        const isVisit = ev.technician_visit_at?.startsWith(date.toISOString().split('T')[0]);
                                        return (
                                            <div
                                                key={ev.id}
                                                className={`
                                                    text-[10px] px-1.5 py-1 rounded border truncate cursor-pointer
                                                    ${isVisit
                                                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                                                        : 'bg-blue-50 border-blue-200 text-blue-700'}
                                                `}
                                                title={`${ev.terminal_code} - ${ev.status}`}
                                            >
                                                {isVisit ? '🔧 Visita' : `#${ev.id.substring(0, 6)}`}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
