import { useState, useMemo } from 'react';
import { Icon } from '../../../shared/components/common/Icon';
import { useSupervisors } from '../hooks';
import { InviteeInput, MeetingInvitee } from '../types';

interface InviteesSelectorProps {
    value: InviteeInput[];
    onChange: (invitees: InviteeInput[]) => void;
    existingInvitees?: MeetingInvitee[];
}

export const InviteesSelector = ({ value, onChange, existingInvitees = [] }: InviteesSelectorProps) => {
    const supervisorsQuery = useSupervisors();
    const [search, setSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [manualEmail, setManualEmail] = useState('');
    const [manualName, setManualName] = useState('');

    const existingIds = new Set([
        ...existingInvitees.map(i => i.staff_id).filter(Boolean),
        ...value.map(i => i.staff_id).filter(Boolean),
    ]);

    const filteredSupervisors = useMemo(() => {
        if (!supervisorsQuery.data) return [];
        const term = search.toLowerCase();
        return supervisorsQuery.data
            .filter(s => !existingIds.has(s.id))
            .filter(s => s.nombre.toLowerCase().includes(term) || (s.email || '').toLowerCase().includes(term))
            .slice(0, 8);
    }, [supervisorsQuery.data, search, existingIds]);

    const handleSelectSupervisor = (supervisor: { id: string; nombre: string; email: string | null }) => {
        onChange([...value, {
            staff_id: supervisor.id,
            invitee_name: supervisor.nombre,
            invitee_email: supervisor.email || undefined,
        }]);
        setSearch('');
        setShowDropdown(false);
    };

    const handleAddManual = () => {
        if (!manualName.trim()) return;
        onChange([...value, {
            invitee_name: manualName.trim(),
            invitee_email: manualEmail.trim() || undefined,
        }]);
        setManualName('');
        setManualEmail('');
    };

    const handleRemove = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            {/* Existing Invitees (readonly) */}
            {existingInvitees.length > 0 && (
                <div className="space-y-2">
                    <span className="text-xs text-slate-500 font-medium">Ya invitados:</span>
                    <div className="flex flex-wrap gap-2">
                        {existingInvitees.map(inv => (
                            <div key={inv.id} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-sm">
                                <Icon name="user" size={14} className="text-slate-400" />
                                <span>{inv.invitee_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Selected new invitees */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((inv, i) => (
                        <div key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-sm">
                            <Icon name="user" size={14} />
                            <span>{inv.invitee_name}</span>
                            <button type="button" onClick={() => handleRemove(i)} className="ml-1 hover:text-brand-600">
                                <Icon name="x" size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Search supervisors */}
            <div className="relative">
                <input
                    type="text"
                    className="input"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Buscar supervisor por nombre o correo..."
                />
                {showDropdown && filteredSupervisors.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredSupervisors.map(sup => (
                            <button
                                key={sup.id}
                                type="button"
                                onClick={() => handleSelectSupervisor(sup)}
                                className="w-full px-4 py-2 text-left hover:bg-slate-50 border-b last:border-b-0 border-slate-100"
                            >
                                <div className="font-medium text-slate-800">{sup.nombre}</div>
                                {sup.email && <div className="text-sm text-slate-500">{sup.email}</div>}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Manual entry */}
            <div className="border-t pt-3">
                <span className="text-xs text-slate-500 font-medium">Agregar invitado externo:</span>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <input
                        type="text"
                        className="input flex-1"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="Nombre"
                    />
                    <input
                        type="email"
                        className="input flex-1"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="Correo (opcional)"
                    />
                    <button type="button" onClick={handleAddManual} className="btn btn-secondary shrink-0" disabled={!manualName.trim()}>
                        <Icon name="plus" size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
