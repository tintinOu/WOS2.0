import React from 'react';
import { useIsMobile } from './hooks/useIsMobile';
import { useWorkOrderForm } from './hooks/useWorkOrderForm';
import DesktopLayout from './layouts/DesktopLayout';
import MobileLayout from './layouts/MobileLayout';

function App() {
    // Detect if we're on mobile/tablet (< 1024px)
    const isMobile = useIsMobile(1024);

    // Shared form state and handlers
    const form = useWorkOrderForm();

    // Render the appropriate layout based on screen size
    return isMobile ? (
        <MobileLayout form={form} />
    ) : (
        <DesktopLayout form={form} />
    );
}

export default App;
