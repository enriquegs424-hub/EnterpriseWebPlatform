import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoicePDFData {
    number: string;
    date: Date;
    dueDate: Date;
    client: {
        name: string;
        email: string;
        taxId?: string;
        address?: string;
    };
    company: {
        name: string;
        taxId: string;
        address: string;
        email: string;
        phone?: string;
    };
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        subtotal: number;
        taxAmount: number;
        total: number;
    }>;
    subtotal: number;
    taxTotal: number;
    total: number;
    notes?: string;
    terms?: string;
}

export function generateInvoicePDF(invoice: InvoicePDFData): void {
    const doc = new jsPDF();

    // Company info & Logo area
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.company.name, 20, 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.company.address, 20, 28);
    doc.text(`CIF: ${invoice.company.taxId}`, 20, 33);
    doc.text(invoice.company.email, 20, 38);
    if (invoice.company.phone) {
        doc.text(invoice.company.phone, 20, 43);
    }

    // Invoice title & number
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(124, 143, 59); // Olive color
    doc.text("FACTURA", 200, 20, { align: "right" });

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.number, 200, 28, { align: "right" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${formatDate(invoice.date)}`, 200, 35, { align: "right" });
    doc.text(`Vencimiento: ${formatDate(invoice.dueDate)}`, 200, 40, { align: "right" });

    // Client info box
    doc.setFillColor(248, 249, 244); // Light olive
    doc.rect(20, 55, 85, 35, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE:", 25, 62);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(invoice.client.name, 25, 68);
    if (invoice.client.taxId) {
        doc.text(`CIF/NIF: ${invoice.client.taxId}`, 25, 73);
    }
    if (invoice.client.address) {
        const addressLines = doc.splitTextToSize(invoice.client.address, 75);
        doc.text(addressLines, 25, 78);
    }

    // Items table
    const tableStartY = 100;

    autoTable(doc, {
        startY: tableStartY,
        head: [["Descripción", "Cantidad", "Precio Unit.", "IVA %", "Subtotal", "IVA", "Total"]],
        body: invoice.items.map((item) => [
            item.description,
            item.quantity.toFixed(2),
            formatCurrency(item.unitPrice),
            item.taxRate + "%",
            formatCurrency(item.subtotal),
            formatCurrency(item.taxAmount),
            formatCurrency(item.total),
        ]),
        theme: "striped",
        headStyles: {
            fillColor: [124, 143, 59], // Olive
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
        },
        bodyStyles: {
            fontSize: 9,
        },
        columnStyles: {
            0: { cellWidth: 70 }, // Description
            1: { cellWidth: 20, halign: "right" }, // Quantity
            2: { cellWidth: 25, halign: "right" }, // Unit Price
            3: { cellWidth: 15, halign: "center" }, // Tax %
            4: { cellWidth: 25, halign: "right" }, // Subtotal
            5: { cellWidth: 20, halign: "right" }, // Tax
            6: { cellWidth: 25, halign: "right" }, // Total
        },
        margin: { left: 20, right: 20 },
    });

    // Totals section
    const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 50;
    const totalsX = 140;
    const totalsStartY = finalY + 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Subtotal
    doc.text("Subtotal:", totalsX, totalsStartY);
    doc.text(formatCurrency(invoice.subtotal), 200, totalsStartY, { align: "right" });

    // IVA
    doc.text("IVA:", totalsX, totalsStartY + 6);
    doc.text(formatCurrency(invoice.taxTotal), 200, totalsStartY + 6, { align: "right" });

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(totalsX, totalsStartY + 9, 200, totalsStartY + 9);

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL:", totalsX, totalsStartY + 16);
    doc.setTextColor(124, 143, 59); // Olive
    doc.text(formatCurrency(invoice.total), 200, totalsStartY + 16, { align: "right" });

    doc.setTextColor(0, 0, 0);

    // Notes
    let notesY = totalsStartY + 25;
    if (invoice.notes) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Notas:", 20, notesY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const notesLines = doc.splitTextToSize(invoice.notes, 170);
        doc.text(notesLines, 20, notesY + 5);
        notesY += 5 + (notesLines.length * 4);
    }

    // Terms & conditions
    if (invoice.terms) {
        notesY += 5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Términos y Condiciones:", 20, notesY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const termsLines = doc.splitTextToSize(invoice.terms, 170);
        doc.text(termsLines, 20, notesY + 5);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
        `Generado el ${formatDate(new Date())} - ${invoice.company.name}`,
        105,
        285,
        { align: "center" }
    );

    // Save
    doc.save(`${invoice.number}.pdf`);
}

// Helper functions
function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(date));
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
    }).format(amount);
}
