"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { checkPermission } from "@/lib/permissions";

export async function getFinancialDashboard() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("analytics", "read");

    const companyId = user.companyId as string;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Invoice stats
    const [
        totalInvoiced,
        totalPaid,
        totalPending,
        overdueInvoices,
        monthlyInvoiced,
        yearlyInvoiced,
    ] = await Promise.all([
        // Total invoiced (all time)
        prisma.invoice.aggregate({
            where: { companyId, status: { not: "CANCELLED" } },
            _sum: { total: true },
        }),
        // Total paid (all time)
        prisma.payment.aggregate({
            where: { invoice: { companyId } },
            _sum: { amount: true },
        }),
        // Total pending balance
        prisma.invoice.aggregate({
            where: { companyId, status: { in: ["SENT", "PARTIAL", "OVERDUE"] } },
            _sum: { balance: true },
        }),
        // Overdue invoices count
        prisma.invoice.count({
            where: { companyId, status: "OVERDUE" },
        }),
        // This month invoiced
        prisma.invoice.aggregate({
            where: {
                companyId,
                status: { not: "CANCELLED" },
                date: { gte: startOfMonth },
            },
            _sum: { total: true },
        }),
        // This year invoiced
        prisma.invoice.aggregate({
            where: {
                companyId,
                status: { not: "CANCELLED" },
                date: { gte: startOfYear },
            },
            _sum: { total: true },
        }),
    ]);

    // Expense stats
    const [
        totalExpenses,
        approvedExpenses,
        pendingExpenses,
        monthlyExpenses,
    ] = await Promise.all([
        prisma.expense.aggregate({
            where: { companyId },
            _sum: { amount: true },
        }),
        prisma.expense.aggregate({
            where: { companyId, status: "APPROVED" },
            _sum: { amount: true },
        }),
        prisma.expense.aggregate({
            where: { companyId, status: "PENDING" },
            _sum: { amount: true },
        }),
        prisma.expense.aggregate({
            where: { companyId, createdAt: { gte: startOfMonth } },
            _sum: { amount: true },
        }),
    ]);

    // Recent invoices (last 5)
    const recentInvoices = await prisma.invoice.findMany({
        where: { companyId },
        orderBy: { date: "desc" },
        take: 5,
        select: {
            id: true,
            number: true,
            total: true,
            balance: true,
            status: true,
            date: true,
            client: { select: { name: true } },
        },
    });

    // Recent payments (last 5)
    const recentPayments = await prisma.payment.findMany({
        where: { invoice: { companyId } },
        orderBy: { date: "desc" },
        take: 5,
        select: {
            id: true,
            amount: true,
            method: true,
            date: true,
            invoice: { select: { number: true, client: { select: { name: true } } } },
        },
    });

    // Monthly revenue for last 6 months
    const monthlyRevenue = await getMonthlyRevenue(companyId);

    // Top clients by revenue
    const topClients = await prisma.invoice.groupBy({
        by: ["clientId"],
        where: { companyId, status: { not: "CANCELLED" } },
        _sum: { total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
    });

    const topClientsWithNames = await Promise.all(
        topClients.map(async (c) => {
            const client = await prisma.client.findUnique({
                where: { id: c.clientId },
                select: { name: true },
            });
            return { name: client?.name || "Unknown", total: c._sum.total || 0 };
        })
    );

    return {
        invoices: {
            total: totalInvoiced._sum.total || 0,
            paid: totalPaid._sum.amount || 0,
            pending: totalPending._sum.balance || 0,
            overdueCount: overdueInvoices,
            thisMonth: monthlyInvoiced._sum.total || 0,
            thisYear: yearlyInvoiced._sum.total || 0,
        },
        expenses: {
            total: totalExpenses._sum.amount || 0,
            approved: approvedExpenses._sum.amount || 0,
            pending: pendingExpenses._sum.amount || 0,
            thisMonth: monthlyExpenses._sum.amount || 0,
        },
        profitLoss: {
            revenue: totalPaid._sum.amount || 0,
            expenses: approvedExpenses._sum.amount || 0,
            profit: (totalPaid._sum.amount || 0) - (approvedExpenses._sum.amount || 0),
        },
        recentInvoices,
        recentPayments,
        monthlyRevenue,
        topClients: topClientsWithNames,
    };
}

async function getMonthlyRevenue(companyId: string) {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const [invoiced, collected] = await Promise.all([
            prisma.invoice.aggregate({
                where: {
                    companyId,
                    status: { not: "CANCELLED" },
                    date: { gte: monthStart, lte: monthEnd },
                },
                _sum: { total: true },
            }),
            prisma.payment.aggregate({
                where: {
                    invoice: { companyId },
                    date: { gte: monthStart, lte: monthEnd },
                },
                _sum: { amount: true },
            }),
        ]);

        months.push({
            month: monthStart.toLocaleDateString("es-ES", { month: "short", year: "2-digit" }),
            invoiced: invoiced._sum.total || 0,
            collected: collected._sum.amount || 0,
        });
    }

    return months;
}
