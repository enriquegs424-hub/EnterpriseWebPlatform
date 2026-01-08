'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { ExpenseCategory, ExpenseStatus } from '@prisma/client';

export async function getExpenses() {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

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

    return prisma.expense.create({
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
}

export async function updateExpenseStatus(id: string, status: ExpenseStatus) {
    const session = await auth();
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        throw new Error('Unauthorized');
    }

    await prisma.expense.update({
        where: { id },
        data: { status }
    });

    revalidatePath('/expenses');
}

export async function deleteExpense(id: string) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // Only allow deleting own pending expenses or if admin
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return;

    if (expense.userId !== session.user.id && session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }

    if (expense.status !== 'PENDING' && session.user.role !== 'ADMIN') {
        throw new Error('Cannot delete processed expense');
    }

    await prisma.expense.delete({ where: { id } });
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
