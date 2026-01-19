# MEP Projects - Complete System Documentation for Claude CLI

> **Purpose**: This document provides complete context for Claude Code CLI to understand, analyze, and continue development of MEP Projects - a comprehensive enterprise ERP platform.

---

## 🎯 VISION & PHILOSOPHY

MEP Projects aims to be a **complete enterprise ecosystem** for professional services companies (engineering firms, architecture studios, consultancies). The key principles are:

### Core Philosophy
1. **Everything Connected**: Every module should integrate seamlessly. A lead becomes a client, a client has projects, projects have tasks, tasks have time entries, time entries become invoices.
2. **User-Centric Design**: Beautiful, intuitive UI. Users should accomplish tasks with minimal clicks.
3. **Data Integrity**: Multi-tenant isolation, RBAC at every level, full audit trail.
4. **Real-time Experience**: Instant feedback, optimistic updates, live notifications.
5. **Extensible Architecture**: Easy to add new modules following established patterns.

### The Ecosystem Flow
```
Lead (CRM) → Client → Project → Tasks + Time Entries + Documents → Invoice → Payment
     ↓           ↓         ↓              ↓                           ↓
  Activities   Contacts   Team      Calendar Events              Financial Reports
     ↓           ↓         ↓              ↓                           ↓
  Notifications ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←← Audit Trail
```

---

## 🏗️ TECHNICAL ARCHITECTURE

### Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js (App Router) | 15.1 |
| UI Framework | React | 19 |
| Styling | Tailwind CSS | 4 |
| Animations | Framer Motion | 12+ |
| Backend | Next.js Server Actions | - |
| ORM | Prisma | 5.22 |
| Database | PostgreSQL | 14+ |
| Auth | NextAuth.js | 5 beta |
| Testing | Vitest | 4.0 |
| Icons | Lucide React | - |
| Date Utils | date-fns | 4.1 |
| PDF Generation | jsPDF | 4.0 |
| Charts | Chart.js + react-chartjs-2 | - |

### Directory Structure
```
src/
├── app/
│   ├── (protected)/           # All authenticated routes (22 modules)
│   │   ├── dashboard/         # Home dashboard
│   │   ├── projects/          # Project management
│   │   ├── tasks/             # Task management
│   │   ├── calendar/          # Unified calendar
│   │   ├── chat/              # Team messaging
│   │   ├── documents/         # Document management
│   │   ├── hours/             # Time tracking
│   │   ├── control-horas/     # Advanced time control
│   │   ├── invoices/          # Invoicing
│   │   ├── quotes/            # Quotations
│   │   ├── crm/               # Lead pipeline
│   │   ├── expenses/          # Expense management
│   │   ├── finance/           # Financial overview
│   │   ├── analytics/         # Dashboards & reports
│   │   ├── notifications/     # Notification center
│   │   ├── settings/          # User settings
│   │   ├── admin/             # Admin panel
│   │   ├── superadmin/        # Super admin controls
│   │   ├── search/            # Global search
│   │   ├── home/              # Alt home page
│   │   ├── activity/          # Activity log
│   │   └── presence/          # User presence
│   ├── api/                   # API routes (minimal, prefer Server Actions)
│   ├── login/                 # Auth pages
│   └── portal/                # Client portal (external access)
├── components/
│   ├── layout/                # Header, Sidebar, UserMenu
│   ├── calendar/              # Calendar components
│   ├── chat/                  # Chat components
│   ├── tasks/                 # Task components
│   ├── documents/             # Document components
│   └── ui/                    # Shared UI components
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   ├── permissions.ts         # RBAC system
│   ├── state-machines.ts      # State transition logic
│   ├── audit.ts               # Audit trail logging
│   └── exports/               # Export utilities (iCal, PDF, Excel)
└── providers/                 # Context providers (Theme, Locale, etc.)
```

---

## 🔐 SECURITY MODEL

### Multi-Tenancy
Every core entity has a `companyId` field. All queries MUST filter by `companyId` to ensure data isolation.

```typescript
// ALWAYS filter by company
const projects = await prisma.project.findMany({
    where: { companyId: user.companyId }
});
```

### Role-Based Access Control (RBAC)

