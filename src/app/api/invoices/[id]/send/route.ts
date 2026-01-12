import { NextResponse } from 'next/server';
import { updateInvoiceStatus } from '@/app/(protected)/invoices/actions';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await updateInvoiceStatus(params.id, 'SENT');
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
