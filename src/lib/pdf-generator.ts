'use server';

import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { auditCrud } from '@/lib/permissions';

/**
 * Generate PDF for a quote
 * This creates a PDF document and saves it to the Documents module
 */
export async function generateQuotePDF(quoteId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('No autenticado');

    // Get quote with all details
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: {
            items: {
                orderBy: { order: 'asc' }
            },
            client: {
                select: {
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    companyName: true
                }
            },
            company: {
                select: {
                    name: true,
                    taxId: true,
                    logo: true
                }
            },
            createdBy: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });

    if (!quote) throw new Error('Presupuesto no encontrado');
    if (quote.companyId !== user.companyId) throw new Error('No autorizado');

    // Generate PDF using jsPDF
    const pdfData = await generateQuotePDFData(quote);

    // Get client name for description
    const client = await prisma.client.findUnique({
        where: { id: quote.clientId },
        select: { name: true }
    });

    // Save as Document
    const document = await prisma.document.create({
        data: {
            name: `Presupuesto-${quote.number}.pdf`,
            description: `Presupuesto ${quote.number} para ${client?.name || 'cliente'}`,
            fileName: `presupuesto-${quote.number}.pdf`,
            fileSize: pdfData.size,
            fileType: 'application/pdf',
            filePath: pdfData.path,
            uploadedById: user.id,
            isPublic: false,
        }
    });

    // Audit
    await auditCrud('CREATE', 'Document', document.id, {
        type: 'Quote PDF',
        quoteId: quote.id,
        quoteNumber: quote.number
    });

    return {
        documentId: document.id,
        pdfUrl: pdfData.url,
        fileName: document.fileName
    };
}

/**
 * Generate PDF data (to be implemented with jsPDF client-side or use library)
 * For now, returns structure. Real implementation needs PDF generation logic.
 */
async function generateQuotePDFData(quote: any) {
    // This would need actual PDF generation
    // For server-side PDF: use puppeteer, or move to client-side with jsPDF

    // Placeholder: In real implementation, this would:
    // 1. Create PDF with company branding
    // 2. Add quote details, items table
    // 3. Save to file system or S3
    // 4. Return file info

    return {
        path: `/uploads/quotes/quote-${quote.number}.pdf`,
        url: `/api/documents/download/${quote.id}`,
        size: 0 // Would be actual PDF size
    };
}

/**
 * Similar function for invoices
 */
export async function generateInvoicePDF(invoiceId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('No autenticado');

    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            items: {
                orderBy: { order: 'asc' }
            },
            client: {
                select: {
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    companyName: true
                }
            },
            company: {
                select: {
                    name: true,
                    taxId: true,
                    logo: true
                }
            },
            payments: {
                orderBy: { date: 'desc' }
            }
        }
    });

    if (!invoice) throw new Error('Factura no encontrada');
    if (invoice.companyId !== user.companyId) throw new Error('No autorizado');

    const pdfData = await generateInvoicePDFData(invoice);

    // Get client name
    const client = await prisma.client.findUnique({
        where: { id: invoice.clientId },
        select: { name: true }
    });

    const document = await prisma.document.create({
        data: {
            name: `Factura-${invoice.number}.pdf`,
            description: `Factura ${invoice.number} para ${client?.name || 'cliente'}`,
            fileName: `factura-${invoice.number}.pdf`,
            fileSize: pdfData.size,
            fileType: 'application/pdf',
            filePath: pdfData.path,
            uploadedById: user.id,
            projectId: invoice.projectId,
            isPublic: false,
        }
    });

    await auditCrud('CREATE', 'Document', document.id, {
        type: 'Invoice PDF',
        invoiceId: invoice.id,
        invoiceNumber: invoice.number
    });

    return {
        documentId: document.id,
        pdfUrl: pdfData.url,
        fileName: document.fileName
    };
}

async function generateInvoicePDFData(invoice: any) {
    // Placeholder - same as quote
    return {
        path: `/uploads/invoices/invoice-${invoice.number}.pdf`,
        url: `/api/documents/download/${invoice.id}`,
        size: 0
    };
}
