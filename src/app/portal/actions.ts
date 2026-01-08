'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.AUTH_SECRET || 'secret';
const key = new TextEncoder().encode(SECRET_KEY);

export async function loginClient(accessCode: string) {
    // 1. Find contact by access code
    const contact = await prisma.clientContact.findFirst({
        where: { accessCode: accessCode },
        include: { client: true }
    });

    if (!contact) {
        throw new Error('Código de acceso inválido');
    }

    // 2. Create Session
    const payload = {
        id: contact.id,
        clientId: contact.clientId,
        name: contact.name,
        role: 'CLIENT'
    };

    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);

    const cookieStore = await cookies();
    cookieStore.set('client_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
    });

    redirect('/portal/dashboard');
}

export async function getClientSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('client_session')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, key);
        return payload as any;
    } catch (e) {
        return null;
    }
}

export async function logoutClient() {
    const cookieStore = await cookies();
    cookieStore.delete('client_session');
    redirect('/portal/login');
}

export async function getClientDashboardData() {
    const session = await getClientSession();
    if (!session) throw new Error('Unauthorized');

    const client = await prisma.client.findUnique({
        where: { id: session.clientId },
        include: {
            projects: {
                where: { isActive: true },
                include: {
                    _count: { select: { tasks: true, documents: true } }
                }
            }
        }
    });

    return client;
}
