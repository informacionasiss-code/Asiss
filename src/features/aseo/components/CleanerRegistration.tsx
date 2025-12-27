import { useState, useEffect } from 'react';
import { useRegisterCleaner, useFetchCleanerByName } from '../hooks';
import { Icon } from '../../../shared/components/common/Icon';

interface Props {
    onCleanerSet: (cleanerId: string, cleanerName: string) => void;
}

export const CleanerRegistration = ({ onCleanerSet }: Props) => {
    const [name, setName] = useState('');
    const [savedName, setSavedName] = useState<string | null>(null);

    const registerMutation = useRegisterCleaner();
    const { data: existingCleaner } = useFetchCleanerByName(savedName);

    // Check if name exists in component state (simulating persistence without localStorage)
    useEffect(() => {
        // In a real app without localStorage, you might use a cookie or URL param
        // For now, we'll just keep in component state
    }, []);

    useEffect(() => {
        if (existingCleaner) {
            onCleanerSet(existingCleaner.id, existingCleaner.name);
        }
    }, [existingCleaner, onCleanerSet]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSavedName(name.trim());

        try {
            const cleaner = await registerMutation.mutateAsync(name.trim());
            onCleanerSet(cleaner.id, cleaner.name);
        } catch (error: any) {
            // If cleaner already exists, fetch it
            if (error.code === '23505') {
                setSavedName(name.trim());
            } else {
                console.error(error);
                alert('Error al registrar. Intenta nuevamente.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="user" size={40} className="text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Portal Aseo</h1>
                    <p className="text-slate-600">Ingresa tu nombre para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Tu Nombre
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
                            placeholder="Ej: Juan Pérez"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim() || registerMutation.isPending}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
                    >
                        {registerMutation.isPending ? 'Registrando...' : 'Continuar'}
                    </button>
                </form>
            </div>
        </div>
    );
};
