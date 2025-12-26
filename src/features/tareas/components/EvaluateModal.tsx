import { useState } from 'react';
import { Icon } from '../../../shared/components/common/Icon';

interface EvaluateModalProps {
    mode: 'accept' | 'reject';
    taskTitle: string;
    onConfirm: (note?: string, reason?: string) => void;
    onCancel: () => void;
    isLoading: boolean;
}

export const EvaluateModal = ({ mode, taskTitle, onConfirm, onCancel, isLoading }: EvaluateModalProps) => {
    const [text, setText] = useState('');

    const isAccept = mode === 'accept';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-scale-in">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-full ${isAccept ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Icon name={isAccept ? 'check-circle' : 'x-circle'} size={24} className={isAccept ? 'text-green-600' : 'text-red-600'} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">
                            {isAccept ? 'Aceptar Tarea' : 'Rechazar Tarea'}
                        </h3>
                        <p className="text-sm text-slate-500">{taskTitle}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="label">{isAccept ? 'Nota de evaluación (opcional)' : 'Motivo de rechazo'}</label>
                    <textarea
                        className="input min-h-[100px] resize-none"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={isAccept ? 'Comentario sobre la tarea completada...' : 'Indique por qué se rechaza la tarea...'}
                        required={!isAccept}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onCancel} className="btn btn-secondary">Cancelar</button>
                    <button
                        onClick={() => onConfirm(isAccept ? text : undefined, !isAccept ? text : undefined)}
                        disabled={(!isAccept && !text.trim()) || isLoading}
                        className={`btn ${isAccept ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                    >
                        {isLoading ? 'Procesando...' : isAccept ? 'Aceptar' : 'Rechazar'}
                    </button>
                </div>
            </div>
        </div>
    );
};
