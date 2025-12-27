/**
 * Asis Command FAB (Floating Action Button)
 * Bottom-right floating button that opens the command drawer
 */

import React from 'react';
import { Icon } from '../../../shared/components/common/Icon';

interface AsisCommandFabProps {
    onClick: () => void;
    isOpen: boolean;
}

export const AsisCommandFab = ({ onClick, isOpen }: AsisCommandFabProps) => {
    return (
        <button
            onClick={onClick}
            className={`
                fixed bottom-6 right-6 z-50
                w-14 h-14 rounded-full
                bg-gradient-to-br from-slate-700 to-slate-900
                text-white shadow-lg
                flex items-center justify-center
                transition-all duration-300 ease-out
                hover:scale-110 hover:shadow-xl
                active:scale-95
                focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                ${isOpen ? 'rotate-45 bg-red-600' : ''}
            `}
            title="Asis Command"
            aria-label="Abrir Asis Command"
        >
            <Icon
                name={isOpen ? 'x' : 'settings'}
                className="w-6 h-6"
            />
        </button>
    );
};
