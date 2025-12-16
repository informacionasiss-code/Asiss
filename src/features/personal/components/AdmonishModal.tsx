import { useState, FormEvent, useRef } from 'react';
import { Icon } from '../../../shared/components/common/Icon';

interface Props {
    staffName: string;
    onConfirm: (reason: string, date: string, file: File) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const AdmonishModal = ({ staffName, onConfirm, onCancel, isLoading }: Props) => {
    const [reason, setReason] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (reason.trim() && date && file) {
            onConfirm(reason.trim(), date, file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg card p-6 animate-scale-in">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-100">
                        <Icon name="megaphone" size={24} className="text-warning-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Registrar Amonestación</h3>
                        <p className="text-sm text-slate-600">
                            Amonestación para <strong>{staffName}</strong>
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Reason */}
                    <div>
                        <label className="label">Motivo de la Amonestación *</label>
                        <textarea
                            className="input min-h-[80px]"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Describe el motivo de la amonestación..."
                            required
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="label">Fecha de Amonestación *</label>
                        <input
                            type="date"
                            className="input"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="label">Documento Adjunto *</label>
                        <div
                            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragActive
                                    ? 'border-brand-500 bg-brand-50'
                                    : file
                                        ? 'border-success-300 bg-success-50'
                                        : 'border-slate-300 hover:border-slate-400'
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="hidden"
                                id="admonition-file"
                            />

                            {file ? (
                                <div className="flex items-center justify-center gap-3">
                                    <Icon name="check-circle" size={24} className="text-success-600" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-slate-900">{file.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="ml-4 text-danger-600 hover:text-danger-700"
                                    >
                                        <Icon name="x" size={20} />
                                    </button>
                                </div>
                            ) : (
                                <label
                                    htmlFor="admonition-file"
                                    className="cursor-pointer flex flex-col items-center gap-2"
                                >
                                    <Icon name="image" size={32} className="text-slate-400" />
                                    <p className="text-sm text-slate-600">
                                        <span className="font-semibold text-brand-600">Haz clic para subir</span>
                                        {' '}o arrastra el archivo aquí
                                    </p>
                                    <p className="text-xs text-slate-400">PDF, JPG, PNG (máx. 10MB)</p>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-secondary"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading || !reason.trim() || !date || !file}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Guardando...
                                </span>
                            ) : (
                                'Registrar Amonestación'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