| Role | Description | Typical Users |
|------|-------------|---------------|
| SUPERADMIN | Full system access | Platform owner |
| ADMIN | Full company access | Company director |
| MANAGER | Team management + approvals | Department heads |
| WORKER | Own data + assigned items | Employees |
| CLIENT | Limited read access | External clients |

#### Resource Permissions Matrix
| Resource | SUPERADMIN | ADMIN | MANAGER | WORKER | CLIENT |
|----------|------------|-------|---------|--------|--------|
| Users | CRUD | CRUD | Read | - | - |
| Projects | CRUD | CRUD | CRUD | Read+Assigned | Read+Own |
| Tasks | CRUD | CRUD | CRUD | CRUD+Assigned | Read |
| Documents | CRUD | CRUD | CRUD | CRUD+Own | Read+Shared |
| Time Entries | CRUD | CRUD | CRUD | CRUD+Own | - |
| Invoices | CRUD | CRUD | CRUD | Read | Read+Own |
| Leads | CRUD | CRUD | CRUD | CRUD+Own | - |
| Clients | CRUD | CRUD | CRUD | Read | - |
| Expenses | CRUD | CRUD | CRUD | CRUD+Own | - |
| Settings | CRUD | CRUD | Read | Read | - |
| Audit Logs | Read | Read | - | - | - |

#### Implementation Pattern
```typescript
// lib/permissions.ts
export async function checkPermission(
    userId: string,
    resource: Resource,
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
    });
    // Check role permissions against resource/action matrix
    return hasPermission(user.role, resource, action);
}

// Usage in Server Actions
export async function createProject(data: ProjectInput) {
    const session = await auth();
    const user = await getUser(session);
    
    if (!await checkPermission(user.id, 'projects', 'CREATE')) {
        throw new Error('Unauthorized');
    }
    // Proceed with creation...
}
```

### Audit Trail
All mutations are logged automatically:

```typescript
// lib/audit.ts
export async function auditCrud(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    resource: string,
    resourceId: string,
    userId: string,
    changes?: object
) {
    await prisma.auditLog.create({
        data: {
            action,
            resource,
            resourceId,
            userId,
            changes: changes ? JSON.stringify(changes) : null,
            timestamp: new Date()
        }
    });
}
```

---

## 📦 MODULE DOCUMENTATION

### 1. DASHBOARD (`/dashboard`)

**Purpose**: Central hub showing KPIs, quick actions, and activity overview.

**Current Features**:
- Welcome message with user name
- KPI cards: Active projects, pending tasks, hours this week, pending invoices
- Quick actions: New project, new task, log hours
- Recent activity timeline
- Upcoming deadlines
- Weather widget

**Data Sources**:
- Projects (active count, list)
- Tasks (pending, overdue)
- TimeEntries (week summary)
- Invoices (pending amount)
- Events (next 7 days)

**Ecosystem Connections**:
- Links to all major modules
- Deep links to specific items
- Reflects real-time changes

**Improvements Needed**:
- [ ] Customizable widget layout (drag & drop)
- [ ] Saveable dashboard configurations
- [ ] Role-specific default layouts
- [ ] More chart types
- [ ] Goal tracking widget

---

### 2. PROJECTS (`/projects`)

**Purpose**: Manage all client projects from creation to completion.

**Current Features**:
- Project list with filters (status, client, manager)
- Project detail view with tabs:
  - Overview: Basic info, progress, budget
  - Team: Assigned members
  - Tasks: Project tasks
  - Documents: Project files
  - Hours: Time logged
  - Activity: Change history
- Status workflow: DRAFT → ACTIVE → ON_HOLD → COMPLETED → CANCELLED
- Budget tracking (estimated vs actual)
- Project phases/milestones

**Data Model**:
```prisma
model Project {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  description String?
  status      ProjectStatus @default(DRAFT)
  startDate   DateTime?
  endDate     DateTime?
  budget      Float?
  clientId    String
  managerId   String
  companyId   String
  
  client      Client   @relation(...)
  manager     User     @relation(...)
  company     Company  @relation(...)
  tasks       Task[]
  documents   Document[]
  timeEntries TimeEntry[]
  events      Event[]
  team        ProjectMember[]
}
```

