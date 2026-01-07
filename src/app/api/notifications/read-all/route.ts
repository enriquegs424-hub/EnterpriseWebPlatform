import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await prisma.notification.updateMany({
            where: {
                userId: user.id,
                isRead: false,
            },
            data: { isRead: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking all as read:', error);
        return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
    }
}
