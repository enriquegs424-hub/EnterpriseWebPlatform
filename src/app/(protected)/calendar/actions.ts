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
            }
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