**Ecosystem Connections**:
- Client: Projects belong to clients
- Tasks: Tasks are organized under projects
- Documents: Files associated with project
- Time Entries: Hours logged to project
- Invoices: Billable hours → invoice lines
- Events: Meetings/deadlines linked to project

**Improvements Needed**:
- [ ] Project templates
- [ ] Gantt chart view
- [ ] Resource allocation view
- [ ] Budget alerts (80%, 100% thresholds)
- [ ] Project cloning
- [ ] Bulk operations

---

### 3. TASKS (`/tasks`)

**Purpose**: Task management with multiple views and workflow states.

**Current Features**:
- **Kanban View**: Drag & drop between columns
- **List View**: Sortable, filterable table
- **Calendar View**: Tasks by due date
- Status workflow: TODO → IN_PROGRESS → REVIEW → DONE
- Priority levels: CRITICAL, HIGH, MEDIUM, LOW
- Assignments (multiple users)
- Due dates and time estimates
- Comments and attachments
- Subtasks
- Labels/tags

**Data Model**:
```prisma
model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority @default(MEDIUM)
  dueDate     DateTime?
  estimatedHours Float?
  projectId   String
  createdById String
  assignedToId String?
  companyId   String
  
  project     Project  @relation(...)
  createdBy   User     @relation(...)
  assignedTo  User?    @relation(...)
  assignees   User[]   @relation("TaskAssignees")
  comments    Comment[]
  subtasks    Subtask[]
  labels      Label[]
  timeEntries TimeEntry[]
}
```

**State Machine**:
```typescript
const taskTransitions = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['TODO', 'REVIEW', 'DONE'],
  REVIEW: ['IN_PROGRESS', 'DONE'],
  DONE: ['TODO', 'IN_PROGRESS'] // Reopen allowed
};
```

**Ecosystem Connections**:
- Projects: Tasks belong to projects
- Users: Assignees, watchers
- Time Entries: Log hours against tasks
- Calendar: Due dates appear in calendar
- Notifications: Assignment notifications

**Improvements Needed**:
- [ ] Recurring tasks
- [ ] Task dependencies
- [ ] Time tracking directly from task card
- [ ] @mentions in comments
- [ ] Task templates
- [ ] Bulk status change
- [ ] Sprint/iteration support

---

### 4. CALENDAR (`/calendar`)

**Purpose**: Unified calendar showing events, tasks, holidays, and personal notes.

**Current Features**:
- **Views**: Month, Week, Day
- **Item Types**:
  - Events (meetings, deadlines)
  - Tasks (by due date)
  - Holidays (company-defined)
  - Personal notes (quick items)
- **Drag & Drop**: Move items between days
- **Recurring Events**: Daily, Weekly, Monthly, Yearly
- Quick add for personal notes
- Color coding by type
- **iCal Export**: Download .ics file for sync

**Data Model**:
```prisma
model Event {
  id          String   @id @default(cuid())
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime
  allDay      Boolean  @default(false)
  location    String?
  type        EventType @default(MEETING)
  recurrenceRule String? // DAILY, WEEKLY, MONTHLY, YEARLY
  userId      String
  projectId   String?
  
  user        User     @relation(...)
  project     Project? @relation(...)
  attendees   EventAttendee[]
}

model CalendarItem { // Personal notes
  id          String   @id @default(cuid())
  title       String
  description String?
  date        DateTime
  allDay      Boolean  @default(true)
  color       String?
  userId      String
}

model Holiday {
  id          String   @id @default(cuid())
  name        String
  date        DateTime
  type        String   // NATIONAL, REGIONAL, COMPANY
  year        Int
  companyId   String?
}
```

**Ecosystem Connections**:
- Tasks: Due dates shown in calendar
- Projects: Events linked to projects
- Notifications: Event reminders
- iCal: Sync with external calendars

**Improvements Needed**:
- [ ] Google Calendar sync (OAuth)
- [ ] Outlook integration
- [ ] Availability view (team)
- [ ] Room/resource booking
- [ ] Meeting scheduling with invites
- [ ] Video call integration

---

