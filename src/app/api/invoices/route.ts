import { NextResponse } from 'next/server';
import { getInvoices } from '../(protected)/invoices/actions';

export async function GET() {
    try {
        const invoices = await getInvoices();
        return NextResponse.json(invoices);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
