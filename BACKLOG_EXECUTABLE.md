# BACKLOG ERP - Tareas Ejecutables

> **Basado en**: Auditoría real del código (2026-01-09)  
> **Fuente de verdad**: Repositorio actual after 5.5h development session

---

## EPIC 0: Base del Proyecto y DX

### [P0] Consolidar documentación duplicada
- **Tipo**: Refactor / Docs
- **Dependencias**: Ninguna
- **Qué hay ahora**: 40+ archivos .md con info duplicada/contradictoria
- **Qué falta**: Estructura clara: 1 README, 1 ROADMAP, 1 CHANGELOG, 1 CONTRIBUTING, 1 ARCHITECTURE
- **Criterios de aceptación**:
  - Máximo 5 archivos MD en root
  - Mover documentos legacy a `_legacy/docs/`
  - README principal con links a docs específicas
  - No duplicar información entre archivos
- **DoD**:
  - [ ] Solo existen: README.md, ROADMAP_TRACKING.md, CHANGELOG.md, CONTRIBUTING.md, ARCHITECTURE.md
  - [ ] Todos los demás .md movidos a `_legacy/docs/`
  - [ ] README actualizado con TOC y links
- **Cómo verificar**: `ls *.md | wc -l` devuelve ≤ 5
- **Archivos implicados**: Root .md files → `_legacy/docs/`

### [P0] ESLint + Prettier estrictos
- **Tipo**: DevOps / DX
- **Dependencias**: Ninguna
- **Qué hay ahora**: `eslint.config.mjs` básico, Prettier no configurado
- **Qué falta**: Rules estrictas, Prettier con auto-format, pre-commit hook
- **Criterios de aceptación**:
  - ESLint con rules estrictas (no unused vars, no any, etc.)
  - Prettier configurado (.prettierrc)
  - Husky + lint-staged en pre-commit
  - `npm run lint` pasa sin warnings
- **DoD**:
  - [ ] `.eslintrc` con reglas estrictas
  - [ ] `.prettierrc` creado
  - [ ] Husky instalado y configurado
  - [ ] `npm run lint:fix` formatea todo
- **Cómo verificar**: `npm run lint` no muestra warnings
- **Archivos implicados**: `.eslintrc`, `.prettierrc`, `package.json`, `.husky/`

### [P1] CI/CD pipeline (GitHub Actions)
- **Tipo**: DevOps
- **Dependencias**: ESLint + Prettier estrictos
- **Qué hay ahora**: No existe
- **Qué falta**: Pipeline básico: lint → type-check → test → build
- **Criterios de aceptación**:
  - Workflow `.github/workflows/ci.yml`
  - Runs on: push to main, pull requests
  - Steps: install → lint → type-check → vitest → build
  - Fail pipeline si algún step falla
- **DoD**:
  - [ ] `.github/workflows/ci.yml` existe
  - [ ] Pipeline corre en PRs
  - [ ] Badge en README mostrando status
- **Cómo verificar**: Push to branch, ver Actions tab en GitHub
- **Archivos implicados**: `.github/workflows/ci.yml`, `README.md` (badge)

### [P2] Pre-commit hooks completos
- **Tipo**: DevOps / DX
- **Dependencias**: ESLint + Prettier
- **Qué hay ahora**: No existen
- **Qué falta**: Lint-staged en pre-commit
- **Criterios de aceptación**:
  - Husky instalado
  - Pre-commit: lint-staged → eslint + prettier
  - Pre-push: type-check + tests
- **DoD**:
  - [ ] `.husky/pre-commit` corre lint-staged
  - [ ] `.husky/pre-push` corre tsc + vitest
  - [ ] Commits bloqueados si lint falla
- **Cómo verificar**: Intentar commit con error de lint, debe fallar
- **Archivos implicados**: `.husky/`, `package.json`

---

## EPIC 1: Core ERP

