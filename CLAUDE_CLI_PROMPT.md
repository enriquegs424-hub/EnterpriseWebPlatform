# MEP Projects - Claude Code CLI Development Prompt

Use this prompt when working with Claude Code CLI to continue development on the MEP Projects ERP platform.

---

## SYSTEM CONTEXT PROMPT

```
You are working on MEP Projects, a modern ERP platform for professional services companies (engineering, architecture, consulting firms).

## Tech Stack
- **Frontend**: Next.js 15.1 with App Router, React 19, Tailwind CSS 4, Framer Motion
- **Backend**: Next.js Server Actions (no API routes), Prisma ORM 5.22
- **Database**: PostgreSQL with 25+ models
- **Auth**: NextAuth.js v5 with JWT sessions
- **Testing**: Vitest

## Architecture Principles
1. **Multi-tenant**: All entities have `companyId` for data isolation
2. **RBAC**: Use `checkPermission()` before any CRUD operation
3. **Audit trail**: Log mutations with `auditCrud()`
4. **State machines**: Business logic uses validated state transitions
5. **Type-safe**: TypeScript strict mode, no `any` types
6. **Server-side logic**: Critical business logic never in client components

## Current Project Structure
```
src/app/(protected)/  # 22 protected modules
  ├── dashboard/      # Home dashboard
  ├── projects/       # Project management
  ├── tasks/          # Task management (Kanban, List, Calendar views)
  ├── calendar/       # Unified calendar (events, tasks, holidays, personal notes)
  ├── chat/           # Team messaging
  ├── documents/      # Document management with versioning
  ├── hours/          # Time tracking
  ├── invoices/       # Invoicing
  ├── quotes/         # Quotations
  ├── crm/            # Lead pipeline
  ├── expenses/       # Expense management
  ├── analytics/      # Dashboards
  └── superadmin/     # Admin panel
```

## Completed Features (Phase 1 & 2)
- ✅ Authentication, authorization, RBAC (4 roles × 11 resources)
- ✅ Multi-tenant data isolation
- ✅ Dashboard with KPIs
- ✅ Project management with phases and budgets
- ✅ Task management with Kanban, List, Calendar views
- ✅ Unified calendar with events, tasks, holidays, personal notes
- ✅ Recurring events (daily, weekly, monthly, yearly)
- ✅ Drag & drop for tasks and calendar items
- ✅ Chat with direct messages and groups
- ✅ Document management with versioning and preview
- ✅ Time tracking with approval workflow
- ✅ Invoicing with PDF generation
- ✅ Quotations with conversion to invoice
- ✅ CRM with 6-stage pipeline
- ✅ Client management
- ✅ Notifications system
- ✅ Dark mode
- ✅ Audit trail

## Priority Development Tasks (Phase 3+)

### P0 - Critical
1. **iCal Export**: Generate .ics files for calendar sync with Google Calendar/Outlook
2. **Email Notifications**: Send emails for task assignments, lead updates, invoice reminders
3. **Public REST API**: Expose endpoints for third-party integrations
4. **Webhooks**: Notify external systems of events

### P1 - High
1. **Customizable PDF Templates**: For invoices and quotes
2. **Workflow Automation**: If-then rules engine
3. **Project Templates**: Create projects from templates
4. **Recurring Tasks**: Tasks that repeat automatically
5. **Vacation/Absence Management**: Request and approval flow
6. **Financial Reports**: P&L, Balance Sheet, Cash Flow

### P2 - Medium
1. **Digital Signatures**: Sign documents electronically
2. **Data Import**: Migrate from Excel/other tools
3. **Custom Dashboards**: Drag-and-drop widgets
4. **Mobile App**: iOS and Android native apps
5. **Client Portal**: External access for clients

## Code Conventions

### Server Actions
```typescript
'use server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function createSomething(data: CreateInput) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');
    
    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!user) throw new Error('User not found');
    
    // RBAC check
    await checkPermission(user.id, 'resource', 'CREATE');
    
    // Business logic...
    
    revalidatePath('/path');
    return result;
}
```

### Components
```tsx
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function MyComponent({ prop }: Props) {
    // State
    // Handlers
    // Return JSX with Tailwind classes
}
```

### Prisma Models
- Always include `companyId` for multi-tenant
- Use `@@index` for frequently queried fields
- Include `createdAt`, `updatedAt` timestamps

## Key Files to Reference
- `prisma/schema.prisma` - Database models
- `src/lib/permissions.ts` - RBAC system
- `src/lib/state-machines.ts` - State transition logic
- `src/auth.ts` - Authentication config
- `src/middleware.ts` - Route protection
- `src/app/(protected)/calendar/actions.ts` - Example of complex server actions
- `src/components/calendar/EventsView.tsx` - Example of complex component

## When Implementing New Features
1. Update Prisma schema if needed (`npx prisma db push`)
2. Create server actions in `actions.ts`
3. Create UI components
4. Add to sidebar navigation
5. Add RBAC permissions
6. Add audit logging
7. Write tests
```

---

## EXAMPLE TASK PROMPTS

### For iCal Export:
```
Implement iCal export functionality for the calendar module.

Requirements:
1. Add a server action `exportCalendarToIcal(startDate, endDate)` in `src/app/(protected)/calendar/actions.ts`
2. Generate RFC 5545 compliant .ics file content
3. Include all events (non-recurring and recurring instances)
4. Add "Export" button in EventsView.tsx
5. Trigger download of .ics file when clicked
```

### For Email Notifications:
```
Implement email notification system.

Requirements:
1. Create email service in `src/lib/email.ts` using nodemailer
2. Create email templates for: task_assigned, lead_created, invoice_sent
3. Add `sendNotificationEmail()` function
4. Call from relevant server actions (createTask, createLead, etc.)
5. Add user preference to enable/disable email notifications
```

### For Workflow Automation:
```
Implement a rules engine for workflow automation.

Requirements:
1. Create model `AutomationRule` in Prisma schema
2. Create UI in `/superadmin/automations` to define rules
3. Implement rule evaluation engine
4. Example rule: "If lead status is NEW for 7 days, create reminder task"
5. Run rules via cron job or on relevant events
```

---

## DEBUGGING TIPS

- If Prisma types are stale: `npx prisma generate`
- If TypeScript errors persist: Restart TS server
- Check `npm run dev` console for runtime errors
- Use `npx prisma studio` to inspect database
- Check browser console for client errors
