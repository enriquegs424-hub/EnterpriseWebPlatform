# Contributing to MEP Projects

Thank you for your interest in contributing to MEP Projects ERP platform. This document provides guidelines and best practices for development.

## 🎯 Development Philosophy

1. **Professional ERP Standards**: We aim for Odoo-level quality
2. **Security First**: Multi-tenant, RBAC, audit trails are non-negotiable
3. **Type Safety**: TypeScript strict mode, no `any` types
4. **Test Critical Paths**: Business logic must have tests
5. **Documentation**: Upd ate CHANGELOG.md and task.md

## 🚀 Getting Started

### Prerequisites

- Node.js 20.16+ or 22.3+
- PostgreSQL 14+
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/mep-projects/erp.git
cd erp

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
npm run db:push
npm run db:seed

# Start development
npm run dev
```

## 📋 Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/invoice-pdf-generation
# or
git checkout -b fix/rbac-projects-missing
# or
git checkout -b refactor/datatable-component
```

### 2. Make Changes

Follow these principles:
- **One feature per branch**
- **Small, focused commits**
- **Meaningful commit messages**

### 3. Code Quality Checks

```bash
# TypeScript check
npm run type-check

# Lint
npm run lint

# Tests
npm test

# Format (when implemented)
npm run format
```

### 4. Commit Standards

```
feat: add invoice PDF generation
fix: correct RBAC check in projects
refactor: extract DataTable component
docs: update roadmap with Q1 priorities
test: add tests for state machines
chore: upgrade dependencies
```

### 5. Create Pull Request

- **Title**: Clear description of change
- **Description**: What, why, how
- **Link**: Reference issue/task number
- **Tests**: Include test evidence
- **Breaking Changes**: Document clearly

## 🏗️ Architecture Guidelines

### Multi-Tenant

**ALL** core entities must have `companyId`:

```typescript
// ✅ Correct
model Task {
  id        String   @id @default(cuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  // ... other fields
}

// ❌ Wrong - missing companyId
model Task {
  id   String @id
  name String
}
```

### RBAC

**ALL** CRUD actions must check permissions:

```typescript
// ✅ Correct
export async function deleteTask(id: string) {
  const session = await auth();
  checkPermission(session.user.role, "tasks", "delete");
  
  const task = await prisma.task.findUnique({ where: { id } });
  if (task.assignedToId !== session.user.id) {
    throw new Error("Cannot delete task assigned to another user");
  }
  
  await prisma.task.delete({ where: { id } });
  await auditCrud("DELETE", "Task", id, session.user.id);
}

// ❌ Wrong - no permission check
export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
}
```

### State Machines

**ALL** state transitions must be validated:

```typescript
// ✅ Correct
export async function updateTaskStatus(id: string, newStatus: TaskStatus) {
  const task = await prisma.task.findUnique({ where: { id } });
  
  // Validate transition
  TaskStateMachine.transition(task.status, newStatus);
  
  await prisma.task.update({
    where: { id },
    data: { status: newStatus },
  });
}

// ❌ Wrong - no validation
export async function updateTaskStatus(id: string, newStatus: TaskStatus) {
  await prisma.task.update({
    where: { id },
    data: { status: newStatus },
  });
}
```

### Audit Trail

**ALL** mutations must log:

```typescript
// ✅ Correct
export async function createInvoice(data: InvoiceData) {
  const invoice = await prisma.invoice.create({ data });
  await auditCrud("CREATE", "Invoice", invoice.id, session.user.id,  invoice);
  return invoice;
}

// ❌ Wrong - no audit
export async function createInvoice(data: InvoiceData) {
  return await prisma.invoice.create({ data });
}
```

## 📝 Coding Standards

### TypeScript

- **Strict mode**: Enabled in `tsconfig.json`
- **No  `any`**: Use `unknown` and type guards
- **Interfaces over types**: For object shapes
- **Explicit return types**: For public functions

```typescript
// ✅ Good
interface CreateTaskInput {
  name: string;
  projectId: string;
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  // implementation
}

// ❌ Bad
export async function createTask(data: any) {
  // implementation
}
```

### React Components

- **Functional components**: No class components
- **Hooks**: Use built-in hooks wisely
- **Server Components by default**: Client components only when needed
- **Props interface**: Always type props