### [P1] Permission model en DB (opcional)
- **Tipo**: Feature / Refactor
- **Dependencias**: Ninguna (actual sistema funciona)
- **Qué hay ahora**: RBAC hardcoded en `permissions.ts`
- **Qué falta**: Modelo en Prisma para permisos configurables
- **Criterios de aceptación**:
  - Models: `Role`, `Resource`, `Permission` (role + resource + action)
  - Seed con permisos actuales
  - Migración suave: fallback a código si DB está vacía
  - UI admin para editar permisos
- **DoD**:
  - [ ] Schema actualizado con Permission model
  - [ ] `checkPermission()` lee de DB
  - [ ] Seed pobla permisos actuales
  - [ ] 0 breaking changes en código existente
- **Cómo verificar**: Cambiar permiso en DB, validar que `checkPermission()` respeta cambio
- **Archivos implicados**: `schema.prisma`, `seed.ts`, `permissions.ts`, `admin/roles/`

### [P1] Session tracking multi-device
- **Tipo**: Feature (Security)
- **Dependencias**: Ninguna
- **Qué hay ahora**: NextAuth básico, no trackea sesiones
- **Qué falta**: Tabla `Session` con device info, IP, last activity
- **Criterios de aceptación**:
  - Model `UserSession` (userId, device, IP, lastActivity, status)
  - Al login: crear sesión
  - Settings page: ver sesiones activas, revocar
- **DoD**:
  - [ ] Model `UserSession` en schema
  - [ ] Login crea sesión con device info
  - [ ] Settings page lista sesiones
  - [ ] Botón "Revoke" funciona
- **Cómo verificar**: Login desde 2 devices, ver ambas en settings
- **Archivos implicados**: `schema.prisma`, `auth.ts`, `settings/sessions/`

### [P2] 2FA implementation
- **Tipo**: Feature (Security)
- **Dependencias**: Session tracking
- **Qué hay ahora**: No existe
- **Qué falta**: TOTP-based 2FA (Google Authenticator

)
- **Criterios de aceptación**:
  - User puede habilitar 2FA en settings
  - Genera QR code para TOTP app
  - Requiere 6-digit code al login
  - Recovery codes generados al habilitar
- **DoD**:
  - [ ] Library TOTP instalada (`otplib`)
  - [ ] UI para setup 2FA (QR + recovery codes)
  - [ ] Login flow valida TOTP si está habilitado
  - [ ] Recovery codes permiten bypass
- **Cómo verificar**: Habilitar 2FA, intentar login sin code → falla
- **Archivos implicados**: `schema.prisma`, `settings/security/`, `login flow`

---

## EPIC 2: Modelo de Datos

### [P1] Products/Services catalog
- **Tipo**: Feature
- **Dependencias**: Ninguna
- **Qué hay ahora**: No existe
- **Qué falta**: Model `Product` (nombre, SKU, precio, tipo: product/service)
- **Criterios de aceptación**:
  - Model `Product` (companyId, name, sku, price, type, taxRate, active)
  - CRUD en `admin/products/`
  - companyId filter obligatorio
  - Usar en invoice items (opcional)
- **DoD**:
  - [ ] Schema con `Product` model
  - [ ] CRUD actions (`products/actions.ts`)
  - [ ] Admin UI (`admin/products/page.tsx`)
  - [ ] Lista filtrable por tipo
- **Cómo verificar**: Crear producto, usarlo en invoice (opcional)
- **Archivos implicados**: `schema.prisma`, `admin/products/`, `invoices/actions.ts`

### [P2] Suppliers model
- **Tipo**: Feature
- **Dependencias**: Products catalog
- **Qué hay ahora**: No existe
- **Qué falta**: Model `Supplier` (como Client pero para compras)
- **Criterios de aceptación**:
  - Model `Supplier` (companyId, name, taxId, email, phone)
  - Relación Supplier → Expense (opcional)
  - CRUD en `admin/suppliers/`
- **DoD**:
  - [ ] Schema con `Supplier` model
  - [ ] CRUD actions (`suppliers/actions.ts`)
  - [ ] Admin UI
- **Cómo verificar**: Crear supplier, asociar a expense
- **Archivos implicados**: `schema.prisma`, `admin/suppliers/`, `expenses/`

