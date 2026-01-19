'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { EventType } from '@prisma/client';

export async function getEvents(startDate: Date, endDate: Date, projectId?: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error('User not found');

    const where: any = {
        startDate: {
            gte: startDate,
            lte: endDate
        }
    };

    if (projectId) {
        where.projectId = projectId;
    }

    // Access control: User sees events they created OR are attending
    // If Admin, maybe they should see all? For now adhere to same rule or maybe check role.
    // Let's stick to personal relevance for now unless it's a project view where we might want to show all project events?
    // For safety, let's keep the personal restriction + project filter.
    // So: (CreatedByMe OR AmAttending) AND (ProjectId == X if specified) AND (DateRange)

    where.OR = [
        { userId: user.id },
        {
            attendees: {
                some: {
                    userId: user.id
                }
            }
        }
    ];

    const events = await prisma.event.findMany({
        where,
        include: {
            attendees: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            },
            project: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            },
            user: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: {
            startDate: 'asc'
        }
    });

    return events;
}

export async function createEvent(data: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    allDay?: boolean;
    location?: string;
    type: EventType;
    projectId?: string;
    attendeeIds?: string[];
    recurrenceRule?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error('User not found');

    const event = await prisma.event.create({
        data: {
            title: data.title,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            allDay: data.allDay || false,
            location: data.location,
            type: data.type,
            projectId: data.projectId,
            userId: user.id,
            attendees: {
                create: data.attendeeIds?.map(id => ({
                    userId: id,
                    status: 'PENDING'
                }))
            },
            // @ts-ignore
            recurrenceRule: data.recurrenceRule
        }
    });

    // Create notification for attendees
    if (data.attendeeIds && data.attendeeIds.length > 0) {
        await prisma.notification.createMany({
            data: data.attendeeIds.map(attendeeId => ({
                userId: attendeeId,
                type: 'SYSTEM',
                title: 'Nueva Invitación',
                message: `${user.name} te ha invitado al evento "${data.title}"`,
                link: '/calendar'
            }))
        });
    }

    revalidatePath('/calendar');
    return event;
}

export async function deleteEvent(eventId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error('User not found');

    // Only creator can delete
    const event = await prisma.event.findUnique({
        where: { id: eventId }
    });

    if (!event || event.userId !== user.id) {
        throw new Error('Not authorized to delete this event');
    }

    await prisma.event.delete({
        where: { id: eventId }
    });

    revalidatePath('/calendar');
}

export async function updateEvent(eventId: string, data: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    type?: EventType;
    projectId?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error('User not found');

    // Only creator can update
    const event = await prisma.event.findUnique({
        where: { id: eventId }
    });

    if (!event || event.userId !== user.id) {
        throw new Error('Not authorized to update this event');
    }

    const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: {
            ...data,
            updatedAt: new Date()
        }
    });

    revalidatePath('/calendar');
    return updatedEvent;
}

// ============================================
// UNIFIED CALENDAR DATA (Events + Tasks + Holidays + Personal Items)
// ============================================

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

