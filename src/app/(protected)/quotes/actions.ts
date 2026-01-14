'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { QuoteStatus } from '@prisma/client';
import { checkPermission, auditCrud } from '@/lib/permissions';
import { calculateDocumentTotals } from '@/lib/money';
import { Decimal } from '@prisma/client/runtime/library';

// ==========================================
// QUOTE CRUD
// ==========================================

export async function getQuotes() {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Check permission
    await checkPermission('leads', 'read'); // Using leads permission for quotes

    // Admin/Manager see all, Worker/Client see own company
    const where = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'
        ? { companyId: (session.user as any).companyId }
        : { createdById: session.user.id, companyId: (session.user as any).companyId };

    return prisma.quote.findMany({
        where,
        include: {
            client: { select: { id: true, name: true } },
            lead: { select: { id: true, title: true } },
            items: true,
            _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getQuote(id: string) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
            client: true,
            lead: { select: { id: true, title: true, value: true } },
            createdBy: { select: { id: true, name: true } },
            items: { orderBy: { order: 'asc' } },
            company: { select: { id: true, name: true } },
        },
    });

    if (!quote) throw new Error('Quote not found');

    // Permission check (ownership for non-admin)
    if (session.user.role === 'WORKER' && quote.createdById !== session.user.id) {
        throw new Error('Unauthorized');
    }

    return quote;
}

export async function createQuote(data: {
    clientId: string;
    leadId?: string;
    validUntil: Date;
    notes?: string;
    terms?: string;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
    }>;
}) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Check permission
    await checkPermission('leads', 'create');

    const companyId = (session.user as any).companyId;
    if (!companyId) throw new Error('User has no company assigned');

    // Calculate items and totals using Decimal helpers
    const totals = calculateDocumentTotals(data.items);
    const itemsWithCalc = data.items.map((item, index) => {
        const quantity = new Decimal(item.quantity);
        const unitPrice = new Decimal(item.unitPrice);
        const taxRate = new Decimal(item.taxRate);

        const subtotal = quantity.mul(unitPrice);
        const taxAmount = subtotal.mul(taxRate).div(100);
        const total = subtotal.add(taxAmount);

        return {
            description: item.description,
            quantity: quantity.toNumber(),
            unitPrice: unitPrice.toNumber(),
            taxRate: taxRate.toNumber(),
            subtotal: subtotal.toNumber(),
            taxAmount: taxAmount.toNumber(),
            total: total.toNumber(),
            order: index,
        };
    });

    // Generate quote number
    const year = new Date().getFullYear();
    const lastQuote = await prisma.quote.findFirst({
        where: { number: { startsWith: `QUO-${year}-` }, companyId },
        orderBy: { number: 'desc' },
    });

    let nextNumber = 1;
    if (lastQuote) {
        const lastNumber = parseInt(lastQuote.number.split('-')[2]);
        nextNumber = lastNumber + 1;
    }
    const quoteNumber = `QUO-${year}-${String(nextNumber).padStart(3, '0')}`;

    // Create quote
    const quote = await prisma.quote.create({
        data: {
            number: quoteNumber,
            status: 'DRAFT',
            validUntil: data.validUntil,
            clientId: data.clientId,
            leadId: data.leadId,
            companyId,
            subtotal: totals.subtotal.toNumber(),
            taxAmount: totals.taxAmount.toNumber(),
            total: totals.total.toNumber(),
            notes: data.notes,
            terms: data.terms,
            createdById: session.user.id,
            items: {
                create: itemsWithCalc,
            },
        },
        include: {
            items: true,
        },
    });

    // Audit log
    await auditCrud('CREATE', 'Quote', quote.id, {
        number: quoteNumber,
        client: data.clientId,
        total: totals.total.toNumber(),
    });

    revalidatePath('/quotes');
    return quote;
}