### [P2] Contracts model
- **Tipo**: Feature
- **Dependencias**: Clients model
- **Qué hay ahora**: No existe
- **Qué falta**: Model `Contract` (client, start, end, terms)
- **Criterios de aceptación**:
  - Model `Contract` (clientId, projectId, startDate, endDate, value, terms)
  - States: DRAFT → ACTIVE → EXPIRED
  - Link a Project (opcional)
- **DoD**:
  - [ ] Schema con `Contract` model
  - [ ] State machine para Contract
  - [ ] CRUD UI
- **Cómo verificar**: Crear contrato, vincular a proyecto
- **Archivos implicados**: `schema.prisma`, `state-machine.ts`, `contracts/`

---

## EPIC 3: Flujos de Negocio

### [P1] TimeEntry approval flow aplicar
- **Tipo**: Fix / Feature
- **Dependencias**: Ninguna (estados ya definidos)
- **Qué hay ahora**: Estados definidos en `state-machine.ts`, no aplicados
- **Qué falta**: Actions usan state validation, UI muestra estados
- **Criterios de aceptación**:
  - `hours/actions.ts` valida transiciones con TimeEntryStateMachine
  - UI muestra badge de estado
  - Manager puede aprobar/rechazar
  - Audit trail logea cambios de estado
- **DoD**:
  - [ ] Actions usan `TimeEntryStateMachine.transition()`
  - [ ] UI muestra estado actual
  - [ ] Botones approve/reject funcionan
  - [ ] Audit log registra cambios
- **Cómo verificar**: Crear entry DRAFT → Submit → Manager approve
- **Archivos implicados**: `hours/actions.ts`, `hours/page.tsx`, `hours/daily/`

### [P2] Purchase Order workflow
- **Tipo**: Feature
- **Dependencias**: Suppliers model
- **Qué hay ahora**: No existe
- **Qué falta**: Model `PurchaseOrder` con states y approval
- **Criterios de aceptación**:
  - Model `PurchaseOrder` (supplierId, items, total, status)
  - States: DRAFT → SENT → APPROVED → RECEIVED
  - Approval flow: MANAGER+ can approve
- **DoD**:
  - [ ] Schema con `PurchaseOrder` model
  - [ ] State machine para PO
  - [ ] RBAC permissions
  - [ ] UI para crear y aprobar
- **Cómo verificar**: Crear PO, enviar a supplier, aprobar, marcar received
- **Archivos implicados**: `schema.prisma`, `state-machine.ts`, `purchases/`

---

## EPIC 4: Finanzas

### [P0] Invoice creation form
- **Tipo**: Feature (Frontend)
- **Dependencias**: Ninguna (backend listo)
- **Qué hay ahora**: Backend completo, UI solo lista/detalle
- **Qué falta**: Form para crear invoice con líneas dinámicas
- **Criterios de aceptación**:
  - Form en `/invoices/new`
  - Select client + project
  - Líneas editables (add/remove)
  - Calcula subtotal + IVA en real-time
  - Botón "Save as DRAFT" / "Send"
  - Validation: min 1 item, client required
- **DoD**:
  - [ ] `/invoices/new` página creada
  - [ ] Form con líneas dinámicas funciona
  - [ ] Cálculos automáticos correctos
  - [ ] Guarda draft, puede enviar directo
- **Cómo verificar**: Crear invoice con 3 items, guardar draft, editar, enviar
- **Archivos implicados**: `invoices/new/page.tsx`, validar con `zod`

### [P0] Invoice PDF generation
- **Tipo**: Feature
- **Dependencias**: Invoice UI
- **Qué hay ahora**: jsPDF instalado, no implementado
- **Qué falta**: Botón "Download PDF" genera factura
- **Criterios de aceptación**:
  - Botón "Download PDF" en invoice detail
  - PDF con header, logo, líneas, totales
  - Formato profesional
  - Filename: `INV-2026-001.pdf`
- **DoD**:
  - [ ] Función `generateInvoicePDF(invoice)` implementada
  - [ ] Botón en detail page funciona
  - [ ] PDF descarga con nombre correcto
  - [ ] Incluye logo company (opcional)