### 5. CHAT (`/chat`)

**Purpose**: Team communication with direct messages and groups.

**Current Features**:
- Direct messages (1:1)
- Group chats
- Favorites (pinned chats)
- Unread count badges
- Message search
- File sharing in messages
- Last message preview
- Online status indicators

**Data Model**:
```prisma
model Chat {
  id          String   @id @default(cuid())
  name        String?
  isGroup     Boolean  @default(false)
  companyId   String
  
  participants ChatParticipant[]
  messages    Message[]
}

model Message {
  id          String   @id @default(cuid())
  content     String
  chatId      String
  senderId    String
  createdAt   DateTime @default(now())
  
  chat        Chat     @relation(...)
  sender      User     @relation(...)
  attachments Attachment[]
}
```

**Ecosystem Connections**:
- Users: Participants, senders
- Documents: Shared files
- Notifications: New message alerts
- Projects: Project-specific group chats

**Improvements Needed**:
- [ ] @mentions with notifications
- [ ] Reactions (emojis)
- [ ] Edit/delete messages
- [ ] Threaded replies
- [ ] Voice messages
- [ ] Video calls
- [ ] Message formatting (markdown)
- [ ] Link previews

---

### 6. DOCUMENTS (`/documents`)

**Purpose**: Document management with versioning and preview.

**Current Features**:
- Folder hierarchy
- File upload with progress
- Version history
- Preview for: PDF, images, Word, Excel
- Sharing (internal, external links)
- Association with projects/clients
- Search by filename
- File size limits

**Data Model**:
```prisma
model Document {
  id          String   @id @default(cuid())
  name        String
  filename    String
  mimeType    String
  size        Int
  path        String
  folderId    String?
  projectId   String?
  clientId    String?
  uploadedById String
  companyId   String
  
  folder      Folder?  @relation(...)
  project     Project? @relation(...)
  client      Client?  @relation(...)
  uploadedBy  User     @relation(...)
  versions    DocumentVersion[]
  shares      DocumentShare[]
}

model DocumentVersion {
  id          String   @id @default(cuid())
  documentId  String
  version     Int
  filename    String
  path        String
  size        Int
  createdAt   DateTime @default(now())
  createdById String
}
```

**Ecosystem Connections**:
- Projects: Documents belong to projects
- Clients: Client-specific documents
- Chat: Share documents in messages
- Tasks: Attach documents to tasks

**Improvements Needed**:
- [ ] Full-text search (content)
- [ ] Document templates
- [ ] Collaborative editing
- [ ] Digital signatures
- [ ] OCR for scanned documents
- [ ] Expiring share links
- [ ] Document approval workflow

---

### 7. TIME TRACKING (`/hours`, `/control-horas`)

**Purpose**: Log work hours for billing and productivity tracking.

**Current Features**:
- Daily time entry form
- Project/task selection
- Notes for each entry
- Weekly/monthly summaries
- Approval workflow (PENDING → APPROVED → REJECTED)
- Export to Excel
- Manager approval dashboard
- Overtime calculation

**Data Model**:
```prisma
model TimeEntry {
  id          String   @id @default(cuid())
  date        DateTime
  hours       Float
  description String?
  status      TimeEntryStatus @default(PENDING)
  userId      String
  projectId   String
  taskId      String?
  companyId   String
  
  user        User     @relation(...)
  project     Project  @relation(...)
  task        Task?    @relation(...)
  
  approvedById String?
  approvedAt   DateTime?
  approvedBy   User?    @relation(...)
}
```

**State Machine**:
```typescript
const timeEntryTransitions = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['PENDING'], // Revert
  REJECTED: ['PENDING']  // Resubmit
};
```

**Ecosystem Connections**:
- Projects: Hours logged to projects
- Tasks: Hours linked to specific tasks
- Invoices: Approved hours → invoice lines
- Analytics: Productivity reports
- Users: Manager approvals

**Improvements Needed**:
- [ ] Timer (start/stop)
- [ ] Weekly timesheet grid
- [ ] Bulk entry
- [ ] Auto-fill from previous week
- [ ] Reminders for missing entries
- [ ] Rich activity types

---

### 8. INVOICING (`/invoices`)

