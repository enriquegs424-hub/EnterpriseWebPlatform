# MEP Projects - Roadmap ERP

> **Documento de seguimiento vivo** - Actualizar con cada cambio significativo

---

## A) Visión del Producto

MEP Projects es una plataforma ERP web destinada a empresas de ingeniería y arquitectura. El objetivo es evolucionar desde la gestión actual de horas/proyectos/tareas hacia un ERP completo comparable a Odoo, con módulos de CRM, finanzas básicas, documentos, automatizaciones y un sistema granular de roles/permisos.

La plataforma debe ser **multiempresa** (multi-tenant), con **auditoría completa** de acciones, **estados de flujo** encadenados (leads → propuestas → facturas → pagos), y **extensible** mediante módulos desacoplados.

---

## B) Arquitectura Actual (según el repo)

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 16)                  │
├─────────────────────────────────────────────────────────────┤
│  App Router (src/app)         │  Components (src/components)│
│  ├── (protected)/             │  ├── layout/ (Sidebar, etc) │
│  │   ├── dashboard/           │  ├── dashboard/             │
│  │   ├── tasks/               │  ├── tasks/                 │
│  │   ├── hours/               │  ├── hours/                 │
│  │   ├── chat/                │  ├── chat/                  │
│  │   ├── documents/           │  ├── documents/             │
│  │   ├── crm/                 │  ├── crm/                   │
│  │   ├── expenses/            │  ├── expenses/              │
│  │   ├── calendar/            │  ├── calendar/              │
│  │   ├── analytics/           │  ├── analytics/             │
│  │   ├── notifications/       │  └── ui/                    │
│  │   ├── projects/            │                             │
│  │   ├── settings/            │                             │
│  │   └── admin/               │                             │
│  ├── api/ (routes)            │                             │
│  └── login/                   │                             │
├─────────────────────────────────────────────────────────────┤
│                      AUTH (NextAuth 5 beta)                 │
│  - JWT strategy con role básico                             │
│  - auth.config.ts (protege solo /dashboard, /hours, /admin) │
│  - ⚠️ SIN middleware.ts real                                │
├─────────────────────────────────────────────────────────────┤
│                      DATABASE (PostgreSQL + Prisma)         │
│  Modelos: User, Project, Client, Lead, TimeEntry, Task,     │
│           Document, Chat, Message, Event, Expense,          │
│           ActivityLog, Team, SystemSetting                  │
│  - ⚠️ Sin modelo Company/Tenant                             │
│  - ⚠️ Sin modelo Permission/Role granular                   │
│  - ⚠️ Sin modelo Invoice/Payment                            │
└─────────────────────────────────────────────────────────────┘
```

**Tech Stack:**
- Next.js 16.1.1 + React 19
- Tailwind CSS 4 + Framer Motion
- Prisma 5.22 + PostgreSQL
- NextAuth 5 beta (JWT)
- Zod, react-hook-form, date-fns

---

## C) Principios del Proyecto (reglas innegociables)

1. **Multiempresa (Multi-tenant)**: Todo dato debe pertenecer a un `companyId`. Sin excepción.
2. **Permisos granulares (RBAC)**: Modelo Permission + RolePermission. Verificar en cada acción.
3. **Auditoría completa**: Toda acción CRUD debe crear un ActivityLog con userId, entityType, entityId, action, changes.
4. **Estados y transiciones**: Leads, Tasks, Expenses, Invoices deben tener máquina de estados validada.
5. **API-first**: Toda lógica de negocio en server actions/API routes, no en componentes.
6. **Type-safe**: Todo tipado con TypeScript estricto + Zod en inputs.
7. **Temas consistentes**: Sistema de Design Tokens centralizado (ya implementado en globals.css).

---

## D) Roadmap Estructural (por dependencias)

```
FASE 0: Fundamentos (bloquea todo)
├── Middleware de protección de rutas
├── Sistema de permisos (RBAC)
├── Modelo Company (multi-tenant)
└── Tests unitarios base

FASE 1: Core ERP (bloquea módulos de negocio)
├── Migrar datos a multi-tenant
├── Permisos en todas las acciones
├── Auditoría completa
└── Máquina de estados genérica

FASE 2: Módulos de Negocio (paralelos)
├── CRM (leads → oportunidades → clientes)
├── Proyectos (presupuestos → ejecución)
├── Horas (entrada → aprobación → facturación)
└── Documentos (versionado, permisos)

FASE 3: Finanzas Básicas (requiere Fase 2)
├── Modelo Invoice + items
├── Modelo Payment
├── Plan contable mínimo
├── Impuestos básicos (IVA)
└── Reportes financieros

FASE 4: Automatizaciones (requiere Fase 1-2)
├── Triggers de eventos
├── Reglas de negocio configurables
├── Notificaciones automatizadas
└── Flujos de aprobación