- **Cómo verificar**: Abrir invoice, click "Download PDF", abrir archivo
- **Archivos implicados**: `invoices/[id]/page.tsx`, `lib/pdf-generator.ts`

### [P1] Payment registration modal
- **Tipo**: Feature (Frontend)
- **Dependencias**: Invoice UI
- **Qué hay ahora**: Backend `addPayment()` exists, no UI
- **Qué falta**: Modal para registrar pago
- **Criterios de aceptación**:
  - Modal en invoice detail
  - Campos: amount, method, reference, date
  - No permite exceder balance
  - Botón "Register Payment"
  - Auto-refresh tras guardar
- **DoD**:
  - [ ] Modal component creado
  - [ ] Validación de balance
  - [ ] Registra pago correctamente
  - [ ] Balance se actualiza en UI
- **Cómo verificar**: Register payment de 100€ en invoice de 200€, balance = 100€
- **Archivos implicados**: `invoices/[id]/page.tsx`, components modal

### [P1] Tax management UI
- **Tipo**: Feature
- **Dependencias**: Ninguna
- **Qué hay ahora**: Tax rate hardcoded 21%
- **Qué falta**: Model `TaxRate`, CRUD UI
- **Criterios de aceptación**:
  - Model `TaxRate` (name, rate, country, active)
  - Admin UI para crear rates
  - Invoice items usan taxRateId
- **DoD**:
  - [ ] Schema con `TaxRate` model
  - [ ] CRUD UI en admin
  - [ ] InvoiceItem usa taxRateId
  - [ ] Seed con 21% IVA España
- **Cómo verificar**: Crear tax 10%, usar en invoice, cálculo correcto
- **Archivos implicados**: `schema.prisma`, `admin/taxes/`, `invoices/`

### [P2] Basic plan contable (Chart of Accounts)
- **Tipo**: Feature
- **Dependencias**: Tax management
- **Qué hay ahora**: No existe
- **Qué falta**: Model `Account` (código, nombre, tipo)
- **Criterios de aceptación**:
  - Model `Account` (code, name, type: asset/liability/equity/revenue/expense)
  - Accounts predefinidos en seed
  - Link expenses/invoices a accounts (opcional phase 2)
- **DoD**:
  - [ ] Schema con `Account` model
  - [ ] Seed con plan contable básico España
  - [ ] Admin UI para ver/editar
- **Cómo verificar**: Ver plan contable en admin, códigos 100-999
- **Archivos implicados**: `schema.prisma`, `seed.ts`, `admin/accounting/`

### [P2] Financial reports básicos
- **Tipo**: Feature
- **Dependencias**: Plan contable
- **Qué hay ahora**: No existen
- **Qué falta**: Reports: P&L (Profit & Loss), Balance Sheet
- **Criterios de aceptación**:
  - Page `/admin/reports/`
  - P&L: Ingresos - Gastos = Beneficio (por mes)
  - Balance Sheet: Assets vs Liabilities
  - Export to Excel
- **DoD**:
  - [ ] `/admin/reports/pl` muestra P&L por mes
  - [ ] `/admin/reports/balance` muestra balance
  - [ ] Export a Excel funciona
- **Cómo verificar**: Ver P&L del mes actual, verificar números con DB
- **Archivos implicados**: `admin/reports/`, export helper

---

## EPIC 5: Automatizaciones

### [P2] EventBus básico
- **Tipo**: Feature (Architecture)
- **Dependencias**: Ninguna
- **Qué hay ahora**: No existe
- **Qué falta**: Sistema pub/sub para eventos internos
- **Criterios de aceptación**:
  - Class `EventBus` con `publish()` / `subscribe()`
  - Eventos: `invoice.created`, `expense.approved`, `task.completed`
  - Handlers registrados en startup
  - Async processing (Promise.all)
- **DoD**:
  - [ ] `lib/event-bus.ts` implementado
  - [ ] Al menos 3 eventos emitidos
  - [ ] Ejemplo: crear notificación al evento
