import { useEffect, useRef } from 'react';

/**
 * Custom hook for trapping focus within a modal.
 * Ensures keyboard navigation stays within the modal when open.
 * 
 * @param isOpen - Whether the modal is currently open
 * @returns ref to attach to the modal container
 */
export function useFocusTrap(isOpen: boolean) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Store the element that had focus before opening
        previousActiveElement.current = document.activeElement as HTMLElement;

        const container = containerRef.current;
        if (!container) return;

        // Get all focusable elements
        const focusableElements = container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus the first element
        firstElement?.focus();

        // Handle Tab key to trap focus
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab - focus previous
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab - focus next
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);

        // Cleanup
        return () => {
            container.removeEventListener('keydown', handleKeyDown);

            // Restore focus to previous element when closing
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        };
    }, [isOpen]);

    return containerRef;
}

/**
 * Custom hook for handling Escape key press
 * 
 * @param callback - Function to call when Escape is pressed
 * @param isActive - Whether the listener should be active
 */
export function useEscapeKey(callback: () => void, isActive = true) {
    useEffect(() => {
        if (!isActive) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                callback();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [callback, isActive]);
}

/**
 * Custom hook for keyboard shortcuts
 * 
 * @param shortcuts - Map of key combinations to callbacks
 * @param isActive - Whether shortcuts should be active
 */
export function useKeyboardShortcuts(
    shortcuts: Record<string, () => void>,
    isActive = true
) {
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            const alt = e.altKey;

            // Build key combination string
            let combo = '';
            if (ctrl) combo += 'ctrl+';
            if (shift) combo += 'shift+';
            if (alt) combo += 'alt+';
            combo += key;

            const handler = shortcuts[combo];
            if (handler) {
                e.preventDefault();
                handler();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, isActive]);
}
