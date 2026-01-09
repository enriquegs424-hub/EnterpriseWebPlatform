import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { auditCrud } from "@/lib/permissions";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const invoiceId = params.id;
        const body = await request.json();

        const { amount, method, reference, notes, date } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Importe inválido" }, { status: 400 });
        }

        // Get invoice
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
        });

        if (!invoice || invoice.companyId !== user.companyId) {
            return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
        }

        // Validate amount doesn't exceed balance
        if (amount > invoice.balance) {
            return NextResponse.json(
                { error: `El importe no puede superar el saldo pendiente (${invoice.balance.toFixed(2)} €)` },
                { status: 400 }
            );
        }

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                invoiceId,
                amount,
                method: method || "TRANSFER",
                reference,
                notes,
                date: date ? new Date(date) : new Date(),
                createdById: user.id,
            },
        });

        // Calculate new balance and paid amount
        const newPaidAmount = invoice.paidAmount + amount;
        const newBalance = invoice.total - newPaidAmount;

        // Determine new status
        let newStatus = invoice.status;
        if (newBalance === 0) {
            newStatus = "PAID";
        } else if (newPaidAmount > 0 && newBalance > 0) {
            newStatus = "PARTIAL";
        }

        // Update invoice
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newStatus,
            },
        });

        await auditCrud("CREATE", "Payment", payment.id, {
            invoiceId,
            amount,
            method,
            newStatus,
        });

        return NextResponse.json({
            success: true,
            payment,
            invoice: {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newStatus,
            },
        });
    } catch (error: any) {
        console.error("Error creating payment:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