**Purpose**: Create, send, and track invoices.

**Current Features**:
- Invoice creation form
- Line items (products/services)
- Tax calculation
- Status workflow: DRAFT → SENT → PAID → CANCELLED
- Auto-numbering (INV-2026-001)
- PDF generation
- Payment tracking
- Due date management

**Data Model**:
```prisma
model Invoice {
  id          String   @id @default(cuid())
  number      String   @unique
  status      InvoiceStatus @default(DRAFT)
  issueDate   DateTime
  dueDate     DateTime
  subtotal    Float
  taxAmount   Float
  total       Float
  notes       String?
  clientId    String
  projectId   String?
  companyId   String
  
  client      Client   @relation(...)
  project     Project? @relation(...)
  lines       InvoiceLine[]
  payments    Payment[]
}

model InvoiceLine {
  id          String   @id @default(cuid())
  description String
  quantity    Float
  unitPrice   Float
  taxRate     Float    @default(21)
  total       Float
  invoiceId   String
  
  invoice     Invoice  @relation(...)
}
```

**Ecosystem Connections**:
- Clients: Invoices belong to clients
- Projects: Invoice linked to project
- Time Entries: Billable hours → lines
- Quotes: Convert quote → invoice
- Payments: Track payments
- Analytics: Revenue reports

**Improvements Needed**:
- [ ] Customizable PDF templates
- [ ] Recurring invoices
- [ ] Multi-currency
- [ ] Online payment integration
- [ ] Email sending
- [ ] Credit notes
- [ ] Partial payments

---

### 9. QUOTATIONS (`/quotes`)

**Purpose**: Create and send quotes/proposals to clients.

**Current Features**:
- Quote creation form
- Line items
- Status: DRAFT → SENT → ACCEPTED → REJECTED → EXPIRED
- Validity date
- PDF generation
- Convert to invoice

**Ecosystem Connections**:
- Clients: Quotes for clients
- Leads: Quote from CRM lead
- Projects: Accepted quote → new project
- Invoices: Convert to invoice

**Improvements Needed**:
- [ ] Quote templates
- [ ] Version tracking
- [ ] Client e-signature
- [ ] Approval workflow
- [ ] Quote comparison

---

### 10. CRM (`/crm`)

**Purpose**: Lead management and sales pipeline.

**Current Features**:
- **Pipeline View**: Kanban board with stages
- Stages: NEW → CONTACTED → QUALIFIED → PROPOSAL → NEGOTIATION → WON / LOST
- Lead details: Company, contact, value, source
- Activity log (calls, emails, meetings)
- Conversion to client
- Win/loss analysis

**Data Model**:
```prisma
model Lead {
  id          String   @id @default(cuid())
  company     String
  contactName String
  contactEmail String?
  contactPhone String?
  status      LeadStatus @default(NEW)
  value       Float?
  source      String?
  notes       String?
  assignedToId String?
  companyId   String
  
  assignedTo  User?    @relation(...)
  activities  LeadActivity[]
}

model LeadActivity {
  id          String   @id @default(cuid())
  type        String   // CALL, EMAIL, MEETING, NOTE
  description String
  date        DateTime
  leadId      String
  userId      String
  
  lead        Lead     @relation(...)
  user        User     @relation(...)
}
```

**Ecosystem Connections**:
- Clients: Lead → Client conversion
- Projects: New client → new project
- Quotes: Create quote for lead
- Calendar: Schedule lead activities
- Notifications: Lead assignment alerts

**Improvements Needed**:
- [ ] Lead scoring
- [ ] Email integration
- [ ] Web form capture
- [ ] Automated follow-ups
- [ ] Sales forecasting
- [ ] Territory management

---

### 11. CLIENTS (`/admin/clients`)

**Purpose**: Client database with contacts and history.

**Current Features**:
- Client list with search/filter
- Client detail with tabs:
  - Info: Company details
  - Contacts: Multiple contacts per client
  - Projects: All projects
  - Documents: Client files
  - Invoices: Billing history
  - Activity: Interaction timeline