- **Cómo verificar**: Crear invoice, ver evento en logs
- **Archivos implicados**: `lib/event-bus.ts`, actions files

### [P2] Notification rules engine
- **Tipo**: Feature
- **Dependencias**: EventBus
- **Qué hay ahora**: Notificaciones manuales
- **Qué falta**: Reglas automáticas (ej: notificar al asignar task)
- **Criterios de aceptación**:
  - Model `NotificationRule` (event, condition, target)
  - Event handlers crean notificaciones auto
  - Ejemplos: task.assigned → notify assignee, invoice.overdue → notify manager
- **DoD**:
  - [ ] Schema con `NotificationRule`
  - [ ] Handlers en EventBus
  - [ ] Al menos 2 reglas activas
- **Cómo verificar**: Asignar task a user, ver notificación creada
- **Archivos implicados**: `schema.prisma`, `lib/event-bus.ts`, `notifications/`

### [P2] Scheduled jobs (Cron)
- **Tipo**: Feature / DevOps
- **Dependencias**: Ninguna
- **Qué hay ahora**: No existen
- **Qué falta**: Cron jobs para tareas periódicas
- **Criterios de aceptación**:
  - Library `node-cron` instalada
  - Jobs: marcar invoices OVERDUE (daily), cleanup logs (weekly)
  - Logs de ejecución
- **DoD**:
  - [ ] `lib/cron-jobs.ts` creado
  - [ ] Job daily marca invoices overdue
  - [ ] Logs indican última ejecución
- **Cómo verificar**: Esperar 24h, ver invoice overdue marcada
- **Archivos implicados**: `lib/cron-jobs.ts`, server startup

### [P2] Email automation (Resend/SendGrid)
- **Tipo**: Feature
- **Dependencias**: Notification rules
- **Qué hay ahora**: No existe
- **Qué falta**: Enviar emails automáticos
- **Criterios de aceptación**:
  - Provider (Resend) configurado
  - Templates HTML para: invoice sent, task assigned, expense approved
  - Queue para procesar async (opcional)
- **DoD**:
  - [ ] Resend SDK instalado
  - [ ] 3 templates HTML creados
  - [ ] Función `sendEmail(to, template, data)` funciona
  - [ ] Evento triggers email
- **Cómo verificar**: Enviar invoice, verificar email en inbox
- **Archivos implicados**: `lib/email.ts`, `lib/email-templates/`

---

## EPIC 6: Seguridad y Auditoría

### [P1] Aplicar RBAC a módulos restantes
- **Tipo**: Fix / Refactor
- **Dependencias**: Ninguna (RBAC existe)
- **Qué hay ahora**: RBAC aplicado a: Tasks, Expenses, Leads, Clients, Invoices
- **Qué falta**: Projects, Documents, Hours, Settings actions necesitan `checkPermission()`
- **Criterios de aceptación**:
  - Todos los CRUD actions en `projects/`, `documents/`, `hours/` usan `checkPermission()`
  - Ownership checks donde aplica (worker solo own)
  - Audit trail en todas las mutations
- **DoD**:
  - [ ] `projects/actions.ts` con RBAC completo
  - [ ] `documents/actions.ts` con RBAC
  - [ ] `hours/actions.ts` con RBAC
  - [ ] Audit logs todas las acciones
- **Cómo verificar**: Login as WORKER, intentar delete project → forbidden
- **Archivos implicados**: `projects/actions.ts`, `documents/actions.ts`, `hours/actions.ts`

### [P1] Centralizar queries con companyId filter
- **Tipo**: Refactor
- **Dependencias**: Ninguna
- **Qué hay ahora**: Queries manuales con `where: { companyId }`
- **Qué falta**: Helper `prisma.client.findManyInCompany()` auto-filtra
- **Criterios de aceptación**:
  - Helper `withCompanyFilter()` en `lib/prisma-helpers.ts`
  - Todas las queries usan helper
  - Test: query sin companyId → error
- **DoD**:
  - [ ] `withCompanyFilter()` implementado
  - [ ] 80%+ queries refactorizadas
  - [ ] No leaks cross-company
