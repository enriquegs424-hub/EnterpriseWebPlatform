'use server';

import { prisma } from '@/lib/prisma';
import { auditCrud } from '@/lib/permissions';

/**
 * Job to mark overdue invoices
 * Should be run daily via cron or scheduled task
 */
export async function markOverdueInvoices() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find invoices that are SENT but past their due date
    const overdueInvoices = await prisma.invoice.findMany({
        where: {
            status: 'SENT',
            dueDate: {
                lt: today
            },
            balance: {
                gt: 0
            }
        },
        select: {
            id: true,
            number: true,
            dueDate: true,
            balance: true,
            clientId: true,
        }
    });

    if (overdueInvoices.length === 0) {
        return {
            success: true,
            marked: 0,
            invoices: []
        };
    }

    // Update all to OVERDUE
    const updatePromises = overdueInvoices.map(async (invoice) => {
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'OVERDUE' }
        });

        // Audit log
        await auditCrud('UPDATE', 'Invoice', invoice.id, {
            action: 'MARKED_OVERDUE',
            number: invoice.number,
            dueDate: invoice.dueDate,
            daysOverdue: Math.floor((today.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        });

        // TODO: Send notification to invoice creator and managers
        // await createNotification({
        //     userId: invoice.createdById,
        //     type: 'INVOICE_OVERDUE',
        //     title: 'Factura Vencida',
        //     message: `La factura ${invoice.number} está vencida`,
        //     link: `/invoices/${invoice.id}`
        // });

        return invoice.id;
    });

    await Promise.all(updatePromises);

    return {
        success: true,
        marked: overdueInvoices.length,
        invoices: overdueInvoices.map(i => ({
            id: i.id,
            number: i.number,
            dueDate: i.dueDate
        }))
    };
}

/**
 * Job to send reminders for invoices due soon (in 3 days)
 * Optional enhancement
 */
export async function sendDueSoonReminders() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const dueToday = new Date();
    dueToday.setHours(0, 0, 0, 0);

    const dueSoonInvoices = await prisma.invoice.findMany({
        where: {
            status: { in: ['SENT', 'PARTIAL'] },
            dueDate: {
                gte: dueToday,
                lte: threeDaysFromNow
            },
            balance: { gt: 0 }
        },
        select: {
            id: true,
            number: true,
            dueDate: true,
            balance: true,
            createdById: true
        }
    });

    // Send notifications
    const notificationPromises = dueSoonInvoices.map(async (invoice) => {
        // TODO: Implement notification sending
        // await createNotification({
        //     userId: invoice.createdById,
        //     type: 'INVOICE_DUE_SOON',
        //     title: 'Factura Próxima a Vencer',
        //     message: `La factura ${invoice.number} vence en 3 días`,
        //     link: `/invoices/${invoice.id}`
        // });
    });

    await Promise.all(notificationPromises);

    return {
        success: true,
        reminded: dueSoonInvoices.length
    };
}
