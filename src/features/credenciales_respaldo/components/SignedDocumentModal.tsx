import { useState, useRef } from 'react';
import { X, Upload, FileText, Send, AlertCircle, Paperclip } from 'lucide-react';
import { BackupLoan } from '../types';
import { formatRut } from '../utils/rut';

interface Props {
    isOpen: boolean;
    loan: BackupLoan | null;
    managerEmail: string;
    bossEmail: string;
    cc?: string;
    onClose: () => void;
    onSubmit: (attachment: { filename: string; content: string } | null) => Promise<void>;
    isLoading?: boolean;
}

export const SignedDocumentModal = ({
    isOpen,
    loan,
    managerEmail,
    bossEmail,
    cc,
    onClose,
    onSubmit,
    isLoading,
}: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type (PDF, PNG, JPG)
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
        if (!validTypes.includes(file.type)) {
            setError('Solo se permiten archivos PDF, PNG o JPG');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('El archivo no puede superar 5MB');
            return;
        }

        setError('');
        setSelectedFile(file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            setError('Debe adjuntar el documento firmado');
            return;
        }

        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = (e.target?.result as string).split(',')[1]; // Remove data:xxx;base64, prefix
            await onSubmit({
                filename: `autorizacion_descuento_${loan?.person_rut || 'firmado'}.${selectedFile.name.split('.').pop()}`,
                content: base64,
            });
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleSkip = async () => {
        await onSubmit(null);
    };

    const resetState = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setError('');
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    if (!isOpen || !loan) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900">Adjuntar Documento Firmado</h2>
                        <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                <strong>Trabajador:</strong> {loan.person_name} ({formatRut(loan.person_rut)})
                            </p>
                            <p className="text-sm text-blue-800 mt-1">
                                <strong>Se enviaran correos a:</strong>
                            </p>
                            <ul className="text-xs text-blue-700 mt-1 list-disc list-inside">
                                <li>Gestor: {managerEmail}</li>
                                <li>Jefatura: {bossEmail}</li>
                                {cc && <li>CC: {cc}</li>}
                            </ul>
                        </div>

                        {/* Alert */}
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">Importante</p>
                                <p className="text-xs text-amber-700">
                                    Adjunte el documento de autorizacion de descuento firmado por el trabajador.
                                    Este se enviara como adjunto en ambos correos.
                                </p>
                            </div>
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Documento Firmado (PDF, PNG, JPG)
                            </label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="hidden"
                            />

                            {!selectedFile ? (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                                >
                                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm text-slate-600">Haga clic para seleccionar archivo</p>
                                    <p className="text-xs text-slate-400 mt-1">Max 5MB</p>
                                </button>
                            ) : (
                                <div className="border border-slate-200 rounded-lg p-3">
                                    <div className="flex items-center gap-3">
                                        {filePreview ? (
                                            <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                                        ) : (
                                            <div className="w-16 h-16 bg-red-50 rounded flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-red-500" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{selectedFile.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {(selectedFile.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setFilePreview(null);
                                            }}
                                            className="p-1 hover:bg-slate-100 rounded"
                                        >
                                            <X className="w-4 h-4 text-slate-500" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <p className="text-xs text-red-500 mt-2">{error}</p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="text-sm text-slate-500 hover:text-slate-700"
                            disabled={isLoading}
                        >
                            Enviar sin adjunto
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="btn btn-secondary"
                                disabled={isLoading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="btn btn-primary flex items-center gap-2"
                                disabled={isLoading || !selectedFile}
                            >
                                {isLoading ? (
                                    'Enviando...'
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Enviar Correos
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
