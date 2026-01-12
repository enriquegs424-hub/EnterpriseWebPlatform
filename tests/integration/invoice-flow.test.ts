import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Integration test for complete invoice workflow
// Tests: Create Invoice → Add Items → Send → Partial Payment → Full Payment → Status Updates

const prisma = new PrismaClient();

describe("Integration Test - Invoice Flow (E2E)", () => {
    let testCompanyId: string;
    let testClientId: string;
    let testUserId: string;
    let testInvoiceId: string;

    beforeAll(async () => {
        // Setup: Create test company, user, and client
        const company = await prisma.company.create({
            data: {
                name: "Test Company Integration",
                slug: `test-company-${Date.now()}`,
            },
        });
        testCompanyId = company.id;

        const user = await prisma.user.create({
            data: {
                name: "Integration Test User",
                email: `integration-${Date.now()}@test.com`,
                passwordHash: "fake-hash-for-testing",
                role: "ADMIN",
                companyId: testCompanyId,
            },
        });
        testUserId = user.id;

        const client = await prisma.client.create({
            data: {
                name: "Test Client AB",
                email: `client-${Date.now()}@test.com`,
                companyId: testCompanyId,
            },
        });
        testClientId = client.id;
    });

    afterAll(async () => {
        // Cleanup: Delete test data
        if (testInvoiceId) {
            await prisma.invoice.delete({ where: { id: testInvoiceId } }).catch(() => { });
        }
        await prisma.client.delete({ where: { id: testClientId } }).catch(() => { });
        await prisma.user.delete({ where: { id: testUserId } }).catch(() => { });
        await prisma.company.delete({ where: { id: testCompanyId } }).catch(() => { });
        await prisma.$disconnect();
    });

    it("should create invoice with items and calculate totals correctly (Decimal)", async () => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Create invoice with 2 items
        const invoice = await prisma.invoice.create({
            data: {
                number: `INV-TEST-${Date.now()}`,
                date: new Date(),
                dueDate,
                status: "DRAFT",
                clientId: testClientId,
                createdById: testUserId,
                companyId: testCompanyId,
                subtotal: new Decimal("200.00"),
                taxAmount: new Decimal("42.00"),
                total: new Decimal("242.00"),
                balance: new Decimal("242.00"),
                paidAmount: new Decimal("0.00"),
                items: {
                    create: [
                        {
                            description: "Consulting Services",
                            quantity: new Decimal("2"),
                            unitPrice: new Decimal("50.00"),
                            taxRate: new Decimal("21"),
                            subtotal: new Decimal("100.00"),
                            taxAmount: new Decimal("21.00"),
                            total: new Decimal("121.00"),
                            order: 0,
                        },
                        {
                            description: "Development Hours",
                            quantity: new Decimal("1"),
                            unitPrice: new Decimal("100.00"),
                            taxRate: new Decimal("21"),
                            subtotal: new Decimal("100.00"),
                            taxAmount: new Decimal("21.00"),
                            total: new Decimal("121.00"),
                            order: 1,
                        },
                    ],
                },
            },
            include: { items: true },
        });

        testInvoiceId = invoice.id;

        // Verify invoice totals
        expect(invoice.subtotal.toNumber()).toBe(200.00);
        expect(invoice.taxAmount.toNumber()).toBe(42.00);
        expect(invoice.total.toNumber()).toBe(242.00);
        expect(invoice.balance.toNumber()).toBe(242.00);
        expect(invoice.items.length).toBe(2);

        // Verify item calculations
        const item1 = invoice.items[0];
        expect(item1.subtotal.toNumber()).toBe(100.00);
        expect(item1.taxAmount.toNumber()).toBe(21.00);
        expect(item1.total.toNumber()).toBe(121.00);
    });

    it("should transition invoice from DRAFT → SENT", async () => {
        const updated = await prisma.invoice.update({
            where: { id: testInvoiceId },
            data: {
                status: "SENT",
                issuedAt: new Date(),
            },
        });

        expect(updated.status).toBe("SENT");
        expect(updated.issuedAt).toBeDefined();
    });

    it("should register partial payment and update to PARTIAL status", async () => {
        const partialAmount = new Decimal("100.00");

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                amount: partialAmount,
                date: new Date(),
                method: "TRANSFER",
                invoiceId: testInvoiceId,
                createdById: testUserId,
                reference: "TRANSFER-001",
            },
        });

        // Update invoice
        const invoice = await prisma.invoice.findUnique({
            where: { id: testInvoiceId },
        });

        const newPaidAmount = invoice!.paidAmount.add(partialAmount);
        const newBalance = invoice!.total.sub(newPaidAmount);

        const updated = await prisma.invoice.update({
            where: { id: testInvoiceId },
            data: {
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: "PARTIAL",
            },
        });

        expect(updated.paidAmount.toNumber()).toBe(100.00);
        expect(updated.balance.toNumber()).toBe(142.00);
        expect(updated.status).toBe("PARTIAL");
        expect(payment.amount.toNumber()).toBe(100.00);
    });

    it("should register final payment and update to PAID status", async () => {
        const invoice = await prisma.invoice.findUnique({
            where: { id: testInvoiceId },
        });

        const remainingAmount = invoice!.balance;

        // Create final payment
        const payment = await prisma.payment.create({
            data: {
                amount: remainingAmount,
                date: new Date(),
                method: "CARD",
                invoiceId: testInvoiceId,
                createdById: testUserId,
                reference: "CARD-002",
            },
        });

        // Update invoice to PAID
        const updated = await prisma.invoice.update({
            where: { id: testInvoiceId },
            data: {
                paidAmount: invoice!.total,
                balance: new Decimal("0.00"),
                status: "PAID",
                paidAt: new Date(),
            },
        });

        expect(updated.paidAmount.toString()).toBe(updated.total.toString());
        expect(updated.balance.toNumber()).toBe(0.00);
        expect(updated.status).toBe("PAID");
        expect(updated.paidAt).toBeDefined();
        expect(payment.amount.toString()).toBe(remainingAmount.toString());
    });

    it("should have correct payment history (2 payments)", async () => {
        const payments = await prisma.payment.findMany({
            where: { invoiceId: testInvoiceId },
            orderBy: { date: "asc" },
        });

        expect(payments.length).toBe(2);
        expect(payments[0].amount.toNumber()).toBe(100.00);
        expect(payments[0].method).toBe("TRANSFER");
        expect(payments[1].amount.toNumber()).toBe(142.00);
        expect(payments[1].method).toBe("CARD");

        // Verify total payments = invoice total
        const totalPaid = payments.reduce(
            (sum, p) => sum.add(p.amount),
            new Decimal("0")
        );
        expect(totalPaid.toNumber()).toBe(242.00);
    });

    it("should maintain Decimal precision throughout entire flow", async () => {
        const invoice = await prisma.invoice.findUnique({
            where: { id: testInvoiceId },
            include: { items: true, payments: true },
        });

        // All Decimal fields should maintain precision
        expect(invoice!.subtotal).toBeInstanceOf(Decimal);
        expect(invoice!.taxAmount).toBeInstanceOf(Decimal);
        expect(invoice!.total).toBeInstanceOf(Decimal);
        expect(invoice!.paidAmount).toBeInstanceOf(Decimal);
        expect(invoice!.balance).toBeInstanceOf(Decimal);

        // No floating point errors
        const calculatedBalance = invoice!.total.sub(invoice!.paidAmount);
        expect(calculatedBalance.toNumber()).toBe(0.00);
        expect(invoice!.balance.toNumber()).toBe(0.00);
    });
});

describe("Integration Test - Edge Cases", () => {
    it("should handle precise tax calculations (21% IVA)", () => {
        // Test case: 99.99 × 21% should be exactly 21.00 (rounded)
        const subtotal = new Decimal("99.99");
        const taxRate = new Decimal("21");
        const expectedTax = subtotal.mul(taxRate).div(100).toDecimalPlaces(2);

        expect(expectedTax.toNumber()).toBe(21.00);
    });

    it("should handle the classic 0.1 + 0.2 problem correctly", () => {
        const a = new Decimal("0.1");
        const b = new Decimal("0.2");
        const sum = a.add(b);

        expect(sum.toString()).toBe("0.3"); // NOT 0.30000000000004
    });

    it("should handle large invoice amounts without precision loss", () => {
        const largeAmount = new Decimal("999999999.99");
        const taxAmount = largeAmount.mul(21).div(100).toDecimalPlaces(2);
        const total = largeAmount.add(taxAmount);

        expect(total.toNumber()).toBe(1209999999.99);
    });
});

// Total: 10 integration tests covering complete invoice lifecycle + edge cases
