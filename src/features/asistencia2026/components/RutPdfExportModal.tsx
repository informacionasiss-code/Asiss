/**
 * RutPdfExportModal - Export monthly attendance PDF by RUT
 */

import { useState, useMemo } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { BUTTON_VARIANTS, DAY_COLORS } from '../utils/colors';
import { getMonthDates, formatDayNumber, formatDayOfWeek, getMonthName } from '../utils/shiftEngine';
import { StaffWithShift, AttendanceMark, AttendanceLicense, AttendancePermission } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    const [searchRut, setSearchRut] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<StaffWithShift | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const dates = useMemo(() => getMonthDates(year, month), [year, month]);

    // Find matching staff
    const matchingStaff = useMemo(() => {
        if (!searchRut.trim()) return [];
        const search = searchRut.toLowerCase().replace(/[.-]/g, '');
        return staff.filter(
            (s) =>
                s.rut.toLowerCase().replace(/[.-]/g, '').includes(search) ||
                s.nombre.toLowerCase().includes(search)
        ).slice(0, 5);
    }, [searchRut, staff]);

    // Get data for selected staff
    const staffMarks = useMemo(() => {
        if (!selectedStaff) return [];
        return marks.filter((m) => m.staff_id === selectedStaff.id);
    }, [selectedStaff, marks]);

    const staffLicenses = useMemo(() => {
        if (!selectedStaff) return [];
        return licenses.filter((l) => l.staff_id === selectedStaff.id);
    }, [selectedStaff, licenses]);

    const staffPermissions = useMemo(() => {
        if (!selectedStaff) return [];
        return permissions.filter((p) => p.staff_id === selectedStaff.id);
    }, [selectedStaff, permissions]);

    const staffVacations = useMemo(() => {
        if (!selectedStaff) return [];
        return vacations.filter((v) => v.staff_id === selectedStaff.id);
    }, [selectedStaff, vacations]);

    if (!isOpen) return null;

    const handleSelectStaff = (s: StaffWithShift) => {
        setSelectedStaff(s);
        setSearchRut(s.rut);
    };

    const generatePdf = async () => {
        if (!selectedStaff) return;

        setIsGenerating(true);

        try {
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const monthName = getMonthName(month);

            // Header
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(`Asistencia ${monthName} ${year}`, 14, 15);

            // Staff info
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Nombre: ${selectedStaff.nombre}`, 14, 25);
            doc.text(`RUT: ${selectedStaff.rut}`, 14, 30);
            doc.text(`Cargo: ${selectedStaff.cargo}`, 80, 25);
            doc.text(`Terminal: ${selectedStaff.terminal_code}`, 80, 30);
            doc.text(`Horario: ${selectedStaff.horario}`, 140, 25);
            doc.text(`Turno: ${selectedStaff.turno}`, 140, 30);

            // Calendar table
            const calendarData = dates.map((date) => {
                const dayNum = formatDayNumber(date);
                const dayName = formatDayOfWeek(date);
                const mark = staffMarks.find((m) => m.mark_date === date);
                const license = staffLicenses.find(
                    (l) => date >= l.start_date && date <= l.end_date
                );
                const permission = staffPermissions.find(
                    (p) => date >= p.start_date && date <= p.end_date
                );
                const vacation = staffVacations.find(
                    (v) => date >= v.start_date && date <= v.end_date
                );

                let status = '-';
                if (mark) status = mark.mark;
                else if (license) status = 'LIC';
                else if (vacation) status = 'VAC';
                else if (permission) status = 'PER';

                return [`${dayNum}`, dayName, status, mark?.note || ''];
            });

            autoTable(doc, {
                startY: 38,
                head: [['Día', 'Sem', 'Estado', 'Nota']],
                body: calendarData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 8 },
                bodyStyles: { fontSize: 7 },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 12 },
                    2: { cellWidth: 15 },
                    3: { cellWidth: 'auto' },
                },
                margin: { left: 14, right: 14 },
            });

            // Get final Y position
            const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100;

            // Licenses summary
            if (staffLicenses.length > 0) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('Licencias del mes:', 14, finalY + 10);

                autoTable(doc, {
                    startY: finalY + 14,
                    head: [['Desde', 'Hasta', 'Nota']],
                    body: staffLicenses.map((l) => [l.start_date, l.end_date, l.note || '']),
                    theme: 'striped',
                    headStyles: { fillColor: [139, 92, 246], textColor: 255, fontSize: 8 },
                    bodyStyles: { fontSize: 8 },
                    margin: { left: 14, right: 14 },
                });
            }

            // Permissions summary
            if (staffPermissions.length > 0) {
                const licenseTableEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || finalY + 20;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('Permisos del mes:', 14, licenseTableEnd + 10);

                autoTable(doc, {
                    startY: licenseTableEnd + 14,
                    head: [['Desde', 'Hasta', 'Tipo', 'Nota']],
                    body: staffPermissions.map((p) => [
                        p.start_date,
                        p.end_date,
                        p.permission_type,
                        p.note || '',
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [245, 158, 11], textColor: 255, fontSize: 8 },
                    bodyStyles: { fontSize: 8 },
                    margin: { left: 14, right: 14 },
                });
            }

            // Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(
                    `Generado: ${new Date().toLocaleString('es-CL')} | Página ${i} de ${pageCount}`,
                    14,
                    doc.internal.pageSize.height - 10
                );
            }

            // Save
            doc.save(`Asistencia_${selectedStaff.rut}_${monthName}_${year}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b shrink-0">
                        <div className="flex items-center gap-2">
                            <Icon name="file-text" size={20} className="text-brand-600" />
                            <h3 className="font-semibold text-slate-800">Exportar PDF por RUT</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Icon name="x" size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4 overflow-y-auto flex-1">
                        {/* Search input */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Buscar por RUT o Nombre
                            </label>
                            <div className="relative">
                                <Icon
                                    name="search"
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    value={searchRut}
                                    onChange={(e) => {
                                        setSearchRut(e.target.value);
                                        setSelectedStaff(null);
                                    }}
                                    placeholder="Ej: 12.345.678-9 o Juan Pérez"
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                />
                            </div>

                            {/* Search results */}
                            {matchingStaff.length > 0 && !selectedStaff && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {matchingStaff.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => handleSelectStaff(s)}
                                            className="w-full p-3 text-left hover:bg-slate-50 transition-colors border-b last:border-b-0"
                                        >
                                            <p className="font-medium text-slate-800">{s.nombre}</p>
                                            <p className="text-sm text-slate-500">
                                                {s.rut} | {s.cargo}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected staff preview */}
                        {selectedStaff && (
                            <div className="space-y-3">
                                <div className="p-3 bg-brand-50 rounded-lg border border-brand-100">
                                    <p className="font-medium text-brand-800">{selectedStaff.nombre}</p>
                                    <p className="text-sm text-brand-600">
                                        {selectedStaff.rut} | {selectedStaff.cargo} | {selectedStaff.terminal_code}
                                    </p>
                                </div>

                                {/* Quick stats */}
                                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                    <div className={`p-2 rounded-lg ${DAY_COLORS.PRESENTE.bg}`}>
                                        <div className="font-semibold text-emerald-700">
                                            {staffMarks.filter((m) => m.mark === 'P').length}
                                        </div>
                                        <div className="text-emerald-600">Presente</div>
                                    </div>
                                    <div className={`p-2 rounded-lg ${DAY_COLORS.AUSENTE.bg}`}>
                                        <div className="font-semibold text-red-700">
                                            {staffMarks.filter((m) => m.mark === 'A').length}
                                        </div>
                                        <div className="text-red-600">Ausente</div>
                                    </div>
                                    <div className={`p-2 rounded-lg ${DAY_COLORS.LIC.bg}`}>
                                        <div className="font-semibold text-purple-700">
                                            {staffLicenses.length}
                                        </div>
                                        <div className="text-purple-600">Licencias</div>
                                    </div>
                                    <div className={`p-2 rounded-lg ${DAY_COLORS.PER.bg}`}>
                                        <div className="font-semibold text-amber-700">
                                            {staffPermissions.length}
                                        </div>
                                        <div className="text-amber-600">Permisos</div>
                                    </div>
                                </div>

                                {/* Month info */}
                                <p className="text-sm text-slate-500 text-center">
                                    Período: {getMonthName(month)} {year} ({dates.length} días)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t bg-slate-50 shrink-0">
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className={`flex-1 py-2 rounded-lg font-medium ${BUTTON_VARIANTS.secondary}`}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={generatePdf}
                                disabled={!selectedStaff || isGenerating}
                                className={`flex-1 py-2 rounded-lg font-medium ${BUTTON_VARIANTS.primary} disabled:opacity-50`}
                            >
                                {isGenerating ? (
                                    <>
                                        <Icon name="loader" size={16} className="inline animate-spin mr-1" />
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="download" size={16} className="inline mr-1" />
                                        Descargar PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
