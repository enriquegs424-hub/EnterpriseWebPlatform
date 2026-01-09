# MEP Projects - Enterprise ERP Platform

Modern enterprise resource planning (ERP) platform built with Next.js, TypeScript, and PostgreSQL. Designed for professional services companies requiring project management, CRM, finance, and HR capabilities.

## 🎯 Vision

Build a comprehensive ERP system with **Odoo-level functionality and professionalism**, featuring full multi-tenant support, granular permissions (RBAC), complete audit trails, and automated business workflows.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000`
- **Admin**: admin@mep-projects.com / admin123

## 📚 Documentation

- **[Architecture](./ARCHITECTURE.md)** - System design, stack, decisions
- **[Roadmap](./ROADMAP_TRACKING.md)** - Live tracker, priorities, progress
- **[Backlog](./BACKLOG_EXECUTABLE.md)** - Actionable tasks with DoD
- **[Changelog](./CHANGELOG.md)** - Version history
- **[Contributing](./CONTRIBUTING.md)** - Development guidelines

## ✨ Core Features

### Security & Access Control
- ✅ **Multi-tenant**: Company-level data isolation
- ✅ **RBAC**: 4 roles (ADMIN, MANAGER, WORKER, CLIENT) × 11 resources
- ✅ **Proxy middleware**: Global route protection (Next.js 16)
- ✅ **Rate limiting**: API abuse prevention
- ✅ **Audit trail**: Automatic CRUD logging

### Business Modules
- ✅ **Projects**: With tasks, documents, events
- ✅ **CRM**: Lead pipeline (NEW → QUALIFIED → PROPOSAL → NEGOTIATION → CLOSED)
- ✅ **Tasks**: Kanban, list, calendar views
- ✅ **Time Tracking**: Daily entry + approval workflow
- ✅ **Expenses**: Approval flow (PENDING → APPROVED → PAID)
- ✅ **Invoices**: Auto-numbering, payment tracking, status flow
- ✅ **Documents**: Versioning, sharing
- ✅ **Calendar**: Events, scheduling
- ✅ **Chat**: Team communications
- ✅ **Analytics**: Dashboards, reports

### State Management
- ✅ **State machines**: Validated transitions for Tasks, Leads, Expenses, Invoices, TimeEntries
- ✅ **Workflow validation**: Invalid state changes blocked automatically

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16.1, React 19, Tailwind CSS 4 |
| **Backend** | Next.js Server Actions, Prisma ORM 5.22 |
| **Database** | PostgreSQL |
| **Auth** | NextAuth 5 beta (JWT + session) |
| **Testing** | Vitest 4.0 (30 tests passing) |
| **Deployment** | Docker Compose |

## 📊 Project Status

| Module | Backend | UI | RBAC | State | Audit | Tests | Status |
|--------|---------|-----|------|-------|-------|-------|--------|
| Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| Expenses | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| Leads | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| Clients | ✅ | ✅ | ✅ | - | ✅ | - | 90% |
| Invoices | ✅ | 🟡 | ✅ | ✅ | ✅ | ✅ | 85% |
| Projects | ✅ | ✅ | 🟡 | - | 🟡 | - | 70% |
| Documents | ✅ | ✅ | 🟡 | - | 🟡 | - | 70% |
| Hours | ✅ | ✅ | 🟡 | 🟡 | 🟡 | - | 75% |

**Overall Progress**: 85% core functionality complete

## 🎯 Current Priorities (P0)

1. **Invoice creation form** - Backend ready, needs dynamic line items UI
2. **Invoice PDF generation** - jsPDF installed, implement template
3. **DataTable generic component** - Reusable across all modules
4. **ESLint + Prettier strict** - Code quality enforcement
5. **RBAC application** - Complete for Projects, Documents, Hours

See [BACKLOG_EXECUTABLE.md](./BACKLOG_EXECUTABLE.md) for full task list.

## 📝 Development Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm run start            # Start production server

# Database
npm run db:push          # Apply schema changes
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset + reseed database

# Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript check
npm test                 # Run tests (30 tests)
npm run test:ui          # Test UI
npm run test:coverage    # Coverage report
```

## 🔧 Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/mepprojects"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Optional
REDIS_URL=""              # For rate limiting (production)
SMTP_HOST=""              # For email automation
SMTP_USER=""
SMTP_PASS=""
```

## 🏢 Architecture Principles

1. **Multi-tenant first**: All core entities have `companyId`
2. **RBAC mandatory**: No CRUD without `checkPermission()`
3. **Audit trail systematic**: Every mutation logs via `auditCrud()`
4. **State validation**: Business logic uses state machines
5. **Security multi-layer**: Proxy + RBAC + state + rate limit
6. **Type-safe strict**: No `any` types allowed
7. **Database-first**: Prisma schema is source of truth
8. **Server-side logic**: Critical business logic never in client
9. **Test critical paths**: State machines and permissions covered

## 🐳 Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# With UI
npm run test:ui

# Coverage report
npm run test:coverage
```

**Current Coverage**:
- State Machine: 30 tests ✅
- Permissions: Tests pending
- Actions: Tests pending

## 📈 Roadmap to Odoo Parity

### Completed ✅
- Multi-tenant architecture
- RBAC system
- State machines
- Core modules (Tasks, CRM, Expenses, Invoices)
- Audit trail
- Rate limiting

### In Progress 🟡
- Invoice form + PDF
- DataTable component
- Full RBAC coverage
- CI/CD pipeline

### Planned 📋
- Products/Services catalog
- Tax management UI
- Financial reports (P&L, Balance Sheet)
- EventBus for automations
- Notification rules engine
- Webhooks outbound
- REST API v1
- Module system

See [ROADMAP_TRACKING.md](./ROADMAP_TRACKING.md) for detailed progress.

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Run `npm run lint` before commit
3. Add tests for new features
4. Update CHANGELOG.md
5. Document breaking changes

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📄 License

Proprietary - MEP Projects S.L.

## 🆘 Support

- **Issues**: Create GitHub issue
- **Docs**: Check documentation folder
- **Troubleshooting**: See `_legacy/docs/TROUBLESHOOTING.md`

---

**Last Updated**: 2026-01-09  
**Version**: 1.0.0-beta  
**Status**: 🚀 Production Ready (Core Modules)
