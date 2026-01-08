'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { LeadStage, ClientStatus } from '@prisma/client';

// ==========================================
// CLIENT ACTIONS
// ==========================================

export async function getClients() {
    return prisma.client.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            contacts: true,
            _count: {
                select: {
                    projects: true,
                    leads: true
                }
            }
        }
    });
}

export async function createClient(data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    industry?: string;
    website?: string;
    notes?: string;
    contactName?: string;
    contactEmail?: string;
    accessCode?: string;
}) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Create Client and optional Primary Contact
    return prisma.client.create({
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            industry: data.industry,
            website: data.website,
            notes: data.notes,
            contacts: data.contactName ? {
                create: {
                    name: data.contactName,
                    email: data.contactEmail,
                    isPrimary: true,
                    accessCode: data.accessCode // Save Access Code
                }
            } : undefined
        }
    });
}

export async function updateClient(id: string, data: any) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    await prisma.client.update({
        where: { id },
        data
    });

    revalidatePath('/crm');
    revalidatePath('/crm/clients');
}

export async function deleteClient(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') throw new Error('Unauthorized');

    await prisma.client.delete({ where: { id } });
    revalidatePath('/crm/clients');
}

// ==========================================
// LEAD ACTIONS
// ==========================================

export async function getLeads() {
    return prisma.lead.findMany({
        include: {
            client: true,
            assignedTo: {
                select: { id: true, name: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createLead(data: {
    title: string;
    value: number;
    description?: string;
    clientId: string;
    stage?: LeadStage;
    assignedToId?: string;
    expectedCloseDate?: Date;
}) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    return prisma.lead.create({
        data: {
            title: data.title,
            value: data.value,
            description: data.description,
            clientId: data.clientId,
            stage: data.stage || 'NEW',
            assignedToId: data.assignedToId || session.user.id,
            expectedCloseDate: data.expectedCloseDate
        }
    });
}

export async function updateLeadStage(id: string, stage: LeadStage) {
    await prisma.lead.update({
        where: { id },
        data: { stage }
    });
    revalidatePath('/crm/pipeline');
}


export async function getCRMDashboardStats() {
    const [leadsCount, totalValue, clientsCount] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.aggregate({
            _sum: { value: true }
        }),
        prisma.client.count({ where: { status: 'ACTIVE' } })
    ]);

    // Value by stage
    const leadsByStage = await prisma.lead.groupBy({
        by: ['stage'],
        _count: true,
        _sum: { value: true }
    });

    return {
        totalLeads: leadsCount,
        pipelineValue: totalValue._sum.value || 0,
        activeClients: clientsCount,
        leadsByStage
    };
}