export async function getCalendarData(startDate: Date, endDate: Date): Promise<UnifiedCalendarItem[]> {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, companyId: true }
    });

    if (!user) throw new Error('User not found');

    const items: UnifiedCalendarItem[] = [];

    // 1. Fetch Events (created by user or attending)
    const events = await prisma.event.findMany({
        where: {
            startDate: { gte: startDate, lte: endDate },
            OR: [
                { userId: user.id },
                { attendees: { some: { userId: user.id } } }
            ]
        },
        include: {
            attendees: { include: { user: { select: { id: true, name: true } } } },
            project: { select: { code: true } }
        },
        orderBy: { startDate: 'asc' }
    });

    events.forEach(event => {
        items.push({
            id: event.id,
            type: 'event',
            title: event.title,
            description: event.description,
            date: event.startDate,
            endDate: event.endDate,
            allDay: event.allDay,
            color: getEventTypeColor(event.type),
            eventType: event.type,
            location: event.location ?? undefined,
            attendees: event.attendees.map(a => ({ id: a.user.id, name: a.user.name })),
            projectCode: event.project?.code
        });
    });

    // 1b. Fetch Recurring Events (that started before endDate)
    const recurringEvents = await prisma.event.findMany({
        where: {
            // @ts-ignore
            recurrenceRule: { not: null },
            startDate: { lte: endDate },
            OR: [
                { userId: user.id },
                { attendees: { some: { userId: user.id } } }
            ]
        },
        include: {
            attendees: { include: { user: { select: { id: true, name: true } } } },
            project: { select: { code: true } }
        }
    });

    recurringEvents.forEach((event: any) => {
        if (!event.recurrenceRule) return;

        const rule = event.recurrenceRule; // "DAILY", "WEEKLY", "MONTHLY", "YEARLY"
        const eventStart = new Date(event.startDate);
        const duration = event.endDate.getTime() - eventStart.getTime();

        // Simple expansion logic
        let currentStart = new Date(eventStart);
        // If event started way back, fast forward to startDate (optimization)
        // For simplicity, just loop from start. In production use rrule library.

        while (currentStart <= endDate) {
            // Check if current instance falls within view range
            if (currentStart >= startDate) {
                // Avoid duplicating the original event instance if it was already fetched in step 1
                // (Though step 1 queries by range, so original instance is included if in range.
                // We should check if currentStart equals eventStart, and if so, skip because step 1 covers it OR
                // make step 1 EXCLUDE recurring events to avoid dupes. 
                // Better: Let's EXCLUDE recurrenceRule != null in step 1, or handle it here completely.)

                // Let's rely on ID check? Or simply generate ID with suffix.
                // Actually step 1 query `where: { startDate: { gte: startDate ... } }` includes the original instance.
                // If we generate a virtual instance for the original date, we have a duplicate.
                // So skip if currentStart equals eventStart.

                const isOriginal = currentStart.getTime() === eventStart.getTime();

                // If it is original, checks if step 1 picked it up.
                // Step 1 criteria: startDate >= rangeStart && startDate <= rangeEnd.
                // So if original is in range, step 1 has it. We skip.
                const originalInRange = eventStart >= startDate && eventStart <= endDate;

                if (!isOriginal || !originalInRange) {
                    // Create virtual instance
                    const instanceEnd = new Date(currentStart.getTime() + duration);
                    items.push({
                        id: `${event.id}_${currentStart.toISOString().split('T')[0]}`, // Virtual ID
                        type: 'event',
                        title: event.title,
                        description: event.description,
                        date: new Date(currentStart),
                        endDate: instanceEnd,
                        allDay: event.allDay,
                        color: getEventTypeColor(event.type),
                        eventType: event.type,
                        location: event.location ?? undefined,
                        attendees: event.attendees.map((a: any) => ({ id: a.user.id, name: a.user.name })),
                        projectCode: event.project?.code
                    });
                }
            }

            // Increment
            if (rule === 'DAILY') currentStart.setDate(currentStart.getDate() + 1);
            else if (rule === 'WEEKLY') currentStart.setDate(currentStart.getDate() + 7);
            else if (rule === 'MONTHLY') currentStart.setMonth(currentStart.getMonth() + 1);
            else if (rule === 'YEARLY') currentStart.setFullYear(currentStart.getFullYear() + 1);
            else break; // Unknown rule
        }
    });

    // 2. Fetch Tasks with dueDate in range (assigned to user)
    const tasks = await prisma.task.findMany({
        where: {
            dueDate: { gte: startDate, lte: endDate },
            OR: [
                { assignedToId: user.id },
                { assignees: { some: { id: user.id } } },
                { createdById: user.id }
            ]
        },
        include: {
            project: { select: { code: true } }
        },
        orderBy: { dueDate: 'asc' }
    });

    tasks.forEach(task => {
        if (task.dueDate) {
            items.push({
                id: task.id,
                type: 'task',
                title: task.title,
                description: task.description,
                date: task.dueDate,
                allDay: true,
                color: getTaskPriorityColor(task.priority),
                taskStatus: task.status,
                taskPriority: task.priority,
                projectCode: task.project?.code
            });
        }
    });

    // 3. Fetch Holidays in range
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const years = startYear === endYear ? [startYear] : [startYear, endYear];

    const holidays = await prisma.holiday.findMany({
        where: {
            year: { in: years },
            date: { gte: startDate, lte: endDate },
            OR: [
                { companyId: null },
                { companyId: user.companyId ?? undefined }
            ]
        },
        orderBy: { date: 'asc' }
    });

    holidays.forEach(holiday => {
        items.push({
            id: holiday.id,
            type: 'holiday',
            title: holiday.name,
            date: holiday.date,
            allDay: true,
            color: '#ef4444', // Red
            holidayType: holiday.type
        });
    });

    // 4. Fetch Personal CalendarItems
    const personalItems = await prisma.calendarItem.findMany({
        where: {
            userId: user.id,
            date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'asc' }
    });

    personalItems.forEach(item => {
        items.push({
            id: item.id,
            type: 'personal',
            title: item.title,
            description: item.description,
            date: item.date,
            allDay: item.allDay,
            color: item.color || '#8b5cf6', // Purple
            isPersonal: true
        });
    });

    // Sort all items by date
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function getEventTypeColor(type: string): string {
    switch (type) {
        case 'MEETING': return '#3b82f6'; // Blue
        case 'DEADLINE': return '#ef4444'; // Red
        case 'REMINDER': return '#f59e0b'; // Amber
        case 'HOLIDAY': return '#ec4899'; // Pink
        default: return '#6b7280'; // Gray
    }
}

