interface Props {
  label?: string;
}

export const LoadingState = ({ label = 'Cargando...' }: Props) => (
  <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" aria-hidden />
    <span>{label}</span>
  </div>
);
