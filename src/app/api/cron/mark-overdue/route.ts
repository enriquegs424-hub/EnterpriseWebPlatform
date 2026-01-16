import { NextResponse } from 'next/server';
import { markOverdueInvoices } from '@/lib/jobs/invoice-jobs';

/**
 * Cron endpoint to mark overdue invoices
 * Should be called daily by external cron service
 * 
 * Security: Requires CRON_SECRET environment variable
 */
export async function GET(request: Request) {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
        console.error('CRON_SECRET not configured');
        return NextResponse.json(
            { error: 'Cron not configured' },
            { status: 500 }
        );
    }

    if (authHeader !== expectedAuth) {
        console.warn('Unauthorized cron attempt');
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const result = await markOverdueInvoices();

        console.log(`[CRON] Marked ${result.marked} invoices as overdue`);

        return NextResponse.json(result);
    } catch (error) {
        console.error('[CRON] Error marking overdue invoices:', error);
        return NextResponse.json(
            { error: 'Job failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
