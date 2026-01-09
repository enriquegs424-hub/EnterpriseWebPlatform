import { NextResponse } from 'next/server';
import { getInvoice } from '../../(protected)/invoices/actions';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const invoice = await getInvoice(params.id);
        return NextResponse.json(invoice);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
}
