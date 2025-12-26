/**
 * RutPdfExportModal - Professional PDF generator for worker monthly schedule
 * Single page, clean design for worker delivery
 * Includes Ley 40 horas (43 hrs in 2026) with reduced hour days
 */

import { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Icon } from '../../../shared/components/common/Icon';
import { StaffWithShift, AttendanceMark, AttendanceLicense, AttendancePermission, ShiftType } from '../types';
import {
    getMonthDates,
    formatDayOfWeek,
    getMonthName,
    isOffDay,
    getWeekStart,
    getReducedHourDays,
    getAdjustedHorario,
} from '../utils/shiftEngine';
import { useShiftTypes } from '../hooks';

interface RutPdfExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: StaffWithShift[];
    marks: AttendanceMark[];
    licenses: AttendanceLicense[];
    permissions: AttendancePermission[];
    vacations: { staff_id: string; start_date: string; end_date: string }[];
    year: number;
    month: number;
}

export const RutPdfExportModal = ({
    isOpen,
    onClose,
    staff,
    marks,
    licenses,
    permissions,
    vacations,
    year,
    month,
}: RutPdfExportModalProps) => {
    const [selectedRut, setSelectedRut] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState(month);
    const [selectedYear, setSelectedYear] = useState(year);
    const [isGenerating, setIsGenerating] = useState(false);

    const { data: shiftTypes = [] } = useShiftTypes();

    const shiftTypesMap = useMemo(() => {
        const map = new Map<string, ShiftType>();
        for (const st of shiftTypes) {
            map.set(st.code, st);
        }
        return map;
    }, [shiftTypes]);

    const selectedStaff = staff.find((s) => s.rut === selectedRut);

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    if (!isOpen) return null;

    const generatePdf = async () => {
        if (!selectedStaff) return;

        setIsGenerating(true);

        try {
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'letter',
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;

            // Colors
            const brandColor = [37, 99, 235] as [number, number, number]; // blue-600
            const lightGray = [248, 250, 252] as [number, number, number]; // slate-50
            const darkGray = [51, 65, 85] as [number, number, number]; // slate-700
            const greenColor = [16, 185, 129] as [number, number, number]; // emerald-500
            const offDayColor = [226, 232, 240] as [number, number, number]; // slate-200
            const reducedColor = [251, 191, 36] as [number, number, number]; // amber-400

            // Header background
            doc.setFillColor(...brandColor);
            doc.rect(0, 0, pageWidth, 30, 'F');

            // Company logo placeholder
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('ASISTENCIA MENSUAL', margin, 13);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`${getMonthName(selectedMonth)} ${selectedYear} | Ley 40 Horas (43 hrs/sem)`, margin, 22);

            // Worker info box
            doc.setFillColor(...lightGray);
            doc.roundedRect(margin, 35, pageWidth - 2 * margin, 25, 2, 2, 'F');

            doc.setTextColor(...darkGray);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(selectedStaff.nombre, margin + 5, 45);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`RUT: ${selectedStaff.rut}`, margin + 5, 52);
            doc.text(`Cargo: ${selectedStaff.cargo}`, margin + 80, 52);
            doc.text(`Terminal: ${selectedStaff.terminal_code}`, margin + 140, 52);

            // Shift info
            const shiftType = selectedStaff.shift ? shiftTypesMap.get(selectedStaff.shift.shift_type_code) : null;
            doc.text(`Horario Base: ${selectedStaff.horario || 'Sin asignar'}`, margin + 5, 58);
            doc.text(`Turno: ${shiftType?.name || '5x2 Fijo (Default)'}`, margin + 80, 58);
            doc.text(`Tipo: ${selectedStaff.turno || 'DIA'}`, margin + 180, 58);

            // Generate calendar table
            const monthDates = getMonthDates(selectedYear, selectedMonth);
            const weeks: string[][] = [];
            let currentWeek: string[] = [];

            // Get first day of month day of week
            const firstDate = new Date(monthDates[0] + 'T12:00:00');
            const firstDayOfWeek = firstDate.getDay(); // 0 = Sunday
            const mondayFirst = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

            // Fill empty cells before first date
            for (let i = 0; i < mondayFirst; i++) {
                currentWeek.push('');
            }

            // Fill dates
            for (const date of monthDates) {
                currentWeek.push(date);
                if (currentWeek.length === 7) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }
            }

            // Fill remaining empty cells
            if (currentWeek.length > 0) {
                while (currentWeek.length < 7) {
                    currentWeek.push('');
                }
                weeks.push(currentWeek);
            }

            // Build table data
            const tableBody: string[][] = [];

            for (const week of weeks) {
                const row: string[] = [];
                const weekStart = week.find(d => d !== '') || '';
                const weekStartFormatted = weekStart ? getWeekStart(weekStart) : '';
                const reducedDays = weekStartFormatted ? getReducedHourDays(weekStartFormatted) : [];

                for (const dateStr of week) {
                    if (!dateStr) {
                        row.push('');
                        continue;
                    }

                    const date = new Date(dateStr + 'T12:00:00');
                    const dayNum = date.getDate();

                    // Check if off day
                    let isOff = false;
                    if (selectedStaff.shift) {
                        const shiftPattern = shiftType?.pattern_json;
                        if (shiftPattern) {
                            isOff = isOffDay(dateStr, selectedStaff.shift.shift_type_code, selectedStaff.shift.variant_code, shiftPattern);
                        }
                    } else {
                        // Default: Sat/Sun off
                        const dayOfWeek = date.getDay();
                        isOff = dayOfWeek === 0 || dayOfWeek === 6;
                    }

                    // Check license/vacation/permission
                    const hasLicense = licenses.some(l => l.staff_id === selectedStaff.id && dateStr >= l.start_date && dateStr <= l.end_date);
                    const hasVacation = vacations.some(v => v.staff_id === selectedStaff.id && dateStr >= v.start_date && dateStr <= v.end_date);
                    const hasPerm = permissions.some(p => p.staff_id === selectedStaff.id && dateStr >= p.start_date && dateStr <= p.end_date);

                    if (hasLicense) {
                        row.push(`${dayNum}\nLIC`);
                    } else if (hasVacation) {
                        row.push(`${dayNum}\nVAC`);
                    } else if (hasPerm) {
                        row.push(`${dayNum}\nPER`);
                    } else if (isOff) {
                        row.push(`${dayNum}\nLIBRE`);
                    } else {
                        // Work day - check if reduced hour
                        const isReduced = reducedDays.includes(dateStr);
                        const horario = selectedStaff.horario || '10:00-20:00';
                        const displayHorario = isReduced ? getAdjustedHorario(horario, true) : horario;
                        const shortHorario = displayHorario.replace(/:\d{2}/g, '');
                        row.push(`${dayNum}\n${shortHorario}${isReduced ? '*' : ''}`);
                    }
                }

                tableBody.push(row);
            }

            // Draw calendar table
            autoTable(doc, {
                startY: 65,
                head: [['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']],
                body: tableBody,
                theme: 'grid',
                headStyles: {
                    fillColor: brandColor,
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    cellPadding: 3,
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 4,
                    halign: 'center',
                    valign: 'middle',
                    minCellHeight: 18,
                    lineColor: [203, 213, 225],
                    lineWidth: 0.3,
                },
                columnStyles: {
                    0: { cellWidth: 35 },
                    1: { cellWidth: 35 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 35 },
                    4: { cellWidth: 35 },
                    5: { cellWidth: 35, fillColor: offDayColor },
                    6: { cellWidth: 35, fillColor: offDayColor },
                },
                didParseCell: (data) => {
                    const cellText = data.cell.text.join('\n');
                    if (cellText.includes('LIBRE')) {
                        data.cell.styles.fillColor = offDayColor;
                        data.cell.styles.textColor = [100, 116, 139]; // slate-500
                    } else if (cellText.includes('LIC')) {
                        data.cell.styles.fillColor = [243, 232, 255]; // purple-100
                        data.cell.styles.textColor = [107, 33, 168]; // purple-700
                    } else if (cellText.includes('VAC')) {
                        data.cell.styles.fillColor = [204, 251, 241]; // teal-100
                        data.cell.styles.textColor = [15, 118, 110]; // teal-700
                    } else if (cellText.includes('PER')) {
                        data.cell.styles.fillColor = [254, 243, 199]; // amber-100
                        data.cell.styles.textColor = [180, 83, 9]; // amber-700
                    } else if (cellText.includes('*')) {
                        // Reduced hour day
                        data.cell.styles.fillColor = [254, 249, 195]; // yellow-100
                    }
                },
                margin: { left: margin, right: margin },
            });

            // Footer with legend
            const finalY = (doc as any).lastAutoTable.finalY + 8;

            doc.setFontSize(8);
            doc.setTextColor(...darkGray);
            doc.setFont('helvetica', 'bold');
            doc.text('LEYENDA:', margin, finalY);

            doc.setFont('helvetica', 'normal');
            const legends = [
                { text: 'LIBRE = Día libre', x: margin + 20 },
                { text: 'LIC = Licencia', x: margin + 60 },
                { text: 'VAC = Vacaciones', x: margin + 95 },
                { text: 'PER = Permiso', x: margin + 135 },
                { text: '* = Día reducido (-1hr Ley 40hrs)', x: margin + 170 },
            ];

            for (const leg of legends) {
                doc.text(leg.text, leg.x, finalY);
            }

            // Footer
            doc.setFontSize(7);
            doc.text(`Generado: ${new Date().toLocaleString('es-CL')} | Ley 40 Horas: 43 hrs/semana en 2026 (2 días reducidos: Mar y Jue)`, margin, pageHeight - 8);

            // Save
            const fileName = `Horario_${selectedStaff.rut.replace(/\./g, '')}_${months[selectedMonth]}_${selectedYear}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-t-xl">
                    <div>
                        <h2 className="text-lg font-semibold">Generar PDF Mensual</h2>
                        <p className="text-sm text-brand-100">Horario para entregar al trabajador</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Icon name="x" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Staff selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Seleccionar Trabajador
                        </label>
                        <select
                            value={selectedRut}
                            onChange={(e) => setSelectedRut(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">-- Seleccionar --</option>
                            {staff.map((s) => (
                                <option key={s.rut} value={s.rut}>
                                    {s.nombre} ({s.rut})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Month/Year selectors */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mes</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                            >
                                {months.map((m, i) => (
                                    <option key={i} value={i}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                            >
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                                <option value={2027}>2027</option>
                            </select>
                        </div>
                    </div>

                    {/* Preview info */}
                    {selectedStaff && (
                        <div className="p-3 bg-slate-50 rounded-lg border">
                            <div className="font-medium text-slate-800">{selectedStaff.nombre}</div>
                            <div className="text-sm text-slate-500">
                                {selectedStaff.horario || 'Sin horario'} | {selectedStaff.turno}
                            </div>
                            <div className="text-xs text-brand-600 mt-1">
                                {selectedStaff.shift
                                    ? shiftTypesMap.get(selectedStaff.shift.shift_type_code)?.name
                                    : '5x2 Fijo (Por defecto)'}
                            </div>
                        </div>
                    )}

                    {/* Ley 40 hrs info */}
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-2">
                            <Icon name="info" size={16} className="text-amber-600 mt-0.5" />
                            <div>
                                <div className="text-sm font-medium text-amber-800">Ley 40 Horas</div>
                                <div className="text-xs text-amber-700">
                                    En 2026: 43 hrs/semana. Los martes y jueves tienen -1 hora (indicados con *).
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={generatePdf}
                        disabled={!selectedRut || isGenerating}
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Icon name="loader" size={16} className="animate-spin" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <Icon name="download" size={16} />
                                Generar PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