FASE 5: UX ERP avanzada
├── Acciones masivas
├── Filtros guardados
├── Exports (PDF, Excel)
└── Dashboards configurables
```

---

## E) Checklist por Bloques

| Bloque | Estado | Notas |
|--------|--------|-------|
| **Documentación** | ✅ Existe | Muchos .md pero fragmentados, necesitan consolidar |
| **Scripts dev** | ⚠️ Existe parcialmente | db:push, db:seed, pero no tests ni pre-commit |
| **CI/CD** | ❌ No existe | Sin GitHub Actions, sin deploy automatizado |
| **Auth básica** | ✅ Funciona | JWT + Credentials, role en token |
| **Middleware rutas** | ❌ No existe | auth.config insuficiente, falta middleware.ts |
| **Permisos (RBAC)** | ❌ No existe | Solo role enum (ADMIN/MANAGER/WORKER/CLIENT) |
| **Multi-company** | ❌ No existe | Sin modelo Company, sin companyId en entidades |
| **Auditoría** | ⚠️ Existe pero débil | ActivityLog existe pero no se usa sistemáticamente |
| **Users** | ✅ Funciona | CRUD completo con admin |
| **Projects** | ✅ Funciona | CRUD con clientId opcional |
| **Clients** | ✅ Funciona | CRUD con contacts |
| **Leads/CRM** | ⚠️ Existe pero débil | Stage enum, sin pipeline visual robusto |
| **Tasks** | ✅ Funciona | CRUD con comments, estados |
| **Time Entries** | ✅ Funciona | Registro diario, summary, aprobación parcial |
| **Documents** | ✅ Funciona | Upload, folders, sharing básico |
| **Chat** | ✅ Funciona | Messages, rooms, mentions |
| **Calendar** | ✅ Funciona | Events con attendees |
| **Expenses** | ⚠️ Existe pero débil | CRUD básico, sin flujo aprobación real |
| **Invoices** | ❌ No existe | No hay modelo ni UI |
| **Payments** | ❌ No existe | No hay modelo ni UI |
| **State machines** | ❌ No existe | Estados hardcoded sin transiciones validadas |
| **Automatizaciones** | ❌ No existe | Sin triggers ni reglas |
| **Rate limiting** | ❌ No existe | APIs abiertas |
| **Tests** | ❌ No existe | Cero tests |

---

## F) Siguiente Paso Lógico

> **PRIORIDAD MÁXIMA**: Crear `middleware.ts` para proteger TODAS las rutas protegidas, no solo las 3 actuales.

Después:
1. Crear modelo `Permission` + `RolePermission` 
2. Crear hook `usePermission()` y HOC `withPermission()`
3. Implementar verificación en server actions

---

## G) Riesgos y Deuda Técnica

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Sin middleware = rutas desprotegidas | 🔴 CRÍTICO | Crear middleware.ts AHORA |
| Sin tests = regresiones silenciosas | 🔴 CRÍTICO | Añadir tests en cada feature nueva |
| Sin multi-tenant = imposible escalar | 🟠 ALTO | Añadir companyId antes de más features |
| AuthConfig protege solo 3 rutas | 🟠 ALTO | Middleware protege todo /app/(protected) |
| Muchos .md duplicados/obsoletos | 🟡 MEDIO | Consolidar en este README único |
| Dark mode parcheado fragmentado | 🟡 MEDIO | Migrar todo a Design Tokens (en progreso) |
| Console.logs en producción | 🟡 MEDIO | Reemplazar con logger condicional |
| Sin validación de estados | 🟠 ALTO | Crear StateManager antes de Invoices |

---

## H) Registro de Cambios

| Fecha | Cambio | Archivos | Motivo |
|-------|--------|----------|--------|
| 2026-01-09 | **[P1] Invoice CRUD actions** | invoices/actions.ts | CRUD completo + payments + auto-numbering |
| 2026-01-09 | **[P1] Invoice Module** | schema.prisma | Modelos Invoice, InvoiceItem, Payment |
| 2026-01-09 | **[P0] Rate Limiting APIs** | rate-limit.ts, with-rate-limit.ts, api routes | Proteger APIs de abuso |
| 2026-01-09 | **[P0] Multi-tenant (Company)** | schema.prisma, seed.ts | Modelo Company + companyId en entidades |
| 2026-01-08 | **[P0] Middleware de protección** | src/middleware.ts | Proteger todas las rutas /(protected) |
| 2026-01-08 | **[P0] Sistema RBAC** | src/lib/permissions.ts | Permisos granulares + auditoría |
| 2026-01-08 | **[P0] StateManager** | src/lib/state-machine.ts | Transiciones de estado validadas |
| 2026-01-08 | **[P0] Tasks con audit/states** | tasks/actions.ts | Validar estados + log CRUD |
| 2026-01-08 | Dark mode: Design Token System | globals.css, 10+ componentes | Centralizar theming |
| 2026-01-08 | CRM añadido a Sidebar | Sidebar.tsx | Accesibilidad módulo |
| 2026-01-08 | UserMenu dark mode | UserMenu.tsx | Fix dropdown blanco |
| 2026-01-08 | Message.tsx dark mode | Message.tsx | Fix texto invisible en chat |
| 2026-01-08 | DocumentsView dark mode | DocumentsView.tsx | Fix cards blancas |
| 2026-01-08 | Auditoría ERP completa | ROADMAP_ERP.md, BACKLOG_ERP.md | Documentar estado real |

