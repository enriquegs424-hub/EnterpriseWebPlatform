'use server';

import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { checkPermission } from '@/lib/permissions';

/**
 * Get client by ID with full details
 */
export async function getClientById(id: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('No autenticado');

    await checkPermission('clients', 'read');

    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            contacts: {
                orderBy: { isPrimary: 'desc' }
            },
            _count: {
                select: {
                    projects: true,
                    leads: true,
                    invoices: true,
                    Quote: true
                }
            }
        }
    });

    return client;
}

/**
 * Get projects for a client
 */
export async function getClientProjects(clientId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('No autenticado');

    await checkPermission('projects', 'read');

    const projects = await prisma.project.findMany({
        where: {
            clientId,
            companyId: user.companyId as string
        },
        select: {
            id: true,
            code: true,
            name: true,
            year: true,
            isActive: true,
            _count: {
                select: {
                    tasks: true,
                    documents: true
                }
            }
        },
        orderBy: { year: 'desc' }
    });

    return projects;
}

/**
 * Get quotes for a client
 */
export async function getClientQuotes(clientId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('No autenticado');

    await checkPermission('quotes', 'read');

    const quotes = await prisma.quote.findMany({
        where: {
            clientId,
            companyId: user.companyId as string
        },
        select: {
            id: true,
            number: true,
            status: true,
            total: true,
            createdAt: true,
            validUntil: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return quotes;
}

/**
 * Get invoices for a client
 */
export async function getClientInvoices(clientId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('No autenticado');

    await checkPermission('invoices', 'read');

    const invoices = await prisma.invoice.findMany({
        where: {
            clientId,
            companyId: user.companyId as string
        },
        select: {
            id: true,
            number: true,
            status: true,
            total: true,
            balance: true,
            paidAmount: true,
            dueDate: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return invoices;
}

/**
 * Get documents related to a client (through projects)
 */
export async function getClientDocuments(clientId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('No autenticado');

    await checkPermission('documents', 'read');

    // Get all projects for this client
    const projects = await prisma.project.findMany({
        where: {
            clientId,
            companyId: user.companyId as string
        },
        select: { id: true }
    });

    const projectIds = projects.map(p => p.id);

    // Get documents from those projects
    const documents = await prisma.document.findMany({
        where: {
            projectId: { in: projectIds }
        },
        select: {
            id: true,
            name: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
            project: {
                select: {
                    code: true,
                    name: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 50 // Limit to recent 50
    });

    return documents;
}
