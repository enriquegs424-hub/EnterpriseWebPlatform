'use client';

import { useState, useEffect, useRef } from 'react';
import { searchUsers } from '@/app/(protected)/chat/actions';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
}

interface UseMentionAutocompleteProps {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    onSelectMention: (username: string) => void;
}

export function useMentionAutocomplete({ textareaRef, onSelectMention }: UseMentionAutocompleteProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionQuery, setMentionQuery] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);

    // Detect @ mentions in text
    const detectMention = (text: string, cursorPos: number): { query: string; startPos: number } | null => {
        // Find the last @ before cursor
        const textBeforeCursor = text.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex === -1) return null;

        // Extract text after @ until cursor or space
        const textAfterAt = text.substring(lastAtIndex + 1, cursorPos);

        // Check if there's a space (which would end the mention)
        if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
            return null;
        }

        return {
            query: textAfterAt,
            startPos: lastAtIndex
        };
    };

    // Search users based on mention query
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const handleInput = async () => {
            const text = textarea.value;
            const cursorPos = textarea.selectionStart || 0;

            const mention = detectMention(text, cursorPos);

            if (mention && mention.query.length >= 0) {
                setMentionQuery(mention.query);
                setCursorPosition(mention.startPos);

                // Search users
                if (mention.query.length >= 1) {
                    try {
                        const users = await searchUsers(mention.query);
                        setSuggestions(users);
                        setShowSuggestions(users.length > 0);
                        setSelectedIndex(0);
                    } catch (error) {
                        console.error('Error searching users for mentions:', error);
                        setSuggestions([]);
                        setShowSuggestions(false);
                    }
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            } else {
                setShowSuggestions(false);
                setSuggestions([]);
            }
        };

        textarea.addEventListener('input', handleInput);
        textarea.addEventListener('click', handleInput);

        return () => {
            textarea.removeEventListener('input', handleInput);
            textarea.removeEventListener('click', handleInput);
        };
    }, [textareaRef]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!showSuggestions || suggestions.length === 0) return false;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % suggestions.length);
                return true;

            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                return true;

            case 'Enter':
            case 'Tab':
                if (showSuggestions) {
                    e.preventDefault();
                    selectSuggestion(selectedIndex);
                    return true;
                }
                break;

            case 'Escape':
                setShowSuggestions(false);
                return true;
        }

        return false;
    };

    // Select a suggestion
    const selectSuggestion = (index: number) => {
        const selected = suggestions[index];
        if (!selected || !textareaRef.current) return;

        const textarea = textareaRef.current;
        const text = textarea.value;

        // Replace @query with @Name
        const beforeMention = text.substring(0, cursorPosition);
        const afterCursor = text.substring(textarea.selectionStart || 0);

        const newText = `${beforeMention}@${selected.name} ${afterCursor}`;

        // Update textarea
        textarea.value = newText;

        // Set cursor after mention
        const newCursorPos = cursorPosition + selected.name.length + 2; // +2 for @ and space
        textarea.setSelectionRange(newCursorPos, newCursorPos);

        // Trigger change event
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        // Close suggestions
        setShowSuggestions(false);
        setSuggestions([]);

        // Callback
        onSelectMention(selected.name);

        // Focus back
        textarea.focus();
    };

    return {
        showSuggestions,
        suggestions,
        selectedIndex,
        handleKeyDown,
        selectSuggestion,
        setShowSuggestions
    };
}
