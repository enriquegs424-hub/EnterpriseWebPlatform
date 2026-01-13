'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { checkPermission, auditCrud } from '@/lib/permissions';
import { InvoiceStateMachine } from '@/lib/state-machine';
import { calculateLineTotal, calculateDocumentTotals, addDecimals, subtractDecimals, toNumber } from '@/lib/money';

// ==========================================
// INVOICE CRUD
// ==========================================

export async function getInvoices() {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Check permission
    await checkPermission('invoices', 'read');

    // Admin/Manager see all, Worker/Client see own company
    const where = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'
        ? {}
        : { createdById: session.user.id };

    return prisma.invoice.findMany({
        where,
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    address: true,
                    companyName: true
                }
            },
            project: { select: { id: true, code: true, name: true } },
            items: { orderBy: { order: 'asc' } },
            payments: true,
            _count: { select: { items: true, payments: true } },
        },
        orderBy: { date: 'desc' },
    });
}

export async function getInvoice(id: string) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            client: true,
            project: { select: { id: true, code: true, name: true } },
            createdBy: { select: { id: true, name: true } },
            items: { orderBy: { order: 'asc' } },
            payments: { orderBy: { date: 'desc' } },
        },
    });

    if (!invoice) throw new Error('Invoice not found');

    // Permission check (ownership for non-admin)
    if (session.user.role === 'CLIENT') {
        if (invoice.client.id !== session.user.id) {
            throw new Error('Unauthorized');
        }
    } else if (session.user.role === 'WORKER') {
        if (invoice.createdById !== session.user.id) {
            throw new Error('Unauthorized');
        }
    }

    return invoice;
}

