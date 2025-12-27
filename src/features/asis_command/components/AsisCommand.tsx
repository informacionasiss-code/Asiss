/**
 * Asis Command Wrapper Component
 * Combines FAB + Drawer with state management
 * Add this component to your App.tsx or main layout
 */

import React, { useState } from 'react';
import { AsisCommandFab } from './AsisCommandFab';
import { AsisCommandDrawer } from './AsisCommandDrawer';

export const AsisCommand = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => {
        setIsOpen((prev) => !prev);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <>
            <AsisCommandFab onClick={handleToggle} isOpen={isOpen} />
            <AsisCommandDrawer isOpen={isOpen} onClose={handleClose} />
        </>
    );
};
