# Invoice Jobs - Cron Setup

## Job: Mark Overdue Invoices

Marks invoices as OVERDUE when their due date has passed.

### Implementation Options

#### Option 1: Next.js API Route + External Cron (Recommended Production)
Create `/app/api/cron/mark-overdue/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { markOverdueInvoices } from '@/lib/jobs/invoice-jobs';

export async function GET(request: Request) {
    // Verify secret token for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await markOverdueInvoices();
    return NextResponse.json(result);
}
```

Then use external cron service (cron-job.org, GitHub Actions, etc.):
```bash
# Daily at 00:00
curl -H "Authorization: Bearer YOUR_SECRET" https://yourapp.com/api/cron/mark-overdue
```

#### Option 2: Vercel Cron (If using Vercel)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/mark-overdue",
    "schedule": "0 0 * * *"
  }]
}
```

#### Option 3: Node-cron (Development Only)
Install: `npm install node-cron`

Create middleware or server file:
```typescript
import cron from 'node-cron';
import { markOverdueInvoices } from '@/lib/jobs/invoice-jobs';

// Run every day  at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running overdue invoice job...');
    const result = await markOverdueInvoices();
    console.log(`Marked ${result.marked} invoices as overdue`);
});
```

### Manual Execution (Testing)

Create API route `/app/api/admin/run-jobs/route.ts`:
```typescript
import { markOverdueInvoices } from '@/lib/jobs/invoice-jobs';
import { auth } from '@/auth';

export async function POST() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return new Response('Unauthorized', { status: 401 });
    }

    const result = await markOverdueInvoices();
    return Response.json(result);
}
```

Then run from UI with admin button or curl:
```bash
curl -X POST https://yourapp.com/api/admin/run-jobs
```

## Recommended Setup for Production

1. **Add CRON_SECRET to `.env`**:
```
CRON_SECRET=your-secure-random-string-here
```

2. **Create API route** with auth check
3. **Use external cron service** (cron-job.org is free and reliable)
4. **Monitor execution** via logs/notifications
5. **Alert on failures**

## Testing

```bash
# Test locally
curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/cron/mark-overdue
```

Expected response:
```json
{
  "success": true,
  "marked": 3,
  "invoices": [
    { "id": "...", "number": "INV-2024-001", "dueDate": "2024-01-10" }
  ]
}
```
