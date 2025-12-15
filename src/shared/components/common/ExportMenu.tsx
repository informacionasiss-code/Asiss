interface Props {
  onExportView: () => void;
  onExportAll?: () => void;
}

export const ExportMenu = ({ onExportView, onExportAll }: Props) => (
  <div className="flex gap-2">
    <button className="btn btn-secondary" onClick={onExportView}>
      Exportar vista
    </button>
    {onExportAll && (
      <button className="btn btn-secondary" onClick={onExportAll}>
        Exportar todo
      </button>
    )}
  </div>
);