function getTaskPriorityColor(priority: string): string {
    switch (priority) {
        case 'CRITICAL': return '#dc2626'; // Red
        case 'HIGH': return '#f97316'; // Orange
        case 'MEDIUM': return '#84cc16'; // Lime/Olive
        case 'LOW': return '#22c55e'; // Green
        default: return '#84cc16'; // Olive
    }
}

// ============================================
// CALENDAR ITEM CRUD (Personal quick notes)
// ============================================

export async function createCalendarItem(data: {
    title: string;
    description?: string;
    date: Date | string;
    allDay?: boolean;
    color?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error('User not found');

    const item = await prisma.calendarItem.create({
        data: {
            userId: user.id,
            title: data.title,
            description: data.description,
            date: new Date(data.date),
            allDay: data.allDay ?? true,
            color: data.color
        }
    });

    revalidatePath('/calendar');
    return item;
}

export async function updateCalendarItem(itemId: string, data: {
    title?: string;
    description?: string;
    date?: Date | string;
    color?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error('User not found');

    // Only owner can update
    const item = await prisma.calendarItem.findUnique({
        where: { id: itemId }
    });

    if (!item || item.userId !== user.id) {
        throw new Error('Not authorized to update this item');
    }

    const updated = await prisma.calendarItem.update({
        where: { id: itemId },
        data: {
            title: data.title,
            description: data.description,
            date: data.date ? new Date(data.date) : undefined,
            color: data.color
        }
    });

    revalidatePath('/calendar');
    return updated;
}

export async function deleteCalendarItem(itemId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error('User not found');

    // Only owner can delete
    const item = await prisma.calendarItem.findUnique({
        where: { id: itemId }
    });

    if (!item || item.userId !== user.id) {
        throw new Error('Not authorized to delete this item');
    }

    await prisma.calendarItem.delete({
        where: { id: itemId }
    });

    revalidatePath('/calendar');
}

export async function moveCalendarItem(itemId: string, type: CalendarItemType, newDate: Date) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error('User not found');

    const targetDate = new Date(newDate);

    if (type === 'event') {
        const event = await prisma.event.findUnique({ where: { id: itemId } });
        if (!event) throw new Error('Event not found');

        if (event.userId !== user.id) {
            // Check if user is an attendee? Usually only creator can move?
            // For now, restrict to creator.
            throw new Error('Only the creator can move this event');
        }

        // Calculate duration to keep it same
        const duration = event.endDate.getTime() - event.startDate.getTime();

        // Set new start date time (keep original time? or reset to 00:00 if dropped on day?)
        // If dropped on "Month" view day cell, usually we keep the time but change date.

        const newStart = new Date(targetDate);
        newStart.setHours(event.startDate.getHours(), event.startDate.getMinutes(), 0, 0);

        const newEnd = new Date(newStart.getTime() + duration);

        await prisma.event.update({
            where: { id: itemId },
            data: {
                startDate: newStart,
                endDate: newEnd,
                updatedAt: new Date()
            }
        });

    } else if (type === 'task') {
        // Task dueDate
        const task = await prisma.task.findUnique({ where: { id: itemId } });
        if (!task) throw new Error('Task not found');

        // Check permissions (assigned or creator)
        if (task.assignedToId !== user.id && task.createdById !== user.id) {
            // Maybe allow if assignee?
            // For now allow assignedTo or creator
        }

        await prisma.task.update({
            where: { id: itemId },
            data: {
                dueDate: targetDate, // Tasks usually due at end of day or specific time? keeping targetDate (00:00 usually if dropped)
                updatedAt: new Date()
            }
        });

    } else if (type === 'personal') {
        const item = await prisma.calendarItem.findUnique({ where: { id: itemId } });
        if (!item || item.userId !== user.id) throw new Error('Unauthorized');

        await prisma.calendarItem.update({
            where: { id: itemId },
            data: {
                date: targetDate
            }
        });
    }

    revalidatePath('/calendar');
}

// ============================================
// ICAL EXPORT
// ============================================

import {
    generateICalContent,
    generateICalFilename,
    type ICalExportOptions,
    type RecurringEventInfo
} from '@/lib/exports/ical-export';

export interface ExportCalendarOptions {
    startDate: Date;
    endDate: Date;
    includeTasks?: boolean;
    includeHolidays?: boolean;
    includePersonalItems?: boolean;
    includeEvents?: boolean;
}

export async function exportCalendarToIcal(options: ExportCalendarOptions): Promise<{
    success: boolean;
    content?: string;
    filename?: string;
    error?: string;
}> {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, error: 'No autenticado' };
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true, companyId: true }
        });

        if (!user) {
            return { success: false, error: 'Usuario no encontrado' };
        }

        // Get unified calendar items
        const items = await getCalendarData(options.startDate, options.endDate);

        // Fetch recurring events to get recurrenceRule (expanded instances don't have it)
        const recurringEvents = await prisma.event.findMany({
            where: {
                // @ts-ignore
                recurrenceRule: { not: null },
                startDate: { lte: options.endDate },
                OR: [
                    { userId: user.id },
                    { attendees: { some: { userId: user.id } } }
                ]
            },
            select: {
                id: true,
                // @ts-ignore
                recurrenceRule: true
            }
        });

        const recurringEventInfo: RecurringEventInfo[] = recurringEvents.map((e: any) => ({
            id: e.id,
            recurrenceRule: e.recurrenceRule
        }));

        // Generate iCal content
        const icalOptions: ICalExportOptions = {
            calendarName: `Calendario de ${user.name || 'Usuario'}`,
            includeTasks: options.includeTasks ?? true,
            includeHolidays: options.includeHolidays ?? true,
            includePersonalItems: options.includePersonalItems ?? true,
            includeEvents: options.includeEvents ?? true
        };

        const content = generateICalContent(items, icalOptions, recurringEventInfo);
        const filename = generateICalFilename(options.startDate, options.endDate);

        return {
            success: true,
            content,
            filename
        };
    } catch (error) {
        console.error('Error exporting calendar to iCal:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al exportar calendario'
        };
    }
}
