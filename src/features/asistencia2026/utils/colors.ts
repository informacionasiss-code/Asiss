/**
 * Color palette for Asistencia 2026
 * Professional, sober colors without emojis
 */

// Day status colors
export const DAY_COLORS = {
    OFF: {
        bg: 'bg-slate-100',
        text: 'text-slate-500',
        border: 'border-slate-200',
    },
    WORK_DIA: {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
    },
    WORK_NOCHE: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
    },
    LIC: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
    },
    VAC: {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
    },
    PER: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
    },
    PRESENTE: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
    },
    AUSENTE: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
    },
    PENDING: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-300',
    },
    DESVINCULADO: {
        bg: 'bg-slate-50',
        text: 'text-slate-400 line-through',
        border: 'border-slate-200',
    },
} as const;

// Incidence badge colors
export const INCIDENCE_COLORS = {
    NM: 'bg-yellow-100 text-yellow-800 border-yellow-300', // No marcación
    NC: 'bg-orange-100 text-orange-800 border-orange-300', // Sin credencial
    CD: 'bg-blue-100 text-blue-800 border-blue-300',       // Cambio de día
    AUT: 'bg-green-100 text-green-800 border-green-300',   // Autorización
} as const;

// Today column highlight
export const TODAY_HIGHLIGHT = 'bg-brand-50/50 ring-2 ring-brand-200 ring-inset';

// Terminal button colors
export const TERMINAL_COLORS: Record<string, string> = {
    EL_ROBLE: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    LA_REINA: 'bg-blue-600 hover:bg-blue-700 text-white',
    EL_SALTO: 'bg-amber-600 hover:bg-amber-700 text-white',
    LO_ECHEVERS: 'bg-purple-600 hover:bg-purple-700 text-white',
    COLO_COLO: 'bg-red-600 hover:bg-red-700 text-white',
    ALL: 'bg-slate-600 hover:bg-slate-700 text-white',
};

// KPI badge colors
export const KPI_COLORS = {
    count: 'bg-slate-100 text-slate-700',
    programmed: 'bg-sky-100 text-sky-700',
    license: 'bg-purple-100 text-purple-700',
    vacation: 'bg-teal-100 text-teal-700',
    permission: 'bg-amber-100 text-amber-700',
    incident: 'bg-orange-100 text-orange-700',
    pending: 'bg-red-100 text-red-700',
} as const;

// Cargo section colors (subtle backgrounds for grouping)
export const CARGO_COLORS: Record<string, string> = {
    SUPERVISOR: 'bg-indigo-50/50',
    INSPECTOR: 'bg-sky-50/50',
    CONDUCTOR: 'bg-emerald-50/50',
    PLANILLERO: 'bg-amber-50/50',
    CLEANER: 'bg-slate-50/50',
};

// Button variants
export const BUTTON_VARIANTS = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    ghost: 'hover:bg-slate-100 text-slate-600',
} as const;

// Badge variants
export const BADGE_VARIANTS = {
    AMONESTADO: 'bg-red-100 text-red-700 border border-red-200',
    DESVINCULADO: 'bg-slate-100 text-slate-500 border border-slate-200',
    ACTIVO: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
} as const;
