/**
 * iCal Export Module
 *
 * RFC 5545 compliant iCal generation for calendar export
 * Supports events, tasks, holidays, and personal items
 */

// Local type definition to avoid circular imports
export type CalendarItemType = 'event' | 'task' | 'holiday' | 'personal';

export interface UnifiedCalendarItem {
    id: string;
    type: CalendarItemType;
    title: string;
    description?: string | null;
    date: Date;
    endDate?: Date;
    allDay: boolean;
    color: string;
    // Event-specific
    eventType?: string;
    location?: string;
    attendees?: { id: string; name: string }[];
    projectCode?: string;
    // Task-specific
    taskStatus?: string;
    taskPriority?: string;
    // Holiday-specific
    holidayType?: string;
    // Personal-specific
    isPersonal?: boolean;
}

/**
 * Format a Date object for iCal format
 * All-day events: YYYYMMDD
 * Datetime events: YYYYMMDDTHHmmssZ (UTC)
 */
export function formatICalDate(date: Date, allDay: boolean): string {
    const d = new Date(date);

    if (allDay) {
        // All-day format: YYYYMMDD
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    } else {
        // DateTime format: YYYYMMDDTHHmmssZ (UTC)
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const hours = String(d.getUTCHours()).padStart(2, '0');
        const minutes = String(d.getUTCMinutes()).padStart(2, '0');
        const seconds = String(d.getUTCSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    }
}

/**
 * Escape special characters in iCal text fields per RFC 5545
 * Escapes: backslash, semicolon, comma, newlines
 */
export function escapeICalText(text: string): string {
    if (!text) return '';

    return text
        .replace(/\\/g, '\\\\')      // Backslash first
        .replace(/;/g, '\\;')         // Semicolon
        .replace(/,/g, '\\,')         // Comma
        .replace(/\r\n/g, '\\n')      // CRLF to escaped newline
        .replace(/\r/g, '\\n')        // CR to escaped newline
        .replace(/\n/g, '\\n');       // LF to escaped newline
}

/**
 * Fold long lines at 75 octets per RFC 5545
 * Lines longer than 75 bytes are wrapped with CRLF followed by a space
 */
export function foldLine(line: string): string {
    const maxLineLength = 75;

    if (line.length <= maxLineLength) {
        return line;
    }

    const result: string[] = [];
    let currentLine = '';

    for (let i = 0; i < line.length; i++) {
        currentLine += line[i];

        // Check byte length (UTF-8 can have multi-byte chars)
        if (Buffer.byteLength(currentLine, 'utf8') >= maxLineLength) {
            result.push(currentLine);
            currentLine = '';
        }
    }

    if (currentLine) {
        result.push(currentLine);
    }

    // Join with CRLF + space (continuation)
    return result.join('\r\n ');
}

/**
 * Convert app recurrence rule to RRULE format
 * App stores: DAILY, WEEKLY, MONTHLY, YEARLY
 * iCal format: RRULE:FREQ=DAILY, etc.
 */
export function convertToRRule(recurrenceRule: string): string | null {
    const validFreqs = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
    const rule = recurrenceRule.toUpperCase();

    if (validFreqs.includes(rule)) {
        return `RRULE:FREQ=${rule}`;
    }

    return null;
}

/**
 * Generate a unique UID for iCal events
 */
function generateUID(id: string, type: string): string {
    return `${id}-${type}@mepplatform.com`;
}

/**
 * Get current timestamp in iCal format
 */
function getTimestamp(): string {
    return formatICalDate(new Date(), false);
}

/**
 * Generate a VEVENT component for a calendar item
 */
export function generateVEvent(item: UnifiedCalendarItem, recurrenceRule?: string | null): string {
    const lines: string[] = [];

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${generateUID(item.id, item.type)}`);
    lines.push(`DTSTAMP:${getTimestamp()}`);

    // Date handling
    const startDate = new Date(item.date);
    const endDate = item.endDate ? new Date(item.endDate) : startDate;

    if (item.allDay) {
        lines.push(`DTSTART;VALUE=DATE:${formatICalDate(startDate, true)}`);
        // For all-day events, DTEND should be the next day (exclusive)
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        lines.push(`DTEND;VALUE=DATE:${formatICalDate(nextDay, true)}`);
    } else {
        lines.push(`DTSTART:${formatICalDate(startDate, false)}`);
        lines.push(`DTEND:${formatICalDate(endDate, false)}`);
    }

    // Summary (title)
    lines.push(`SUMMARY:${escapeICalText(item.title)}`);

    // Description
    if (item.description) {
        lines.push(`DESCRIPTION:${escapeICalText(item.description)}`);
    }

    // Location (events only)
    if (item.type === 'event' && item.location) {
        lines.push(`LOCATION:${escapeICalText(item.location)}`);
    }

    // Categories based on type
    const categoryMap: Record<string, string> = {
        'event': 'EVENTO',
        'task': 'TAREA',
        'holiday': 'FESTIVO',
        'personal': 'PERSONAL'
    };
    lines.push(`CATEGORIES:${categoryMap[item.type] || 'OTRO'}`);

    // Recurrence rule
    if (recurrenceRule) {
        const rrule = convertToRRule(recurrenceRule);
        if (rrule) {
            lines.push(rrule);
        }
    }

    // Type-specific properties
    if (item.type === 'holiday') {
        // Holidays should be transparent (don't block time)
        lines.push('TRANSP:TRANSPARENT');
    } else {
        lines.push('TRANSP:OPAQUE');
    }

    // Task-specific: add status
    if (item.type === 'task' && item.taskStatus) {
        const statusMap: Record<string, string> = {
            'TODO': 'NEEDS-ACTION',
            'IN_PROGRESS': 'IN-PROCESS',
            'DONE': 'COMPLETED',
            'BACKLOG': 'NEEDS-ACTION',
            'REVIEW': 'IN-PROCESS'
        };
        const icalStatus = statusMap[item.taskStatus] || 'NEEDS-ACTION';
        lines.push(`STATUS:${icalStatus}`);

        // Priority
        if (item.taskPriority) {
            const priorityMap: Record<string, number> = {
                'CRITICAL': 1,
                'HIGH': 3,
                'MEDIUM': 5,
                'LOW': 7
            };
            const priority = priorityMap[item.taskPriority] || 5;
            lines.push(`PRIORITY:${priority}`);
        }
    }

    // Project code as custom property
    if (item.projectCode) {
        lines.push(`X-PROJECT-CODE:${escapeICalText(item.projectCode)}`);
    }

    lines.push('END:VEVENT');

    return lines.map(line => foldLine(line)).join('\r\n');
}

export interface ICalExportOptions {
    calendarName?: string;
    includeTasks?: boolean;
    includeHolidays?: boolean;
    includePersonalItems?: boolean;
    includeEvents?: boolean;
}

export interface RecurringEventInfo {
    id: string;
    recurrenceRule: string;
}

/**
 * Generate complete VCALENDAR content
 */
export function generateICalContent(
    items: UnifiedCalendarItem[],
    options: ICalExportOptions = {},
    recurringEvents: RecurringEventInfo[] = []
): string {
    const {
        calendarName = 'Calendario MEP',
        includeTasks = true,
        includeHolidays = true,
        includePersonalItems = true,
        includeEvents = true
    } = options;

    const lines: string[] = [];

    // VCALENDAR header
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//MEPPlatform//Calendar//ES');
    lines.push('CALSCALE:GREGORIAN');
    lines.push('METHOD:PUBLISH');
    lines.push(`X-WR-CALNAME:${escapeICalText(calendarName)}`);

    // Create a map of recurring event rules
    const recurrenceMap = new Map<string, string>();
    recurringEvents.forEach(re => {
        recurrenceMap.set(re.id, re.recurrenceRule);
    });

    // Track which recurring event originals we've already added
    const addedRecurringIds = new Set<string>();

    // Filter and generate VEVENTs
    items.forEach(item => {
        // Filter by type
        if (item.type === 'event' && !includeEvents) return;
        if (item.type === 'task' && !includeTasks) return;
        if (item.type === 'holiday' && !includeHolidays) return;
        if (item.type === 'personal' && !includePersonalItems) return;

        // For events, check if this is a recurring instance (virtual ID format: originalId_date)
        const isVirtualInstance = item.id.includes('_');
        let originalId = item.id;

        if (isVirtualInstance) {
            // Extract original ID
            originalId = item.id.split('_')[0];
        }

        // Check if this event has a recurrence rule
        const recurrenceRule = recurrenceMap.get(originalId);

        if (recurrenceRule) {
            // This is a recurring event - only add the original with RRULE, not instances
            if (!addedRecurringIds.has(originalId)) {
                // Find the original item (non-virtual) or use current with original ID
                const originalItem = { ...item, id: originalId };
                lines.push(generateVEvent(originalItem, recurrenceRule));
                addedRecurringIds.add(originalId);
            }
            // Skip virtual instances
            return;
        }

        // Non-recurring item - add normally
        lines.push(generateVEvent(item, null));
    });

    lines.push('END:VCALENDAR');

    // Join with CRLF per RFC 5545
    return lines.join('\r\n');
}

/**
 * Trigger file download in the browser
 */
export function downloadICalFile(content: string, filename: string): void {
    // Ensure CRLF line endings
    const normalizedContent = content.replace(/\r?\n/g, '\r\n');

    const blob = new Blob([normalizedContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Generate filename for iCal export
 */
export function generateICalFilename(startDate: Date, endDate: Date): string {
    const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return `calendario_${formatDate(startDate)}_${formatDate(endDate)}.ics`;
}
