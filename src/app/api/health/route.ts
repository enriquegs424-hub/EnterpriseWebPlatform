import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        // Get basic metrics
        const [userCount, projectCount, taskCount] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
            prisma.task.count()
        ]);

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV,
            database: 'connected',
            metrics: {
                users: userCount,
                projects: projectCount,
                tasks: taskCount
            },
            uptime: process.uptime()
        }, { status: 200 });

    } catch (error) {
        console.error('Health check failed:', error);

        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
            database: 'disconnected'
        }, { status: 503 });
    }
}
