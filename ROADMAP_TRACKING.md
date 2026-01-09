# ME Projects - ERP Platform Tracker

## A) Visión del Producto

**MEP Projects** es una plataforma integral de gestión empresarial (ERP) diseñada para empresas de servicios profesionales. El objetivo es alcanzar paridad funcional con soluciones como Odoo, proporcionando gestión de proyectos, clientes, finanzas, recursos humanos y automatizaciones en una plataforma unificada multi-empresa. La arquitectura prioriza seguridad granular (RBAC), trazabilidad completa (audit trail), validación de flujos de negocio (state machines) y escalabilidad (multi-tenant).

## B) Arquitectura Actual

**Stack Tecnológico**:
- Frontend: Next.js 16.1 (App Router + Turbopack), React 19, Tailwind CSS 4
- Backend: Next.js API Routes (Server Actions), Prisma ORM 5.22
- Base de Datos: PostgreSQL
- Autenticación: NextAuth 5 beta (JWT + session)
- Testing: Vitest 4.0 con ESM
- Deployment: Docker-compose

**Decisiones Arquitectónicas Clave**:
- **Proxy-based middleware** (Next.js 16): Protección global de rutas `/(protected)`
- **Server Actions over REST**: Menos boilerplate, type-safe
- **RBAC custom**: Matriz de permisos en código (no DB tables)
- **State Machines**: Validación preventiva de transiciones de estado
- **In-memory rate limiting**: Sin Redis (simplicidad > escalabilidad horizontal)
- **Multi-tenant**: Company model con `companyId` en entidades principales

**Estructura Modular**:
```
src/app/(protected)/
├── admin/        - Panel administrativo
├── dashboard/    - Dashboard principal
├── projects/     - Gestión de proyectos
├── tasks/        - Tareas (lista/kanban/calendar)
├── hours/        - Registro de horas
├── expenses/     - Gestión de gastos
├── crm/          - CRM (leads/clients)
├── invoices/     - Facturación
├── documents/    - Gestión documental
├── chat/         - Comunicaciones
├── calendar/     - Calendario de eventos
├── analytics/    - Analytics e informes
└── settings/     - Configuración de usuario
```

---

## C) Principios del Proyecto (Innegociables)

1. **Multi-tenant desde el inicio**: Toda entidad core tiene `companyId`
2. **RBAC obligatorio**: Ningún CRUD sin `checkPermission()`
3. **Audit trail sistemático**: Toda mutación loguea con `auditCrud()`
4. **State machines validados**: Estados transicionan solo si es válido
5. **Security multi-capa**: Proxy + RBAC + state + rate limit
6. **Type-safety estricto**: TypeScript strict mode, sin `any`
7. **Database-first**: Prisma schema es fuente de verdad
8. **Server-side primero**: Lógica crítica nunca en cliente
9. **Testing de reglas críticas**: State machines y permissions tienen tests
10. **Documentación viva**: README se actualiza con cada cambio significativo

---

## D) Roadmap Estructural (Sin Tiempos)

### Fase 0: Fundamentos
- [x] Setup inicial (Next.js + Prisma + NextAuth)
- [x] Docker environment
- [x] Basic auth flow
- [ ] ESLint + Prettier estrictos
- [ ] CI/CD pipeline (GitHub Actions)

### Fase 1: Core ERP
- [x] Company model (multi-tenant)
- [x] RBAC system (`permissions.ts`)
- [x] State Machine (`state-machine.ts`)
- [x] Middleware/Proxy protection
- [x] Rate limiting
- [x] Audit logging framework
- [ ] Permission model en DB (opcional)

### Fase 2: Módulos Base
- [x] Users CRUD
- [x] Projects CRUD
- [x] Clients CRUD
- [x] Tasks CRUD + states
- [x] Hours tracking
- [x] Expenses CRUD + approval
- [x] CRM (Leads pipeline)
- [x] Documents management
- [ ] Products/Services catalog

### Fase 3: Finanzas
- [x] Invoice model + CRUD
- [x] Invoice UI (list + detail)
- [x] Payment tracking
- [ ] Invoice creation form
- [ ] PDF generation
- [ ] Tax management
- [ ] Basic accounting (plan contable)

### Fase 4: Automatizaciones
- [ ] EventBus/trigger system
- [ ] Notification rules
- [ ] Workflow engine
- [ ] Email automation

