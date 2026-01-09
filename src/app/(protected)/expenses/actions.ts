'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { ExpenseCategory, ExpenseStatus } from '@prisma/client';
import { checkPermission, auditCrud } from '@/lib/permissions';
import { ExpenseStateMachine } from '@/lib/state-machine';

export async function getExpenses() {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Check permission
    await checkPermission('expenses', 'read');

    const where = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'
        ? {}
        : { userId: session.user.id };

    return prisma.expense.findMany({
        where,
        include: {
            user: { select: { name: true } },
            project: { select: { name: true, code: true } }
        },
        orderBy: { date: 'desc' }
    });
}

export async function createExpense(data: {
    description: string;
    amount: number;
    date: Date;
    category: ExpenseCategory;
    projectId?: string;
    receiptUrl?: string;
}) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Check permission
    await checkPermission('expenses', 'create');

    const expense = await prisma.expense.create({
        data: {
            description: data.description,
            amount: data.amount,
            date: data.date,
            category: data.category,
            projectId: data.projectId || null,
            userId: session.user.id,
            receiptUrl: data.receiptUrl,
            status: 'PENDING'
        }
    });

    // Audit log
    await auditCrud('CREATE', 'Expense', expense.id, { description: data.description, amount: data.amount });

    revalidatePath('/expenses');
    return expense;
}

export async function updateExpenseStatus(id: string, status: ExpenseStatus) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Check permission (approve is special action)
    await checkPermission('expenses', 'approve');

    // Get current expense
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new Error('Expense not found');

    // Validate state transition
    try {
        ExpenseStateMachine.transition(expense.status, status);
    } catch (e: any) {
        throw new Error(e.message);
    }

    await prisma.expense.update({
        where: { id },
        data: { status }
    });

    // Audit log
    await auditCrud('UPDATE', 'Expense', id, { status, previousStatus: expense.status });

    revalidatePath('/expenses');
}

export async function deleteExpense(id: string) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Only allow deleting own pending expenses or if admin
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return;

    // Check permission (with ownership check)
    await checkPermission('expenses', 'delete', expense.userId);

    if (expense.status !== 'PENDING' && session.user.role !== 'ADMIN') {
        throw new Error('Cannot delete processed expense');
    }

    await prisma.expense.delete({ where: { id } });

    // Audit log
    await auditCrud('DELETE', 'Expense', id, { description: expense.description, amount: expense.amount });

    revalidatePath('/expenses');
}

export async function getExpenseStats() {
    const session = await auth();
    if (!session) return { total: 0, pending: 0, approved: 0 };

    const where = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'
        ? {}
        : { userId: session.user.id };

    const [total, pending, approved] = await Promise.all([
        prisma.expense.aggregate({ where, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { ...where, status: 'PENDING' }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { ...where, status: 'APPROVED' }, _sum: { amount: true } })
    ]);

    return {
        total: total._sum.amount || 0,
        pending: pending._sum.amount || 0,
        approved: approved._sum.amount || 0
    };
}
