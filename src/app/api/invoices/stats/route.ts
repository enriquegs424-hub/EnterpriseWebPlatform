import { NextResponse } from 'next/server';
import { getInvoiceStats } from '../../(protected)/invoices/actions';

export async function GET() {
    try {
        const stats = await getInvoiceStats();
        return NextResponse.json(stats);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
