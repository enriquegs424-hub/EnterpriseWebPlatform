/**
 * Parse and highlight @mentions in message content
 * Returns JSX with highlighted mentions
 */
export function parseMentions(content: string): React.ReactNode {
    // Match @username patterns (letters, numbers, spaces, and some special chars)
    const mentionRegex = /@([\w\s\u00C0-\u017F]+)/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        // Add text before the mention
        if (match.index > lastIndex) {
            parts.push(content.substring(lastIndex, match.index));
        }

        // Add the highlighted mention
        parts.push(
            <span
                key={match.index}
                className="bg-olive-100 text-olive-700 px-1.5 py-0.5 rounded font-bold"
            >
                @{match[1]}
            </span>
        );

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : content;
}

/**
 * Extract mentioned usernames from message content
 */
export function extractMentions(content: string): string[] {
    const mentionRegex = /@([\w\s\u00C0-\u017F]+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[1].trim());
    }

    return mentions;
}
