'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { EventType } from '@prisma/client';

export async function getEvents(startDate: Date, endDate: Date) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error('User not found');

    const events = await prisma.event.findMany({
        where: {
            OR: [
                // Events created by user
                { userId: user.id },
                // Events user is attending
                {
                    attendees: {
                        some: {
                            userId: user.id
                        }
                    }
                }
            ],
            startDate: {
                gte: startDate,
                lte: endDate
            }
        },
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
