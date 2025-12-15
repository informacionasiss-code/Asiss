interface Props {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message = 'Ocurrió un error', onRetry }: Props) => (
  <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
    <span className="font-semibold">{message}</span>
    {onRetry && (
      <button onClick={onRetry} className="text-xs font-semibold text-red-700 underline">
        Reintentar
      </button>
    )}
  </div>
);