- **Cómo verificar**: Query desde company A, no ve data de company B
- **Archivos implicados**: `lib/prisma-helpers.ts`, all actions files

### [P1] Migrar in-memory a Redis rate limiter
- **Tipo**: Refactor
- **Dependencias**: Ninguna (mejora producción)
- **Qué hay ahora**: In-memory `rate-limit.ts`, no escala multi-server
- **Qué falta**: Redis adapter para rate limiter
- **Criterios de aceptación**:
  - Detectar Redis disponible (env var)
  - Si existe: usar Redis adapter
  - Si no: fallback a in-memory
  - Same API, transparent switch
- **DoD**:
  - [ ] `lib/rate-limit-redis.ts` implementado
  - [ ] Env var `REDIS_URL` configurable
  - [ ] Auto-detect y switch
  - [ ] Tests confirman rate limit persiste en Redis
- **Cómo verificar**: Setup Redis, hacer 200 requests, ver 429 tras 100
- **Archivos implicados**: `lib/rate-limit.ts`, `lib/rate-limit-redis.ts`, `.env`

### [P2] Structured logging (Winston/Pino)
- **Tipo**: Refactor
- **Dependencias**: Ninguna
- **Qué hay ahora**: `console.log()` everywhere
- **Qué falta**: Logger centralizado con levels, structured JSON
- **Criterios de aceptación**:
  - Library `winston` instalada
  - Logger en `lib/logger.ts`
  - Levels: error, warn, info, debug
  - Transport to file (opcional)
  - Reemplazar console.log por logger
- **DoD**:
  - [ ] `lib/logger.ts` creado
  - [ ] 80%+ console.log migrados
  - [ ] Logs en JSON format
  - [ ] File transport configurado
- **Cómo verificar**: Trigger error, ver en logs/error.log con stack trace
- **Archivos implicados**: `lib/logger.ts`, all files with `console.log`

---

## EPIC 7: UX ERP

### [P0] DataTable component genérico
- **Tipo**: Refactor
- **Dependencias**: Ninguna
- **Qué hay ahora**: Cada página tiene su propia tabla custom
- **Qué falta**: Component `<DataTable>` reutilizable con sort, filter, pagination
- **Criterios de aceptación**:
  - Component acepta: columns, data, onSort, onFilter, pagination
  - Sort por columna (asc/desc)
  - Filtros básicos (text search)
  - Pagination (10/25/50 per page)
  - Loading state
  - Empty state
- **DoD**:
  - [ ] `components/DataTable.tsx` implementado
  - [ ] Al menos 3 páginas migradas (tasks, expenses, invoices)
  - [ ] Funciona sort/filter/pagination
- **Cómo verificar**: Abrir /tasks, sort por fecha, filter por nombre
- **Archivos implicados**: `components/DataTable.tsx`, páginas de listas

### [P1] Filtros guardables
- **Tipo**: Feature
- **Dependencias**: DataTable genérico
- **Qué hay ahora**: Filtros temporales, se pierden al navegar
- **Qué falta**: Guardar filtros en DB para cada usuario
- **Criterios de aceptación**:
  - Model `SavedFilter` (userId, page, filters JSON)
  - Botón "Save filter"
  - Dropdown para seleccionar filter guardado
  - Aplicar automáticamente last used filter
- **DoD**:
  - [ ] Schema con `SavedFilter`
  - [ ] UI para save/load filters
  - [ ] Auto-load último filter usado
- **Cómo verificar**: Guardar filter "Mis tareas", salir, volver, filter aplicado
- **Archivos implicados**: `schema.prisma`, `components/DataTable.tsx`

### [P1] Acciones masivas en tablas
- **Tipo**: Feature
- **Dependencias**: DataTable genérico
- **Qué hay ahora**: No existen
- **Qué falta**: Checkbox multi-select, acciones bulk
- **Criterios de aceptación**:
  - Checkbox "Select all" en header
  - Checkboxes en cada fila
  - Acciones: Delete selected, Change status, Assign
  - Confirmation modal antes de bulk action
