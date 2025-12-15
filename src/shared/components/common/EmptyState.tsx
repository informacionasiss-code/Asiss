interface Props {
  label?: string;
  description?: string;
}

export const EmptyState = ({ label = 'Sin datos', description }: Props) => (
  <div className="flex flex-col items-start gap-1 rounded-md border border-dashed border-slate-200 bg-slate-50 p-4">
    <p className="text-sm font-semibold text-slate-800">{label}</p>
    {description && <p className="text-sm text-slate-600">{description}</p>}
  </div>
);
