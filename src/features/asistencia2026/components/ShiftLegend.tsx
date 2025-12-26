/**
 * ShiftLegend - Color legend for attendance grid
 */

import { DAY_COLORS, INCIDENCE_COLORS } from '../utils/colors';

export const ShiftLegend = () => {
    const items = [
        { label: 'Libre (OFF)', colors: DAY_COLORS.OFF },
        { label: 'Turno Día', colors: DAY_COLORS.WORK_DIA },
        { label: 'Turno Noche', colors: DAY_COLORS.WORK_NOCHE },
        { label: 'Presente (P)', colors: DAY_COLORS.PRESENTE },
        { label: 'Ausente (A)', colors: DAY_COLORS.AUSENTE },
        { label: 'Licencia (LIC)', colors: DAY_COLORS.LIC },
        { label: 'Vacaciones (VAC)', colors: DAY_COLORS.VAC },
        { label: 'Permiso (PER)', colors: DAY_COLORS.PER },
        { label: 'Pendiente', colors: DAY_COLORS.PENDING },
    ];

    const incidences = [
        { label: 'No Marcación (NM)', className: INCIDENCE_COLORS.NM },
        { label: 'Sin Credencial (NC)', className: INCIDENCE_COLORS.NC },
        { label: 'Cambio Día (CD)', className: INCIDENCE_COLORS.CD },
        { label: 'Autorización (AUT)', className: INCIDENCE_COLORS.AUT },
    ];

    return (
        <div className="flex flex-wrap items-center gap-3 text-xs">
            {items.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`w-4 h-4 rounded ${item.colors.bg} ${item.colors.border} border`} />
                    <span className="text-slate-600">{item.label}</span>
                </div>
            ))}
            <div className="w-px h-4 bg-slate-300" />
            {incidences.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${item.className}`}>
                        {item.label.match(/\((\w+)\)/)?.[1]}
                    </div>
                    <span className="text-slate-600 hidden xl:inline">{item.label.split(' (')[0]}</span>
                </div>
            ))}
        </div>
    );
};