export async function createInvoice(data: {
    clientId: string;
    projectId?: string;
    dueDate: Date;
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
    await checkPermission('invoices', 'create');

    // Calculate items using Decimal for precision
    const items = data.items.map((item, index) => {
        const lineCalc = calculateLineTotal(item.quantity, item.unitPrice, item.taxRate);

        return {
            description: item.description,
            quantity: lineCalc.subtotal.div(item.unitPrice).toNumber(), // Store as number for Prisma
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            subtotal: lineCalc.subtotal.toNumber(),
            taxAmount: lineCalc.taxAmount.toNumber(),
            total: lineCalc.total.toNumber(),
            order: index,
        };
    });

    // Calculate document totals using Decimal
    const totals = calculateDocumentTotals(data.items);
    const subtotal = totals.subtotal.toNumber();
    const taxAmount = totals.taxAmount.toNumber();
    const total = totals.total.toNumber();

    // Generate invoice number
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
        where: { number: { startsWith: `INV-${year}-` } },
        orderBy: { number: 'desc' },
    });

    let nextNumber = 1;
    if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.number.split('-')[2]);
        nextNumber = lastNumber + 1;
    }
    const invoiceNumber = `INV-${year}-${String(nextNumber).padStart(3, '0')}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
        data: {
            number: invoiceNumber,
            date: new Date(),
            dueDate: data.dueDate,
            status: 'DRAFT',
            clientId: data.clientId,
            projectId: data.projectId,
            subtotal,
            taxAmount,
            total,
            balance: total,
            notes: data.notes,
            terms: data.terms,
            createdById: session.user.id,
            items: {
                create: items,
            },
        },
        include: {
            items: true,
        },
    });

    // Audit log
    await auditCrud('CREATE', 'Invoice', invoice.id, {
        number: invoiceNumber,
        client: data.clientId,
        total,
    });

    revalidatePath('/invoices');
    return invoice;
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Check permission
    await checkPermission('invoices', 'update');

    // Get current invoice
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');

    // Validate state transition
    try {
        InvoiceStateMachine.transition(invoice.status, status);
    } catch (e: any) {
        throw new Error(e.message);
    }

    // Update status and timestamps
    const updateData: any = { status };

    if (status === 'SENT' && !invoice.issuedAt) {
        updateData.issuedAt = new Date();
    }

    if (status === 'PAID' && !invoice.paidAt) {
        updateData.paidAt = new Date();
    }

    await prisma.invoice.update({
        where: { id },
        data: updateData,
    });

    // Audit log
    await auditCrud('UPDATE', 'Invoice', id, {
        status,
        previousStatus: invoice.status,
    });

    revalidatePath('/invoices');
}

export async function deleteInvoice(id: string) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return;

    // Check permission (ownership)
    await checkPermission('invoices', 'delete', invoice.createdById);

    // Can only delete DRAFT invoices
    if (invoice.status !== 'DRAFT') {
        throw new Error('Can only delete draft invoices');
    }

    await prisma.invoice.delete({ where: { id } });

    // Audit log
    await auditCrud('DELETE', 'Invoice', id, {
        number: invoice.number,
        total: invoice.total,
    });

    revalidatePath('/invoices');
}

// ==========================================
// PAYMENT CRUD
// ==========================================

export async function addPayment(data: {
    invoiceId: string;
    amount: number;
    date: Date;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
}) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Check permission
    await checkPermission('invoices', 'update');

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
        include: { payments: true },
    });

    if (!invoice) throw new Error('Invoice not found');

    // Validate payment amount using Decimal
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const newBalanceDecimal = subtractDecimals(invoice.total, addDecimals(totalPaid, data.amount));

    if (newBalanceDecimal.lessThan(-0.01)) {
        throw new Error('Payment amount exceeds invoice balance');
    }

    // Create payment
    const payment = await prisma.payment.create({
        data: {
            amount: data.amount,
            date: data.date,
            method: data.method,
            reference: data.reference,
            notes: data.notes,
            invoiceId: data.invoiceId,
            createdById: session.user.id,
        },
    });

    // Update invoice using Decimal calculations
    const updatedPaidAmountDecimal = addDecimals(invoice.paidAmount, data.amount);
    const updatedBalanceDecimal = subtractDecimals(invoice.total, updatedPaidAmountDecimal);

    const updatedPaidAmount = updatedPaidAmountDecimal.toNumber();
    const updatedBalance = updatedBalanceDecimal.toNumber();

    let newStatus = invoice.status;
    if (updatedBalanceDecimal.lessThanOrEqualTo(0.01)) {
        newStatus = 'PAID';
    } else if (updatedPaidAmountDecimal.greaterThan(0) && invoice.status === 'SENT') {
        newStatus = 'PARTIAL';
    }

    await prisma.invoice.update({
        where: { id: data.invoiceId },
        data: {
            paidAmount: updatedPaidAmount,
            balance: updatedBalance,
            status: newStatus,
            paidAt: newStatus === 'PAID' ? new Date() : null,
        },
    });

    // Audit log
    await auditCrud('CREATE', 'Payment', payment.id, {
        invoice: invoice.number,
        amount: data.amount,
        method: data.method,
    });

    revalidatePath('/invoices');
    return payment;
}

export async function getInvoiceStats() {
    const session = await auth();
    if (!session) return { total: 0, pending: 0, paid: 0, overdue: 0 };

    const where = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'
        ? {}
        : { createdById: session.user.id };

    const [totalResult, paidResult, pendingResult, overdueResult] = await Promise.all([
        prisma.invoice.aggregate({ where, _sum: { total: true }, _count: true }),
        prisma.invoice.aggregate({
            where: { ...where, status: 'PAID' },
            _sum: { total: true },
            _count: true,
        }),
        prisma.invoice.aggregate({
            where: { ...where, status: { in: ['DRAFT', 'SENT', 'PARTIAL'] } },
            _sum: { balance: true },
            _count: true,
        }),
        prisma.invoice.count({ where: { ...where, status: 'OVERDUE' } }),
    ]);

    return {
        totalAmount: totalResult._sum.total || 0,
        totalCount: totalResult._count,
        paidAmount: paidResult._sum.total || 0,
        paidCount: paidResult._count,
        pendingAmount: pendingResult._sum.balance || 0,
        pendingCount: pendingResult._count,
        overdueCount: overdueResult,
    };
}