- **DoD**:
  - [ ] Checkbox multi-select funciona
  - [ ] Al menos 2 acciones bulk implementadas
  - [ ] Confirmation modal antes de ejecutar
- **Cómo verificar**: Seleccionar 3 tasks, "Delete selected", confirmar, eliminadas
- **Archivos implicados**: `components/DataTable.tsx`, actions files

### [P1] Dashboard configurable
- **Tipo**: Feature
- **Dependencias**: Ninguna
- **Qué hay ahora**: Dashboard fijo
- **Qué falta**: Widgets movibles, personalizados por usuario
- **Criterios de aceptación**:
  - Model `DashboardWidget` (userId, type, position, config)
  - Drag & drop para reordenar
  - Widgets: Tasks, Expenses, Revenue, Hours
  - Botón "Add widget"
- **DoD**:
  - [ ] Schema con `DashboardWidget`
  - [ ] Drag & drop funciona
  - [ ] 4+ widgets disponibles
  - [ ] Config persiste en DB
- **Cómo verificar**: Mover widget, refresh, layout guardado
- **Archivos implicados**: `schema.prisma`, `dashboard/page.tsx`, widget components

### [P2] Export global PDF/Excel
- **Tipo**: Feature
- **Dependencias**: Ninguna
- **Qué hay ahora**: jsPDF instalado, no hay export global
- **Qué falta**: Botón "Export" en cada tabla
- **Criterios de aceptación**:
  - Botón "Export" en DataTable
  - Opciones: PDF, Excel (CSV)
  - Exporta data visible (con filtros aplicados)
  - Filename: `tasks-2026-01-09.pdf`
- **DoD**:
  - [ ] Botón "Export" en DataTable
  - [ ] Export PDF funciona
  - [ ] Export Excel (CSV) funciona
  - [ ] Respeta filtros actuales
- **Cómo verificar**: Filter tasks "completed", export, file solo tiene completed
- **Archivos implicados**: `components/DataTable.tsx`, `lib/export-helpers.ts`

### [P2] Kanban drag & drop persistence
- **Tipo**: Feature
- **Dependencias**: Ninguna
- **Qué hay ahora**: Kanban UI existe, drag no persiste
- **Qué falta**: Al drag task, guardar cambio de estado
- **Criterios de aceptación**:
  - Drag task de columna → auto-save new status
  - Validar transition con state machine
  - Optimistic update en UI
- **DoD**:
  - [ ] Drag task cambia estado en DB
  - [ ] State machine valida transition
  - [ ] UI actualizada inmediatamente
- **Cómo verificar**: Drag task "PENDING" → "IN_PROGRESS", refresh, sigue ahí
- **Archivos implicados**: `tasks/kanban/page.tsx`, `tasks/actions.ts`

---

## EPIC 8: Extensibilidad

### [P2] Module system básico
- **Tipo**: Architecture / Refactor
- **Dependencias**: Ninguna
- **Qué hay ahora**: Todo acoplado
- **Qué falta**: Estructura de módulos con clear boundaries
- **Criterios de aceptación**:
  - Módulos en `src/modules/` (invoices, tasks, crm, etc.)
  - Cada módulo: models, actions, pages, components
  - Registry de módulos
  - Enable/disable módulos per company
- **DoD**:
  - [ ] 3+ módulos migrados a `src/modules/`
  - [ ] Registry funcional
  - [ ] Puede disable module (oculta UI)
- **Cómo verificar**: Disable "invoices" module, menu item desaparece
- **Archivos implicados**: `src/modules/`, module registry

### [P2] Webhooks outbound
- **Tipo**: Feature
- **Dependencias**: EventBus
- **Qué hay ahora**: No existen
- **Qué falta**: Configurar webhooks para eventos
- **Criterios de aceptación**:
  - Model `Webhook` (companyId, url, events, secret)
  - Al evento: POST to webhook URL
  - Retry logic (3 attempts)
  - Logs de delivery
- **DoD**:
  - [ ] Schema con `Webhook` model
  - [ ] Admin UI para crear webhooks
  - [ ] Delivery funciona + retry
  - [ ] Logs de attempts