export async function updateQuoteStatus(id: string, status: QuoteStatus) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Check permission
    await checkPermission('leads', 'update');

    // Get current quote
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new Error('Quote not found');

    // Validate state transition
    const validTransitions: Record<QuoteStatus, QuoteStatus[]> = {
        DRAFT: ['SENT'],
        SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
        ACCEPTED: ['CONVERTED'],
        REJECTED: [],
        EXPIRED: [],
        CONVERTED: [],
    };

    if (!validTransitions[quote.status].includes(status)) {
        throw new Error(`Cannot transition from ${quote.status} to ${status}`);
    }

    // Update status and timestamps
    const updateData: any = { status };

    if (status === 'SENT' && !quote.sentAt) {
        updateData.sentAt = new Date();
    }
    if (status === 'ACCEPTED' && !quote.acceptedAt) {
        updateData.acceptedAt = new Date();
    }
    if (status === 'REJECTED' && !quote.rejectedAt) {
        updateData.rejectedAt = new Date();
    }
    if (status === 'CONVERTED' && !quote.convertedAt) {
        updateData.convertedAt = new Date();
    }

    await prisma.quote.update({
        where: { id },
        data: updateData,
    });

    // Audit log
    await auditCrud('UPDATE', 'Quote', id, {
        status,
        previousStatus: quote.status,
    });

    revalidatePath('/quotes');
}

export async function deleteQuote(id: string) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) return;

    // Check permission (ownership)
    await checkPermission('leads', 'delete', { ownerId: quote.createdById });

    // Can only delete DRAFT quotes
    if (quote.status !== 'DRAFT') {
        throw new Error('Can only delete draft quotes');
    }

    await prisma.quote.delete({ where: { id } });

    // Audit log
    await auditCrud('DELETE', 'Quote', id, {
        number: quote.number,
        total: quote.total,
    });

    revalidatePath('/quotes');
}

// ==========================================
// CONVERSIONS
// ==========================================

export async function convertQuoteToInvoice(quoteId: string, dueDate: Date) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Check permissions
    await checkPermission('invoices', 'create');

    // Get quote with items
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { items: true },
    });

    if (!quote) throw new Error('Quote not found');

    // Validate quote status
    if (quote.status !== 'ACCEPTED') {
        throw new Error('Only ACCEPTED quotes can be converted to invoices');
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
        where: { number: { startsWith: `INV-${year}-` }, companyId: quote.companyId },
        orderBy: { number: 'desc' },
    });

    let nextNumber = 1;
    if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.number.split('-')[2]);
        nextNumber = lastNumber + 1;
    }
    const invoiceNumber = `INV-${year}-${String(nextNumber).padStart(3, '0')}`;

    // Create invoice from quote
    const invoice = await prisma.invoice.create({
        data: {
            number: invoiceNumber,
            date: new Date(),
            dueDate,
            status: 'DRAFT',
            clientId: quote.clientId,
            companyId: quote.companyId,
            subtotal: quote.subtotal,
            taxAmount: quote.taxAmount,
            total: quote.total,
            balance: quote.total,
            paidAmount: new Decimal(0),
            notes: quote.notes,
            terms: quote.terms,
            createdById: session.user.id,
            items: {
                create: quote.items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxRate: item.taxRate,
                    subtotal: item.subtotal,
                    taxAmount: item.taxAmount,
                    total: item.total,
                    order: item.order,
                })),
            },
        },
        include: { items: true },
    });

    // Update quote status to CONVERTED
    await prisma.quote.update({
        where: { id: quoteId },
        data: {
            status: 'CONVERTED',
            convertedAt: new Date(),
        },
    });

    // Audit logs
    await auditCrud('UPDATE', 'Quote', quoteId, {
        status: 'CONVERTED',
        convertedToInvoice: invoice.id,
    });

    await auditCrud('CREATE', 'Invoice', invoice.id, {
        number: invoiceNumber,
        convertedFromQuote: quote.number,
        total: invoice.total,
    });

    revalidatePath('/quotes');
    revalidatePath('/invoices');

    return invoice;
}

export async function getQuoteStats() {
    const session = await auth();
    if (!session) return { total: 0, draft: 0, sent: 0, accepted: 0, converted: 0 };

    const companyId = (session.user as any).companyId;

    const [totalResult, draftCount, sentCount, acceptedCount, convertedCount] = await Promise.all([
        prisma.quote.aggregate({
            where: { companyId },
            _sum: { total: true },
            _count: true,
        }),
        prisma.quote.count({ where: { companyId, status: 'DRAFT' } }),
        prisma.quote.count({ where: { companyId, status: 'SENT' } }),
        prisma.quote.count({ where: { companyId, status: 'ACCEPTED' } }),
        prisma.quote.count({ where: { companyId, status: 'CONVERTED' } }),
    ]);

    return {
        totalAmount: totalResult._sum.total || 0,
        totalCount: totalResult._count,
        draftCount,
        sentCount,
        acceptedCount,
        convertedCount,
    };
}
