import { useState, useMemo } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { TerminalCode } from '../../../shared/types/terminal';
import { TERMINALS, terminalOptions } from '../../../shared/utils/terminal';
import { Vacacion } from '../types';

interface VacacionesCalendarProps {
    isOpen: boolean;
    onClose: () => void;
    vacaciones: Vacacion[];
}

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const VacacionesCalendar = ({ isOpen, onClose, vacaciones }: VacacionesCalendarProps) => {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    // Filters
    const [terminalFilter, setTerminalFilter] = useState<string>('todos');
    const [cargoFilter, setCargoFilter] = useState<string>('todos');

    // Get unique cargos from vacaciones
    const uniqueCargos = useMemo(() => {
        const cargos = new Set<string>();
        vacaciones.forEach(v => cargos.add(v.cargo));
        return Array.from(cargos).sort();
    }, [vacaciones]);

    // Apply filters
    const filteredVacaciones = useMemo(() => {
        return vacaciones.filter(v => {
            if (terminalFilter !== 'todos' && v.terminal_code !== terminalFilter) return false;
            if (cargoFilter !== 'todos' && v.cargo !== cargoFilter) return false;
            return true;
        });
    }, [vacaciones, terminalFilter, cargoFilter]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();

        // Get day of week (0 = Sunday, adjust to Monday = 0)
        let startDay = firstDayOfMonth.getDay() - 1;
        if (startDay < 0) startDay = 6;

        const days: (number | null)[] = [];

        // Add empty cells for days before the first
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    }, [currentYear, currentMonth]);

    // Check if a date falls within a vacation period
    const getVacacionesForDay = (day: number): Vacacion[] => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return filteredVacaciones.filter(v => {
            return dateStr >= v.start_date && dateStr <= v.end_date;
        });
    };

    // Get vacaciones for selected day
    const selectedDayVacaciones = selectedDay ? getVacacionesForDay(selectedDay) : [];

    // Navigation
    const goToPreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
        setSelectedDay(null);
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
        setSelectedDay(null);
    };

    const goToToday = () => {
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth());
        setSelectedDay(today.getDate());
    };

    if (!isOpen) return null;

    const isToday = (day: number) => {
        return day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
    };

    const isWeekend = (index: number) => {
        return index % 7 === 5 || index % 7 === 6; // Saturday or Sunday
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Icon name="calendar" size={28} />
                            Calendario de Vacaciones
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <Icon name="x" size={24} />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[180px]">
                            <label className="text-white/70 text-xs font-medium block mb-1">Terminal</label>
                            <select
                                className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                                value={terminalFilter}
                                onChange={(e) => setTerminalFilter(e.target.value)}
                            >
                                <option value="todos" className="text-slate-800">Todos los terminales</option>
                                {terminalOptions.map(t => (
                                    <option key={t.value} value={t.value} className="text-slate-800">{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[180px]">
                            <label className="text-white/70 text-xs font-medium block mb-1">Cargo</label>
                            <select
                                className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                                value={cargoFilter}
                                onChange={(e) => setCargoFilter(e.target.value)}
                            >
                                <option value="todos" className="text-slate-800">Todos los cargos</option>
                                {uniqueCargos.map(c => (
                                    <option key={c} value={c} className="text-slate-800">{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row">
                    {/* Calendar Section */}
                    <div className="flex-1 p-6">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={goToPreviousMonth}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <Icon name="chevron-right" size={24} className="rotate-180" />
                            </button>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-slate-800">
                                    {MONTHS[currentMonth]} {currentYear}
                                </h3>
                                <button
                                    onClick={goToToday}
                                    className="text-sm text-brand-600 hover:text-brand-700 font-medium mt-1"
                                >
                                    Ir a hoy
                                </button>
                            </div>
                            <button
                                onClick={goToNextMonth}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <Icon name="chevron-right" size={24} />
                            </button>
                        </div>

                        {/* Days of Week Header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS_OF_WEEK.map((day, i) => (
                                <div
                                    key={day}
                                    className={`text-center text-sm font-semibold py-2 ${i >= 5 ? 'text-slate-400' : 'text-slate-600'}`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, index) => {
                                if (day === null) {
                                    return <div key={`empty-${index}`} className="h-16" />;
                                }

                                const dayVacaciones = getVacacionesForDay(day);
                                const hasVacaciones = dayVacaciones.length > 0;
                                const isSelected = selectedDay === day;
                                const isTodayCell = isToday(day);
                                const isWeekendDay = isWeekend(index);

                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDay(day)}
                                        className={`
                                            h-16 rounded-lg border-2 transition-all text-left p-1 relative
                                            ${isSelected ? 'border-brand-500 bg-brand-50 shadow-md' : 'border-transparent'}
                                            ${isTodayCell ? 'ring-2 ring-brand-400 ring-offset-1' : ''}
                                            ${isWeekendDay ? 'bg-slate-50' : 'bg-white'}
                                            ${hasVacaciones ? 'hover:border-brand-300' : 'hover:bg-slate-50'}
                                        `}
                                    >
                                        <span className={`
                                            text-sm font-semibold
                                            ${isTodayCell ? 'text-brand-600' : isWeekendDay ? 'text-slate-400' : 'text-slate-700'}
                                        `}>
                                            {day}
                                        </span>

                                        {hasVacaciones && (
                                            <div className="mt-1 space-y-0.5">
                                                {dayVacaciones.slice(0, 2).map((v, i) => (
                                                    <div
                                                        key={i}
                                                        className="text-[10px] bg-amber-100 text-amber-800 rounded px-1 truncate font-medium"
                                                        title={`${v.nombre} - ${v.cargo}`}
                                                    >
                                                        {v.nombre.split(' ')[0]}
                                                    </div>
                                                ))}
                                                {dayVacaciones.length > 2 && (
                                                    <div className="text-[10px] text-amber-600 font-medium px-1">
                                                        +{dayVacaciones.length - 2} más
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-6 mt-6 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-amber-100 rounded border border-amber-200" />
                                <span>Con vacaciones</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-slate-50 rounded border border-slate-200" />
                                <span>Fin de semana</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded ring-2 ring-brand-400 ring-offset-1" />
                                <span>Hoy</span>
                            </div>
                        </div>
                    </div>

                    {/* Selected Day Details */}
                    <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 p-6">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Icon name="users" size={18} />
                            {selectedDay ? (
                                <>Vacaciones: {selectedDay} {MONTHS[currentMonth]}</>
                            ) : (
                                <>Selecciona un día</>
                            )}
                        </h4>

                        {selectedDay === null ? (
                            <div className="text-center py-8 text-slate-400">
                                <Icon name="calendar" size={48} className="mx-auto mb-3 opacity-50" />
                                <p>Haz clic en un día para ver quién está de vacaciones</p>
                            </div>
                        ) : selectedDayVacaciones.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Icon name="check-circle" size={48} className="mx-auto mb-3 opacity-50" />
                                <p>Sin vacaciones registradas para este día</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {selectedDayVacaciones.map((v, i) => (
                                    <div key={i} className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                                        <div className="font-semibold text-slate-800">{v.nombre}</div>
                                        <div className="text-sm text-slate-600 mt-1">
                                            <div className="flex items-center gap-2">
                                                <Icon name="tag" size={14} className="text-slate-400" />
                                                {v.cargo}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Icon name="building" size={14} className="text-slate-400" />
                                                {TERMINALS[v.terminal_code as TerminalCode] || v.terminal_code}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Icon name="clock" size={14} className="text-slate-400" />
                                                {v.turno}
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                                            {v.start_date} → {v.end_date}
                                            <span className="ml-2 font-medium text-brand-600">
                                                ({v.business_days} días hábiles)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Summary Stats */}
                        {filteredVacaciones.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-200">
                                <div className="text-xs text-slate-500 uppercase font-semibold mb-2">
                                    Resumen {MONTHS[currentMonth]}
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-slate-200">
                                    <div className="text-2xl font-bold text-brand-600">
                                        {filteredVacaciones.filter(v => {
                                            const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
                                            const monthEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31`;
                                            return v.end_date >= monthStart && v.start_date <= monthEnd;
                                        }).length}
                                    </div>
                                    <div className="text-sm text-slate-600">personas con vacaciones</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