```typescript
// ✅ Good
interface TaskCardProps {
  task: Task;
  onUpdate: (id: string) => void;
}

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
  return <div>{task.name}</div>;
}

// ❌ Bad
export default function TaskCard(props: any) {
  return <div>{props.task.name}</div>;
}
```

### Styling

- **Tailwind utility classes**: Primary styling method
- **Dark mode support**: Always include dark: variants
- **Responsive**: Mobile-first approach
- **Semantic classes**: Use design tokens when available

```tsx
// ✅ Good
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow">

// ❌ Bad
<div className="bg-white p-4" style={{borderRadius: '8px'}}>
```

## 🧪 Testing

### What to Test

**Required**:
- State machine transitions
- RBAC permission logic
- Business logic helpers
- API route validations

**Optional** (but recommended):
- UI component rendering
- Integration tests
- E2E critical flows

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('TaskStateMachine', () => {
  describe('canTransition', () => {
    it('should allow PENDING → IN_PROGRESS', () => {
      expect(TaskStateMachine.canTransition('PENDING', 'IN_PROGRESS')).toBe(true);
    });

    it('should NOT allow PENDING → COMPLETED', () => {
      expect(TaskStateMachine.canTransition('PENDING', 'COMPLETED')).toBe(false);
    });
  });
});
```

## 📚 Documentation

### Code Comments

- **Why, not what**: Explain reasoning, not obvious code
- **TODOs**: Include issue number
- **Complex logic**: Add explanation

```typescript
// ✅ Good
// We need to check ownership because WORKERs can only delete their own tasks
if (task.assignedToId !== session.user.id) {
  throw new Error("Forbidden");
}

// ❌ Bad
// Check if user is owner
if (task.assignedToId !== session.user.id) {
```

### Update Documentation

When making changes, update:
- `CHANGELOG.md` - Version history
- `ROADMAP_TRACKING.md` - Progress tracker (if milestone reached)
- `task.md` artifact - Mark tasks as complete
- README.md - If API/setup changes

## 🚫 Common Mistakes

### ❌ Forgetting companyId Filter

```typescript
// WRONG - leaks data across companies!
const tasks = await prisma.task.findMany();

// CORRECT
const tasks = await prisma.task.findMany({
  where: { companyId: session.user.companyId }
});
```

### ❌ Skipping Permission Check

```typescript
// WRONG - security hole!
export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
}

// CORRECT
export async function deleteProject(id: string) {
  checkPermission(session.user.role, "projects", "delete");
  await prisma.project.delete({ where: { id } });
}
```

### ❌ Invalid State Transition

```typescript
// WRONG - breaks business rules!
await prisma.invoice.update({
  where: { id },
  data: { status: newStatus }
});

// CORRECT
InvoiceStateMachine.transition(invoice.status, newStatus);
await prisma.invoice.update({
  where: { id },
  data: { status: newStatus }
});
```

## 🔧 Tools & Utilities

### Available Helpers

```typescript
// Permissions
import { checkPermission, hasPermission } from '@/lib/permissions';

// State validation
import { TaskStateMachine, InvoiceStateMachine } from '@/lib/state-machine';

// Audit logging
import { auditCrud } from '@/lib/permissions';

// Rate limiting
import { withRateLimit } from '@/lib/with-rate-limit';
```

## 📦 Dependencies

### Adding New Dependencies

1. **Justify**: Why is this needed?
2. **Bundle size**: Check impact with `npm size <package>`
3. **Alternatives**: Consider existing solutions
4. **Security**: Check with `npm audit`

### Approval Required

- Database libraries (we use Prisma)
- UI libraries (we use Tailwind + Lucide)
- State management (we use React state + Server Actions)

## 🐛 Bug Reports

### Good Bug Report

```
**Title**: Invoice PDF generation fails for items with 0 tax

**Environment**: Production, Chrome 120
**Role**: MANAGER

**Steps to Reproduce**:
1. Create invoice with 3 items
2. Set tax rate to 0% on one item
3. Click "Download PDF"

**Expected**: PDF downloads
**Actual**: Error "Cannot divide by zero"

**Logs**:
```
[Error] PDF generation failed...
```

**Screenshot**: [attach]
```

## 📞 Getting Help

- **Questions**: Open discussion in GitHub
- **Bugs**: Create issue with template
- **Features**: Propose in ROADMAP_TRACKING.md
- **Urgent**: Contact maintainers directly

---

**Last Updated**: 2026-01-09  
**Maintainer**: MEP Projects Team
