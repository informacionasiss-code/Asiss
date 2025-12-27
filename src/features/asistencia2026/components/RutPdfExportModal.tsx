/**
 * RutPdfExportModal - Professional PDF generator for worker monthly schedule
 * Enterprise Edition - PRINTER FRIENDLY (B&W)
 * Optimized for Black & White printing with high contrast and clear markers.
 */

import { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Icon } from '../../../shared/components/common/Icon';
import {
    StaffWithShift,
    AttendanceMark,
    AttendanceLicense,
    AttendancePermission,
    ShiftType,
    AttendanceIncidences
} from '../types';
import {
    getMonthDates,
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
    incidences: AttendanceIncidences; // Added incidences
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
    incidences,
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
            const margin = 12;

            // B&W / Printer Friendly Palette - High Constrast
            const colors = {
                brand: [0, 0, 0] as [number, number, number],          // Black Header
                headerBg: [255, 255, 255] as [number, number, number], // White Background
                textMain: [0, 0, 0] as [number, number, number],       // Black Text
                textLight: [60, 60, 60] as [number, number, number],   // Dark Gray
                border: [0, 0, 0] as [number, number, number],         // Black Borders

                // Event Backgrounds (Grayscale for Contrast)
                bgOff: [230, 230, 230] as [number, number, number],    // Light Gray (Libre)
                bgLic: [255, 255, 255] as [number, number, number],    // White
                bgVac: [255, 255, 255] as [number, number, number],    // White
                bgPer: [255, 255, 255] as [number, number, number],    // White
                bgNoMark: [40, 40, 40] as [number, number, number],    // Dark Gray (White text)
                bgNoCred: [180, 180, 180] as [number, number, number], // Medium Gray
                bgDayChange: [255, 255, 255] as [number, number, number], // White
                bgReduced: [255, 255, 255] as [number, number, number],
            };

            // --- HEADER SECTION ---

            // Top bar (Black)
            doc.setFillColor(...colors.brand);
            doc.rect(0, 0, pageWidth, 25, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('ASISTENCIA MENSUAL', margin, 12);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('REPORTE OFICIAL DE TURNOS Y ASISTENCIA', margin, 18);

            // Period Info
            doc.setFontSize(14);
            doc.text(`${getMonthName(selectedMonth).toUpperCase()} ${selectedYear}`, pageWidth - margin, 12, { align: 'right' });
            doc.setFontSize(9);
            doc.text('Ley 40 Horas (43 hrs/sem)', pageWidth - margin, 18, { align: 'right' });


            // --- WORKER INFO CARD (Borders only) ---
            doc.setDrawColor(...colors.border);
            doc.setLineWidth(0.3);
            doc.setFillColor(...colors.headerBg);
            doc.roundedRect(margin, 30, pageWidth - 2 * margin, 22, 1, 1, 'S'); // 'S' for stroke only (no fill needed if white)

            // Name
            doc.setTextColor(...colors.textMain);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(selectedStaff.nombre.toUpperCase(), margin + 5, 38);

            // Details Grid
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            // Column 1
            doc.text('RUT:', margin + 5, 45);
            doc.setFont('helvetica', 'bold');
            doc.text(selectedStaff.rut, margin + 25, 45);
            doc.setFont('helvetica', 'normal');

            // Column 2
            doc.text('CARGO:', margin + 70, 45);
            doc.setFont('helvetica', 'bold');
            doc.text(selectedStaff.cargo, margin + 90, 45);
            doc.setFont('helvetica', 'normal');

            // Column 3
            doc.text('TERMINAL:', margin + 140, 45);
            doc.setFont('helvetica', 'bold');
            doc.text(selectedStaff.terminal_code, margin + 165, 45);
            doc.setFont('helvetica', 'normal');

            // Row 2
            const shiftType = selectedStaff.shift ? shiftTypesMap.get(selectedStaff.shift.shift_type_code) : null;

            doc.text('TURNOS:', margin + 5, 50);
            doc.setFont('helvetica', 'bold');
            doc.text(shiftType?.name || '5x2 Base', margin + 25, 50);
            doc.setFont('helvetica', 'normal');

            doc.text('HORARIO BASE:', margin + 70, 50);
            doc.setFont('helvetica', 'bold');
            doc.text(selectedStaff.horario || 'Sin asignar', margin + 100, 50);
            doc.setFont('helvetica', 'normal');


            // --- CALENDAR LOGIC ---
            const monthDates = getMonthDates(selectedYear, selectedMonth);
            const weeks: string[][] = [];
            let currentWeek: string[] = [];
            const firstDate = new Date(monthDates[0] + 'T12:00:00');
            const firstDayOfWeek = firstDate.getDay();
            const mondayFirst = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

            for (let i = 0; i < mondayFirst; i++) currentWeek.push('');
            for (const date of monthDates) {
                currentWeek.push(date);
                if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
            }
            if (currentWeek.length > 0) {
                while (currentWeek.length < 7) currentWeek.push('');
                weeks.push(currentWeek);
            }

            // Build Table Body
            const tableBody: string[][] = [];

            const incidentsMap = {
                noMark: new Set(incidences.noMarcaciones.filter(i => i.rut === selectedStaff.rut).map(i => i.date)),
                noCred: new Set(incidences.sinCredenciales.filter(i => i.rut === selectedStaff.rut).map(i => i.date)),
                dayChange: new Map(incidences.cambiosDia.filter(i => i.rut === selectedStaff.rut).map(i => [i.date, i])),
            };


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

                    // Priority handling
                    const dayChange = incidentsMap.dayChange.get(dateStr);
                    if (dayChange) {
                        row.push(`${dayNum}\nCAMBIO DE DÍA\n(Por ${dayChange.target_date})`);
                        continue;
                    }

                    const hasLicense = licenses.some(l => l.staff_id === selectedStaff.id && dateStr >= l.start_date && dateStr <= l.end_date);
                    if (hasLicense) {
                        row.push(`${dayNum}\nLICENCIA\nMÉDICA`);
                        continue;
                    }

                    const hasVacation = vacations.some(v => v.staff_id === selectedStaff.id && dateStr >= v.start_date && dateStr <= v.end_date);
                    if (hasVacation) {
                        row.push(`${dayNum}\nVACACIONES`);
                        continue;
                    }

                    const hasPerm = permissions.some(p => p.staff_id === selectedStaff.id && dateStr >= p.start_date && dateStr <= p.end_date);
                    if (hasPerm) {
                        row.push(`${dayNum}\nPERMISO`);
                        continue;
                    }

                    if (incidentsMap.noMark.has(dateStr)) {
                        row.push(`${dayNum}\nNO\nMARCACIÓN`);
                        continue;
                    }
                    if (incidentsMap.noCred.has(dateStr)) {
                        row.push(`${dayNum}\nSIN\nCREDENCIAL`);
                        continue;
                    }

                    let isOff = false;
                    if (selectedStaff.shift) {
                        const shiftPattern = shiftType?.pattern_json;
                        if (shiftPattern) {
                            isOff = isOffDay(dateStr, selectedStaff.shift.shift_type_code, selectedStaff.shift.variant_code, shiftPattern);
                        }
                    } else {
                        const dayOfWeek = date.getDay();
                        isOff = dayOfWeek === 0 || dayOfWeek === 6;
                    }

                    if (isOff) {
                        row.push(`${dayNum}\nLIBRE`);
                    } else {
                        const isReduced = reducedDays.includes(dateStr);
                        let horario = selectedStaff.horario || '10:00-20:00';
                        if (isReduced) {
                            horario = getAdjustedHorario(horario, true);
                        }
                        const formattedTime = horario.replace('-', ' - ');
                        row.push(`${dayNum}\n${formattedTime}${isReduced ? '*' : ''}`);
                    }
                }
                tableBody.push(row);
            }

            // --- DRAW TABLE (High Contrast) ---
            autoTable(doc, {
                startY: 60,
                head: [['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']],
                body: tableBody,
                theme: 'grid', // 'grid' theme gives us the borders we need
                headStyles: {
                    fillColor: [0, 0, 0], // Black header
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    cellPadding: 4,
                    lineWidth: 0.1,
                    lineColor: [0, 0, 0]
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    halign: 'center',
                    valign: 'middle',
                    minCellHeight: 25,
                    lineColor: [0, 0, 0], // Black borders
                    lineWidth: 0.2, // Slightly clearer borders
                    textColor: [0, 0, 0], // Black text
                    fontStyle: 'normal'
                },
                columnStyles: {
                    0: { cellWidth: 36 },
                    1: { cellWidth: 36 },
                    2: { cellWidth: 36 },
                    3: { cellWidth: 36 },
                    4: { cellWidth: 36 },
                    5: { cellWidth: 36 },
                    6: { cellWidth: 36 },
                },
                didParseCell: (data) => {
                    const text = data.cell.text.join('\n').toUpperCase();
                    data.cell.styles.fillColor = [255, 255, 255]; // Default white

                    if (text.includes('LIBRE')) {
                        data.cell.styles.fillColor = colors.bgOff; // Light Gray
                    } else if (text.includes('LICENCIA')) {
                        data.cell.styles.fontStyle = 'bold';
                        // Keep white to save ink/toner, bold text is enough
                    } else if (text.includes('VACACIONES')) {
                        data.cell.styles.fontStyle = 'bold';
                    } else if (text.includes('PERMISO')) {
                        data.cell.styles.fontStyle = 'bold';
                    } else if (text.includes('NO MARCACIÓN') || text.includes('NO\nMARCACIÓN')) {
                        data.cell.styles.fillColor = [50, 50, 50]; // Dark Gray
                        data.cell.styles.textColor = [255, 255, 255]; // White Text
                        data.cell.styles.fontStyle = 'bold';
                    } else if (text.includes('SIN CREDENCIAL') || text.includes('SIN\nCREDENCIAL')) {
                        data.cell.styles.fillColor = [200, 200, 200]; // Medium Gray
                        data.cell.styles.fontStyle = 'bold';
                    } else if (text.includes('CAMBIO DE DÍA') || text.includes('CAMBIO')) {
                        data.cell.styles.fontStyle = 'bold';
                        // Italic maybe to denote change? 
                        // Bold is safer for reading.
                    } else if (text.includes('*')) {
                        // Reduced days - just the asterisk
                    }
                },
                margin: { left: margin, right: margin },
            });

            // --- LEGEND (Updated for B&W) ---
            const finalY = (doc as any).lastAutoTable.finalY + 10;

            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);
            doc.rect(margin, finalY, pageWidth - 2 * margin, 20); // Simple rect

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('LEYENDA:', margin + 5, finalY + 6);

            const drawLegendItem = (label: string, filled: boolean, dark: boolean, x: number, y: number) => {
                doc.setDrawColor(0, 0, 0);
                if (filled) {
                    if (dark) doc.setFillColor(50, 50, 50);
                    else doc.setFillColor(230, 230, 230);
                    doc.rect(x, y - 2, 4, 4, 'FD');
                } else {
                    doc.rect(x, y - 2, 4, 4, 'S');
                }

                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'normal');
                doc.text(label, x + 6, y + 1);
            };

            const row1Y = finalY + 12;
            const col1 = margin + 8;
            const col2 = margin + 55;
            const col3 = margin + 110;
            const col4 = margin + 165;

            drawLegendItem('Día Libre (Gris)', true, false, col1, row1Y);
            drawLegendItem('No Marcación (Fondo Oscuro)', true, true, col2, row1Y);
            drawLegendItem('Eventos en Negrita (Lic/Vac)', false, false, col3, row1Y);
            drawLegendItem('* Día Reducido (Ley 40 Horas)', false, false, col4, row1Y);


            // --- FOOTER ---
            const footerY = pageHeight - 10;
            doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
            doc.setFontSize(8);
            doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, margin, footerY);
            doc.text('Documento oficial. Impresión B/N optimizada.', pageWidth - margin, footerY, { align: 'right' });

            const fileName = `Asistencia_${selectedStaff.rut.replace(/\./g, '')}_${months[selectedMonth]}_${selectedYear}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Exportar PDF Mensual</h2>
                        <p className="text-sm text-slate-500">Generar reporte de asistencia para imprimir</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
                        <Icon name="x" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Staff selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Trabajador
                        </label>
                        <select
                            value={selectedRut}
                            onChange={(e) => setSelectedRut(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        >
                            <option value="">-- Seleccionar Trabajador --</option>
                            {staff.map((s) => (
                                <option key={s.rut} value={s.rut}>
                                    {s.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Month/Year selectors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Mes</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {months.map((m, i) => (
                                    <option key={i} value={i}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Año</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                                <option value={2027}>2027</option>
                            </select>
                        </div>
                    </div>

                    {/* Preview info card */}
                    {selectedStaff && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Icon name="user" size={20} />
                                </div>
                                <div>
                                    <div className="font-semibold text-blue-900">{selectedStaff.nombre}</div>
                                    <div className="text-xs text-blue-700">{selectedStaff.cargo}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mt-3 pt-3 border-t border-blue-100">
                                <div>
                                    <span className="text-blue-500 text-xs block">Horario</span>
                                    <span className="text-blue-900 font-medium">{selectedStaff.horario || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-blue-500 text-xs block">Turno</span>
                                    <span className="text-blue-900 font-medium">{selectedStaff.turno}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={generatePdf}
                        disabled={!selectedRut || isGenerating}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Icon name="loader" size={18} className="animate-spin" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <Icon name="download" size={18} />
                                Generar Documento
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