**Data Model**:
```prisma
model Client {
  id          String   @id @default(cuid())
  name        String
  email       String?
  phone       String?
  address     String?
  taxId       String?
  website     String?
  notes       String?
  companyId   String
  
  contacts    Contact[]
  projects    Project[]
  invoices    Invoice[]
  documents   Document[]
}

model Contact {
  id          String   @id @default(cuid())
  name        String
  email       String?
  phone       String?
  position    String?
  isPrimary   Boolean  @default(false)
  clientId    String
  
  client      Client   @relation(...)
}
```

**Ecosystem Connections**:
- Projects: Client owns projects
- Invoices: Client billing
- Documents: Client contracts
- Leads: Converted leads become clients

---

### 12. EXPENSES (`/expenses`)

**Purpose**: Track and approve employee expenses.

**Current Features**:
- Expense submission form
- Categories (travel, meals, supplies, etc.)
- Receipt upload
- Approval workflow: PENDING → APPROVED → REJECTED → PAID
- Reimbursement tracking
- Expense reports

**Ecosystem Connections**:
- Projects: Project-related expenses
- Users: Employee submissions, manager approvals
- Finance: Expense reports

---

### 13. ANALYTICS (`/analytics`)

**Purpose**: Dashboards and reports for insights.

**Current Features**:
- Productivity dashboard (hours by user, project)
- Financial dashboard (revenue, pending, overdue)
- Project health overview
- Team utilization
- Export to Excel

**Ecosystem Connections**:
- All data sources aggregated
- Real-time updates

**Improvements Needed**:
- [ ] Custom report builder
- [ ] Saved reports
- [ ] Scheduled email reports
- [ ] Drill-down capabilities
- [ ] Comparative analysis

---

### 14. NOTIFICATIONS (`/notifications`)

**Purpose**: Alert users of important events.

**Current Features**:
- Bell icon with unread count
- Notification list
- Mark as read (individual, all)
- Link to related item
- Types: Task assigned, mention, deadline, approval needed

**Ecosystem Connections**:
- Triggered by all modules
- Links to originating item

**Improvements Needed**:
- [ ] Push notifications (mobile)
- [ ] Email notifications
- [ ] Notification preferences
- [ ] Snooze/remind later
- [ ] Smart batching

---

### 15. SETTINGS (`/settings`, `/superadmin`)

**Purpose**: System configuration and administration.

**Current Features**:
- User settings: Profile, password, preferences
- Company settings: Logo, colors, info
- Holiday management
- User management (CRUD)
- Role assignment
- Audit logs view

**Improvements Needed**:
- [ ] Custom fields per module
- [ ] Workflow configuration
- [ ] Integration settings (API keys)
- [ ] Backup/restore
- [ ] Data export (GDPR)

---

## 🔄 STATE MACHINES

All major entities use validated state transitions:

### Task States
```
TODO ↔ IN_PROGRESS → REVIEW → DONE
                  ↗          ↙
              (can revert)
```

### Lead States
```
NEW → CONTACTED → QUALIFIED → PROPOSAL → NEGOTIATION → WON
                                                     ↘ LOST
```

### Invoice States
```
DRAFT → SENT → PAID
           ↘ CANCELLED
```

### Time Entry States
```
PENDING ↔ APPROVED
       ↘ REJECTED ↗
```

### Expense States
```
PENDING → APPROVED → PAID
       ↘ REJECTED
```

---

## 🎨 UI/UX PATTERNS

### Color Palette
```css
/* Primary: Olive */
--olive-50: #f7f8f4;
--olive-100: #ecf0e1;
--olive-600: #6b7c3f;
--olive-700: #5a6835;

/* Neutrals */
--neutral-50: #fafafa;
--neutral-900: #171717;

/* Status Colors */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

### Component Patterns
```tsx
// Card
<div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">

// Primary Button
<button className="bg-olive-600 text-white px-5 py-3 rounded-xl hover:bg-olive-700 transition-all shadow-lg shadow-olive-600/20 font-bold">

// Input
<input className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500" />

// Badge
<span className="px-2 py-1 text-xs font-bold rounded-full bg-olive-100 text-olive-700">
```

### Animation Patterns
```tsx
// Page transition
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 20 }}
>

