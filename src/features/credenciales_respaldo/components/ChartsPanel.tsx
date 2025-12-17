import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { BackupLoan, INVENTORY_TERMINALS } from '../types';

interface Props {
    loans: BackupLoan[];
}

const COLORS = {
    LIBRE: '#10b981',
    ASIGNADA: '#3b82f6',
    RECUPERADA: '#8b5cf6',
    CERRADA: '#6b7280',
    CANCELADA: '#f59e0b',
    PERDIDA: '#ef4444',
    DETERIORO: '#f97316',
};

export const ChartsPanel = ({ loans }: Props) => {
    // Weekly loans data (last 8 weeks)
    const weeklyData = useMemo(() => {
        const weeks: Record<string, number> = {};
        const now = new Date();

        // Initialize last 8 weeks
        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - i * 7);
            const weekKey = `S${8 - i}`;
            weeks[weekKey] = 0;
        }

        // Count loans per week
        loans.forEach((loan) => {
            const loanDate = new Date(loan.issued_at);
            const weeksAgo = Math.floor((now.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
            if (weeksAgo >= 0 && weeksAgo < 8) {
                const weekKey = `S${8 - weeksAgo}`;
                if (weeks[weekKey] !== undefined) {
                    weeks[weekKey]++;
                }
            }
        });

        return Object.entries(weeks).map(([week, count]) => ({ week, count }));
    }, [loans]);

    // Reason breakdown (pie chart)
    const reasonData = useMemo(() => {
        const perdida = loans.filter((l) => l.reason === 'PERDIDA').length;
        const deterioro = loans.filter((l) => l.reason === 'DETERIORO').length;
        return [
            { name: 'Perdida', value: perdida, color: COLORS.PERDIDA },
            { name: 'Deterioro', value: deterioro, color: COLORS.DETERIORO },
        ].filter((d) => d.value > 0);
    }, [loans]);

    // Status by terminal (stacked bar)
    const terminalStatusData = useMemo(() => {
        return INVENTORY_TERMINALS.map((terminal) => {
            const terminalLoans = loans.filter(
                (l) => l.backup_cards?.inventory_terminal === terminal
            );
            return {
                terminal: terminal.split(' ')[0],
                ASIGNADA: terminalLoans.filter((l) => l.status === 'ASIGNADA').length,
                RECUPERADA: terminalLoans.filter((l) => l.status === 'RECUPERADA').length,
                CERRADA: terminalLoans.filter((l) => l.status === 'CERRADA').length,
            };
        });
    }, [loans]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Weekly Loans Chart */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Prestamos por Semana</h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" name="Prestamos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Reason Breakdown (Donut) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Motivo de Solicitud</h3>
                <div className="h-48">
                    {reasonData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={reasonData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {reasonData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            Sin datos
                        </div>
                    )}
                </div>
            </div>

            {/* Status by Terminal (Stacked Bar) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Estado por Terminal</h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={terminalStatusData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                            <YAxis type="category" dataKey="terminal" tick={{ fontSize: 11 }} width={60} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Bar dataKey="ASIGNADA" name="Asignada" stackId="a" fill={COLORS.ASIGNADA} />
                            <Bar dataKey="RECUPERADA" name="Recuperada" stackId="a" fill={COLORS.RECUPERADA} />
                            <Bar dataKey="CERRADA" name="Cerrada" stackId="a" fill={COLORS.CERRADA} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
