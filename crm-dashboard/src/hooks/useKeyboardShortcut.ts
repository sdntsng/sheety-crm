import { useEffect, useRef } from 'react';
import { useKeyboardShortcutsContext, Shortcut } from '@/providers/KeyboardShortcutsContext';

interface UseKeyboardShortcutOptions {
    key: string;
    onKeyPressed: (e: KeyboardEvent) => void;
    description: string;
    section?: string;
    disabled?: boolean; // To conditionally disable shortcuts (e.g. if modal is hidden)
}

export function useKeyboardShortcut({
    key,
    onKeyPressed,
    description,
    section = 'General',
    disabled = false
}: UseKeyboardShortcutOptions) {
    const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();

    // Use a ref for the callback to prevent the effect from re-running when the callback is unstable (e.g. inline function)
    // This fixes the "Maximum update depth exceeded" error caused by:
    // render -> new callback -> effect runs -> unregister/register -> state update -> render -> loop
    const callbackRef = useRef(onKeyPressed);

    useEffect(() => {
        callbackRef.current = onKeyPressed;
    }, [onKeyPressed]);

    useEffect(() => {
        if (disabled) return;

        // Register with context for the help menu
        const shortcut: Shortcut = { key, description, section };
        registerShortcut(shortcut);

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if focus is in an input/textarea, UNLESS it's a special global key like Esc
            // But usually we want to ignore inputs for things like 'N' or '/'
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '');

            // Allow Esc to work even in inputs
            if (isInput && key.toLowerCase() !== 'escape') {
                return;
            }

            if (e.key.toLowerCase() === key.toLowerCase()) {
                // Check modifiers if needed in future (e.g. Cmd+S) - simplifed for now as per requirements
                callbackRef.current(e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            unregisterShortcut(key);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [key, description, section, disabled, registerShortcut, unregisterShortcut]); // Removed onKeyPressed dependency
}
