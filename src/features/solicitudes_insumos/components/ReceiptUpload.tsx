import { useState, useCallback } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { uploadReceipt } from '../api/suppliesApi';

interface Props {
    requestId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export const ReceiptUpload = ({ requestId, onSuccess, onCancel }: Props) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateFile = (file: File): boolean => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setError('Solo se permiten archivos PDF, JPG o PNG');
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('El archivo no puede superar 5MB');
            return false;
        }
        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && validateFile(selectedFile)) {
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && validateFile(droppedFile)) {
            setFile(droppedFile);
            setError(null);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            await uploadReceipt(requestId, file);
            onSuccess();
        } catch (err) {
            console.error('Error uploading receipt:', err);
            setError('Error al subir el archivo. Intente nuevamente.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Dropzone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${dragOver
                        ? 'border-brand-500 bg-brand-50'
                        : file
                            ? 'border-success-500 bg-success-50'
                            : 'border-slate-300 bg-slate-50 hover:border-brand-400'
                    }`}
            >
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                />

                {file ? (
                    <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100 text-success-600">
                            <Icon name="check" size={24} />
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-800">{file.name}</p>
                        <p className="text-xs text-slate-500">
                            {(file.size / 1024).toFixed(1)} KB
                        </p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                            }}
                            className="mt-2 text-xs text-danger-600 hover:underline"
                        >
                            Remover archivo
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <Icon name="upload" size={24} />
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-700">
                            Arrastre un archivo o haga clic para seleccionar
                        </p>
                        <p className="mt-1 text-xs text-slate-500">PDF, JPG o PNG (max 5MB)</p>
                    </>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 px-4 py-2 text-sm text-danger-700">
                    <Icon name="alert-circle" size={16} />
                    {error}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={onCancel}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                    {uploading && (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Subir Boleta
                </button>
            </div>
        </div>
    );
};