// List item stagger
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: i * 0.05 }}
  >
))}
```

---

## 🛠️ DEVELOPMENT PRIORITIES

### P0 - Critical (Do First)
1. **Email Notifications**: Implement email service for task assignments, approvals, reminders
2. **@Mentions**: Add mention support in comments, chat, with notifications
3. **Recurring Tasks**: Tasks that repeat automatically
4. **Workflow Automation**: Basic if-then rules engine
5. **API REST**: Public API for integrations

### P1 - High Priority
1. **Project Templates**: Create projects from templates
2. **PDF Template Customization**: Branded invoices/quotes
3. **Financial Reports**: P&L, Balance Sheet
4. **Vacation Management**: Request and approval
5. **Mobile Responsiveness Audit**: Ensure all modules work on mobile

### P2 - Medium Priority
1. **Client Portal**: External access for clients
2. **Digital Signatures**: Sign documents electronically
3. **Custom Dashboards**: Drag-and-drop widget layout
4. **Data Import**: Migrate from Excel/other tools
5. **Gantt Chart**: Project timeline view

### P3 - Nice to Have
1. **Video Conferencing**: Integrated video calls
2. **AI Suggestions**: Smart task assignments, time estimates
3. **Mobile Apps**: Native iOS/Android
4. **Multi-language**: Full i18n support

---

## 📋 CODE CONVENTIONS

### Server Actions Template
```typescript
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/permissions';
import { auditCrud } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function createResource(data: CreateInput): Promise<Result> {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');
    
    // 2. Get user with company
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, companyId: true, role: true }
    });
    if (!user) throw new Error('User not found');
    
    // 3. Permission check
    if (!await checkPermission(user.id, 'resource', 'CREATE')) {
        throw new Error('Permission denied');
    }
    
    // 4. Business logic
    const resource = await prisma.resource.create({
        data: {
            ...data,
            companyId: user.companyId,
            createdById: user.id
        }
    });
    
    // 5. Audit log
    await auditCrud('CREATE', 'resource', resource.id, user.id);
    
    // 6. Revalidate affected paths
    revalidatePath('/resources');
    
    return resource;
}
```

### Component Template
```tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from 'lucide-react';

interface Props {
    // Define props
}

export default function ComponentName({ prop }: Props) {
    // State
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<Type | null>(null);
    
    // Effects
    useEffect(() => {
        // Fetch data
    }, [dependencies]);
    
    // Handlers
    const handleAction = async () => {
        setLoading(true);
        try {
            // Action
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    // Render
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="..."
        >
            {/* Content */}
        </motion.div>
    );
}
```

---

## 🧪 TESTING

### Run Tests
```bash
npm test           # All tests
npm run test:ui    # With UI
npm run test:coverage  # Coverage report
```

### Test Patterns
```typescript
import { describe, it, expect } from 'vitest';
import { validateTransition } from '@/lib/state-machines';

describe('TaskStateMachine', () => {
    it('should allow TODO -> IN_PROGRESS', () => {
        expect(validateTransition('task', 'TODO', 'IN_PROGRESS')).toBe(true);
    });
    
    it('should reject TODO -> DONE', () => {
        expect(validateTransition('task', 'TODO', 'DONE')).toBe(false);
    });
});
```

---

## 🚀 GETTING STARTED

```bash
# Clone and install
git clone <repo>
cd mep-projects
npm install

# Setup database
cp .env.example .env
# Edit .env with PostgreSQL connection
npm run db:push
npm run db:seed

# Run development
npm run dev
```

### Default Credentials
- **Admin**: admin@mep-projects.com / admin123
- **Worker**: alfonso.mateos@mep-projects.com / admin123

---

## 📝 WHEN IMPLEMENTING NEW FEATURES

1. **Review this document** for context
2. **Check existing patterns** in similar modules
3. **Update Prisma schema** if needed (`npx prisma db push`)
4. **Create Server Actions** with auth, permissions, audit
5. **Create UI components** following design patterns
6. **Add to navigation** if new module
7. **Write tests** for critical logic
8. **Update documentation** if significant change

---

> **Remember**: The goal is to create a cohesive ecosystem where every module enhances the others. Think about how your changes affect the whole system.
