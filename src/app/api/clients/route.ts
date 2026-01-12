import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // @ts-ignore
        const userCompanyId = session.user.companyId;

        // Build where clause - if no companyId, return all clients (dev mode fallback)
        const whereClause = userCompanyId
            ? { companyId: userCompanyId }
            : {}; // Return all clients if no company filter

        const clients = await prisma.client.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                companyName: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
    }
}
