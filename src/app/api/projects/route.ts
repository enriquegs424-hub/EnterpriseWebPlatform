import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { auth } from '@/auth';

export async function GET(request: Request) {
    try {
        // Get authenticated user
        const session = await auth();

        // Rate limit check
        const identifier = getClientIdentifier(request, session?.user?.id as string);
        const rateLimit = checkRateLimit(identifier);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: rateLimit.headers,
                }
            );
        }

        const projects = await prisma.project.findMany({
            where: { isActive: true },
            select: {
                id: true,
                code: true,
                name: true,
            },
            orderBy: { code: 'asc' },
        });

        return NextResponse.json(projects, { headers: rateLimit.headers });
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}