- **Cómo verificar**: Crear webhook, trigger evento, ver POST en logs
- **Archivos implicados**: `schema.prisma`, `admin/webhooks/`, `lib/webhook-delivery.ts`

### [P2] REST API pública v1
- **Tipo**: Feature
- **Dependencias**: Ninguna
- **Qué hay ahora**: Solo internal Next.js APIs
- **Qué falta**: REST API versionada + auth con API keys
- **Criterios de aceptación**:
  - Routes `/api/v1/tasks`, `/api/v1/invoices`, etc.
  - Auth via `Authorization: Bearer <api_key>`
  - Rate limiting más estricto (60 req/min)
  - Docs en `/api/docs` (Swagger)
- **DoD**:
  - [ ] 5+ endpoints REST v1
  - [ ] API key auth funciona
  - [ ] Swagger docs generados
  - [ ] Rate limit aplicado
- **Cómo verificar**: `curl -H "Authorization: Bearer key" /api/v1/tasks`
- **Archivos implicados**: `src/app/api/v1/`, `lib/api-auth.ts`, swagger config

---

## RESUMEN EJECUTIVO

### Top 10 Tareas P0 Imprescindibles

1. **Consolidar documentación** - 40+ .md duplicados → clarity
2. **Invoice creation form** - Backend listo, falta UI crítica
3. **Invoice PDF generation** - jsPDF ya instalado
4. **ESLint + Prettier estrictos** - Code quality baseline
5. **Aplicar RBAC a Projects/Documents/Hours** - Security gaps
6. **TimeEntry approval flow aplicar** - Estados definidos, no usados
7. **Aplicar audit logging sistemático** - Falta en algunos módulos
8. **DataTable genérico** - DRY principal, tables everywhere
9. **Centralizar companyId queries** - Prevenir leaks
10. **CI/CD pipeline** - Deployments con confianza

### Top 10 Mejoras de Arquitectura (Refactor)

1. **Migrar rate limiting a Redis** - Producción multi-server
2. **RBAC en DB opcional** - Flexibilidad vs hardcode
3. **Structured logging Winston** - Debugging profesional
4. **DataTable component** - Reutilización UI
5. **Error boundaries** - No crashes inesperados
6. **Module system** - Desacoplar código
7. **Centralizar validaciones Zod** - DRY schemas
8. **API versioning /v1/** - Stable API contracts
9. **Consolidar docs** - Menos confusión
10. **Centralizar companyId filters** - Seguridad garantizada

### Camino Crítico (Qué Desbloquea Qué)

```
P0 Docs consolidation
  └─> P0 ESLint/Prettier strict
      └─> P1 CI/CD pipeline
          └─> P2 Pre-commit hooks

P0 Invoice form
  └─> P0 PDF generation
      └─> P1 Payment modal
          └─> P1 Tax management
              └─> P2 Financial reports

P1 RBAC to remaining modules
  └─> P1 Centralize companyId queries
      └─> P2 Permission model in DB

P0 DataTable generic
  └─> P1 Filtros guardables
      └─> P1 Acciones masivas
          └─> P2 Export global PDF/Excel

P1 TimeEntry approval flow
  └─> P2 Purchase Order workflow
      └─> P2 Contracts workflow

P2 EventBus
  └─> P2 Notification rules
      └─> P2 Email automation
          └─> P2 Webhooks outbound
```

### Lista de "Cosas que NO Debo Hacer Todavía"

**Features que distraen** (hasta completar P0/P1):
- Advanced analytics (business intelligence)
- Mobile app (React Native)
- Real-time collaboration (WebSockets)
- i18n multi-language
- Theme customization per company
- Advanced caching (Redis query cache)
- Microservices architecture
- GraphQL API
- Advanced reporting engine
- Inventory management
- HR/Payroll módulos
- Time tracking with screenshots
- Integrations (Stripe, Zoom, Slack)

**Esperar hasta** fase de extensibilidad (Epic 8).

---

**Fecha**: 2026-01-09  
**Revisión**: v1 (post 5.5h development session)  
**Próxima actualización**: Tras completar 5+ tareas P0