### Fase 5: UX Avanzada
- [ ] Acciones masivas en tablas
- [ ] Filtros avanzados guardables
- [ ] Dashboard configurableStep Id: 4445
- [ ] Export PDF/Excel global
- [ ] Kanban drag & drop persistence

### Fase 6: Extensibilidad
- [ ] Module system
- [ ] Webhooks outbound
- [ ] REST API pública (v1)
- [ ] Plugin architecture

---

## E) Checklist por Bloques

### Base del Proyecto
- [x] **Documentación**: README, ROADMAP, múltiples guides (⚠️ Exceso de docs)
- [x] **Scripts de desarrollo**: start.bat, setup-github.bat
- [x] **Docker**: docker-compose.yml configurado
- [🟡] **Env management**: .env.example existe, variables not documented
- [❌] **ESLint/Prettier**: Configuración básica, no estricta
- [❌] **Pre-commit hooks**: No existen (Husky not configured)
- [❌] **CI/CD**: No hay GitHub Actions

**Estado**: **Existe parcialmente**

### Core ERP
- [x] **Multi-tenant**: Company model implementado
- [x] **RBAC**: Sistema completo en `permissions.ts`
- [x] **Audit trail**: `auditCrud()` helper, usado en 3 módulos
- [x] **State machines**: Sistema genérico implementado
- [🟡] **Session management**: NextAuth básico, no hay session tracking
- [❌] **2FA**: No implementado

**Estado**: **Existe y funciona correctamente**

### Modelo de Datos
- [x] **Clients**: Model completo + UI
- [x] **Projects**: Model completo + UI
- [x] **Tasks**: Model completo + UI
- [x] **Users**: Model completo + UI
- [x] **TimeEntry**: Model completo + UI
- [x] **Expenses**: Model completo + UI + approval
- [x] **Leads**: Model completo + UI + pipeline
- [x] **Invoices**: Model + CRUD + UI
- [x] **Payments**: Model + tracking
- [❌] **Products/Services**: No existe
- [❌] **Suppliers**: No existe
- [❌] **Contracts**: No existe

**Estado**: **Existe y funciona correctamente** (para entidades core)

### Flujos de Negocio
- [x] **Task states**: PENDING → IN_PROGRESS → COMPLETED
- [x] **Lead pipeline**: NEW → QUALIFIED → PROPOSAL → NEGOTIATION → CLOSED
- [x] **Expense approval**: PENDING → APPROVED/REJECTED → PAID
- [x] **Invoice lifecycle**: DRAFT → SENT → PAID/OVERDUE
- [🟡] **TimeEntry approval**: Estados definidos, no aplicados
- [❌] **Purchase orders**: No existe
- [❌] **Contracts workflow**: No existe

**Estado**: **Existe y funciona correctamente**

### Finanzas
- [x] **Invoices**: CRUD + auto-numeración + UI
- [x] **Payments**: Tracking + balance calculation
- [🟡] **Tax rates**: Hardcoded 21%, no management UI
- [❌] **Invoice PDF**: jsPDF instalado, no implementado
- [❌] **Plan contable**: No existe
- [❌] **Bank reconciliation**: No existe
- [❌] **Financial reports**: No existen

**Estado**: **Existe parcialmente**

### Automatizaciones
- [❌] **EventBus**: No existe
- [❌] **Notification rules**: Notificaciones manuales
- [❌] **Scheduled jobs**: No existen
- [❌] **Email automation**: No existe
- [❌] **Webhooks**: No existen

**Estado**: **No existe**

### Seguridad
- [x] **Route protection**: Proxy middleware global
- [x] **RBAC**: Sistema completo y aplicado
- [x] **Rate limiting**: 100 req/min en APIs
- [x] **Audit logging**: Implementado sistemáticamente
- [🟡] **Session management**: Básico, sin multi-device tracking
- [❌] **2FA**: No implementado
- [❌] **IP whitelisting**: No existe
- [❌] **Encryption at rest**: No implementado

**Estado**: **Existe y funciona correctamente**

### UX ERP
- [x] **Tablas**: Implementadas en todos los módulos
- [🟡] **Filtros**: Básicos, no guardables
- [❌] **Acciones masivas**: No implementadas
- [🟡] **Export**: jsPDF instalado, no global
- [🟡] **Dashboards**: Fijos, no configurables
- [🟡] **Search**: Global básico
- [❌] **Shortcuts de teclado**: No documentados

**Estado**: **Existe pero es débil**

### Extensibilidad
- [❌] **Module system**: Todo acoplado
- [❌] **Webhooks outbound**: No existe
- [❌] **REST API pública**: Solo internal APIs
- [❌] **Plugin architecture**: No existe

**Estado**: **No existe**

---

## F) Siguiente Paso Lógico

**Prioridad máxima** (P0 bloqueantes):

1. **Consolidar documentación** - 40+ MD files, muchos duplicados/contradictorios
2. **ESLint + Prettier strict** - Code quality baseline
3. **Tests setup** - Solo 30 tests state-machine, falta coverage de actions

**Prioridad alta** (P1 desbloqueantes):

4. **Invoice creation form** - Backend listo, falta UI
5. **PDF generation** - jsPDF ya instalado
6. **TimeEntry approval flow** - Estados definidos, falta aplicar
7. **Aplicar RBAC a módulos restantes** - Projects, Documents, Hours actions

---

## G) Riesgos y Deuda Técnica

### Riesgos Críticos

| Riesgo | Severidad | Impacto |
|--------|-----------|---------|
| **40+ archivos .md duplicados/desactualizados** | 🔴 Alta | Confusión, info incorrecta |
| **Next.js 16 + NextAuth 5 beta incompatibilidad** | 🔴 Alta | Build failures posibles |
| **In-memory rate limiter** | 🟡 Media | No escala multi-server |
| **No CI/CD** | 🟡 Media | Errores en producción |
| **Type: module rompe algunos imports** | 🟡 Media | Import errors intermitentes |
| **RBAC solo en código** | 🟡 Media | No configurable por admin |

### Deuda Técnica

**Alta prioridad**:
- Consolidar docs (40+ → 5 archivos)
- Migrar de in-memory a Redis rate limiter
- Implementar error boundaries en UI
- Centralizar queries con `companyId` filter
- Logging estructurado (Winston/Pino)

**Media prioridad**:
- Convertir RBAC a DB tables
- DataTable component genérico
- Form validation centralizada (Zod schemas)
- API versioning (/api/v1)
- Responsive design audit

**Baja prioridad**:
- i18n support
- Theme customization per company
- Advanced caching strategy
- WebSocket para real-time

### Decisiones Cuestionables

1. **Type: "module" en package.json**: Rompe algunos Node.js scripts, necesario para Vitest
2. **RBAC hardcoded**: Flexible para dev, pero no configurable en producción
3. **40+ markdown files**: Documentation hell
4. **State machines en código**: Correcto, pero falta UI para visualizar flows
5. **NextAuth 5 beta**: Bleeding edge, puede romper con updates

---

## H) Registro de Cambios

| Fecha | Cambio | Archivos | Motivo |
|-------|--------|----------|--------|
| 2026-01-09 | **[CRITICAL] proxy.ts migration** | src/middleware.ts → src/proxy.ts | Next.js 16 requirement |
| 2026-01-09 | **[P0] Testing infrastructure** | vitest.config, tests/* | Validate critical logic (30 tests passing) |
| 2026-01-09 | **[P1] Invoice UI complete** | invoices/page.tsx, invoices/[id]/page.tsx | Full UI (list + detail) |
| 2026-01-09 | **[P1] Invoice CRUD actions** | invoices/actions.ts | Auto-numbering + payments |
| 2026-01-09 | **[P0] Rate Limiting APIs** | rate-limit.ts, with-rate-limit.ts, api routes | Protect APIs abuse |
| 2026-01-09 | **[P0] Multi-tenant (Company)** | schema.prisma, seed.ts | Company model + companyId in 6 entities |
| 2026-01-08 | **[P0] Middleware protection** | src/proxy.ts (was middleware.ts) | Protect all /(protected) routes |
| 2026-01-08 | **[P0] RBAC system** | src/lib/permissions.ts | Granular permissions + audit |
| 2026-01-08 | **[P0] StateManager** | src/lib/state-machine.ts | State transition validation |
| 2026-01-08 | **[P0] Tasks RBAC+states+audit** | tasks/actions.ts | Validate states + log CRUD |

---

**Última actualización**: 2026-01-09  
**Mantenedor**: Actualizar este README con cada cambio significativo  
**Próxima revisión**: Antes de siguiente feature major
