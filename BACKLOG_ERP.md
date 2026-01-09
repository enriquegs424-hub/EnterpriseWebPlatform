# MEP Projects - Backlog ERP Completo

> **Backlog ejecutable** basado en auditoría real del repositorio

---

## EPICS

- **EPIC 0**: Base del proyecto y DX (Developer Experience)
- **EPIC 1**: Core ERP (Multi-tenant, Permisos, Auditoría)
- **EPIC 2**: Modelo de datos (entidades faltantes)
- **EPIC 3**: Flujos de negocio (estados y transiciones)
- **EPIC 4**: Finanzas mínimas (facturas, pagos, impuestos)
- **EPIC 5**: Automatizaciones (triggers, reglas, notificaciones)
- **EPIC 6**: Seguridad y auditoría (RBAC, rate limit, logs)
- **EPIC 7**: UX ERP (listas, filtros, acciones masivas)
- **EPIC 8**: Extensibilidad (módulos, hooks, APIs)

---

# EPIC 0: Base del Proyecto y DX

---

### [P0] Crear middleware.ts para protección de rutas

- **Tipo**: Fix / Security
- **Dependencias**: Ninguna (bloquea todo)
- **Qué hay ahora**: auth.config.ts con callback `authorized` que solo protege `/dashboard`, `/hours`, `/admin`
- **Qué falta**: middleware.ts real que proteja TODAS las rutas en `(protected)`
- **Criterios de aceptación**:
  - [ ] middleware.ts en raíz de src/
  - [ ] Protege todas las rutas bajo /(protected)
  - [ ] Redirige a /login si no autenticado
  - [ ] Permite rutas públicas: /, /login, /api/health
- **DoD**:
  - [ ] Archivo creado y funcionando
  - [ ] Probar acceso anónimo a /dashboard → redirige
  - [ ] Probar acceso autenticado a /dashboard → permite
- **Cómo verificar**: `curl localhost:3000/dashboard` sin sesión debe redirigir
- **Archivos**: `src/middleware.ts` (NUEVO), `src/auth.config.ts`

---

### [P0] Configurar ESLint + Prettier estrictos

- **Tipo**: DevOps
- **Dependencias**: Ninguna
- **Qué hay ahora**: eslint.config.mjs básico, sin prettier configurado
- **Qué falta**: Reglas estrictas, pre-commit hook, format on save
- **Criterios de aceptación**:
  - [ ] .prettierrc con configuración
  - [ ] eslint.config.mjs con reglas TypeScript estrictas
  - [ ] package.json script "lint:fix"
  - [ ] Husky + lint-staged para pre-commit
- **DoD**:
  - [ ] `npm run lint` pasa sin errores
  - [ ] Commit con errores de lint falla
- **Cómo verificar**: `npm run lint && npm run format`
- **Archivos**: `eslint.config.mjs`, `.prettierrc`, `package.json`

---

### [P1] Crear estructura de tests

- **Tipo**: Test / DevOps
- **Dependencias**: ESLint fix
- **Qué hay ahora**: Cero tests, ni carpeta ni configuración
- **Qué falta**: Vitest o Jest configurado, carpeta tests/, primer test
- **Criterios de aceptación**:
  - [ ] vitest.config.ts o jest.config.js
  - [ ] Carpeta tests/ o __tests__/
  - [ ] Al menos 1 test unitario (ej: utils)
  - [ ] Script "test" en package.json
- **DoD**:
  - [ ] `npm test` ejecuta y pasa
- **Cómo verificar**: `npm test`
- **Archivos**: `vitest.config.ts`, `tests/`, `package.json`

---

### [P1] Configurar GitHub Actions CI básico

- **Tipo**: DevOps
- **Dependencias**: Tests, ESLint
- **Qué hay ahora**: Nada de CI/CD
- **Qué falta**: .github/workflows/ci.yml con lint + test + build
- **Criterios de aceptación**:
  - [ ] Archivo workflow en .github/workflows/
  - [ ] Jobs: lint, test, build
  - [ ] Corre en push a main y PRs
- **DoD**:
  - [ ] Push a main ejecuta pipeline
  - [ ] Badge de status en README
- **Cómo verificar**: Ver Actions en GitHub
- **Archivos**: `.github/workflows/ci.yml`

---

### [P2] Consolidar documentación

- **Tipo**: Docs
- **Dependencias**: Ninguna
- **Qué hay ahora**: 30+ archivos .md fragmentados y duplicados
- **Qué falta**: Consolidar en README.md, ROADMAP_ERP.md, CONTRIBUTING.md
- **Criterios de aceptación**:
  - [ ] README.md actualizado con quickstart
  - [ ] ROADMAP_ERP.md como fuente de verdad
  - [ ] Mover legacy docs a _legacy/
- **DoD**:
  - [ ] Solo 5 docs principales en raíz
  - [ ] Nuevo dev puede empezar en < 10min
- **Cómo verificar**: Leer README y seguir instrucciones
- **Archivos**: `README.md`, `ROADMAP_ERP.md`, `_legacy/`

---

# EPIC 1: Core ERP

---

### [P0] Crear modelo Company (Multi-tenant)

- **Tipo**: Feature
- **Dependencias**: Middleware
- **Qué hay ahora**: Sin modelo Company, datos sin companyId
- **Qué falta**: Model Company en schema, companyId en User y entidades core
- **Criterios de aceptación**:
  - [ ] Model Company en schema.prisma
  - [ ] companyId en User, Project, Client, Lead, Expense, Invoice
  - [ ] Migración sin pérdida de datos
  - [ ] Company por defecto para datos existentes
- **DoD**:
  - [ ] `prisma db push` exitoso
  - [ ] Seed crea Company por defecto
  - [ ] Queries filtran por companyId
- **Cómo verificar**: `npx prisma studio` ver Company
- **Archivos**: `prisma/schema.prisma`, `prisma/seed.ts`

---

### [P0] Crear modelo Permission + RolePermission (RBAC)

- **Tipo**: Feature
- **Dependencias**: Company model
- **Qué hay ahora**: Enum Role (ADMIN/MANAGER/WORKER/CLIENT) sin permisos granulares
- **Qué falta**: Tabla Permission (action, resource), RolePermission (roleId, permissionId)
- **Criterios de aceptación**:
  - [ ] Model Permission con action + resource
  - [ ] Model RolePermission junction table
  - [ ] Seed con permisos base (CRUD por recurso)
- **DoD**:
  - [ ] Prisma schema válido
  - [ ] 20+ permisos seedeados
- **Cómo verificar**: `npx prisma studio` ver Permission
- **Archivos**: `prisma/schema.prisma`, `prisma/seed.ts`

---

### [P0] Crear utilidad checkPermission()

- **Tipo**: Feature
- **Dependencias**: Permission model
- **Qué hay ahora**: Nada
- **Qué falta**: Función server que verifica permiso del usuario actual
- **Criterios de aceptación**:
  - [ ] `checkPermission(userId, action, resource)` → boolean
  - [ ] Cache de permisos por sesión
  - [ ] Throw si no tiene permiso (con log)
- **DoD**:
  - [ ] Función usable en server actions
  - [ ] Retorna true/false correctamente
- **Cómo verificar**: Test unitario
- **Archivos**: `src/lib/permissions.ts` (NUEVO)

---

### [P1] Implementar checkPermission en todas las actions

- **Tipo**: Refactor
- **Dependencias**: checkPermission utility
- **Qué hay ahora**: Actions sin verificación de permisos
- **Qué falta**: Llamar checkPermission al inicio de cada action crítica
- **Criterios de aceptación**:
  - [ ] Todas las actions de CRUD verifican permiso
  - [ ] Error 403 si no tiene permiso
  - [ ] Log de intentos denegados
- **DoD**:
  - [ ] WORKER no puede acceder a /admin
  - [ ] CLIENT solo ve sus propios datos
- **Cómo verificar**: Login como WORKER, intentar borrar user
- **Archivos**: Todos los `actions.ts` en `src/app/(protected)/*/`

---

### [P1] Implementar auditoría sistemática

- **Tipo**: Refactor
- **Dependencias**: checkPermission, ActivityLog model (ya existe)
- **Qué hay ahora**: ActivityLog modelo existe, pero no se usa consistentemente
- **Qué falta**: Helper `logActivity()` y llamarlo en TODA acción CRUD
- **Criterios de aceptación**:
  - [ ] `logActivity(userId, action, entityType, entityId, changes?)` 
  - [ ] Llamar después de cada create/update/delete exitoso
  - [ ] Guardar diff de cambios en updates
- **DoD**:
  - [ ] Página /admin/logs muestra TODAS las acciones
  - [ ] Cada registro tiene userId, action, entity, timestamp
- **Cómo verificar**: Crear task, ver en /admin/logs
- **Archivos**: `src/lib/audit.ts` (NUEVO), todas las actions

---

# EPIC 2: Modelo de Datos

---

### [P1] Crear modelo Invoice + InvoiceItem

- **Tipo**: Feature
- **Dependencias**: Company model
- **Qué hay ahora**: Nada
- **Qué falta**: Modelos Invoice (header) e InvoiceItem (líneas)
- **Criterios de aceptación**:
  - [ ] Invoice: number, date, dueDate, clientId, status, subtotal, tax, total
  - [ ] InvoiceItem: description, quantity, unitPrice, taxRate, total
  - [ ] Estados: DRAFT, SENT, PAID, CANCELLED
  - [ ] Relaciones con Client, Project, Company
- **DoD**:
  - [ ] Schema válido, migración exitosa
- **Cómo verificar**: `npx prisma studio`
- **Archivos**: `prisma/schema.prisma`

---

### [P1] Crear modelo Payment

- **Tipo**: Feature
- **Dependencias**: Invoice model
- **Qué hay ahora**: Nada
- **Qué falta**: Modelo Payment ligado a Invoice
- **Criterios de aceptación**:
  - [ ] Payment: invoiceId, amount, date, method, reference
  - [ ] Métodos: CASH, TRANSFER, CARD, OTHER
  - [ ] Actualiza Invoice.status si pago = total
- **DoD**:
  - [ ] Schema válido
- **Cómo verificar**: `npx prisma studio`
- **Archivos**: `prisma/schema.prisma`

---

### [P2] Crear modelo Product/Service

- **Tipo**: Feature
- **Dependencias**: Company model
- **Qué hay ahora**: Nada (todo se describe ad-hoc en TimeEntry/Expense)
- **Qué falta**: Catálogo de productos/servicios reutilizables
- **Criterios de aceptación**:
  - [ ] Product: code, name, type (PRODUCT/SERVICE), price, taxRate
  - [ ] Usable en InvoiceItem
- **DoD**:
  - [ ] Crear producto desde UI
  - [ ] Seleccionar producto al crear factura
- **Archivos**: `prisma/schema.prisma`, UI nueva

---

### [P2] Añadir companyId a todas las entidades faltantes

- **Tipo**: Refactor
- **Dependencias**: Company model
- **Qué hay ahora**: User tiene companyId (pendiente), resto no
- **Qué falta**: companyId en Task, TimeEntry, Document, Chat, Event, Notification
- **Criterios de aceptación**:
  - [ ] Todas las entidades tienen companyId
  - [ ] Foreign key a Company
  - [ ] Queries filtran por company del usuario actual
- **DoD**:
  - [ ] Usuario de Empresa A no ve datos de Empresa B
- **Archivos**: `prisma/schema.prisma`, todas las actions

---

# EPIC 3: Flujos de Negocio

---

### [P0] Crear StateManager genérico

- **Tipo**: Feature
- **Dependencias**: Ninguna
- **Qué hay ahora**: Estados hardcoded en enums sin validación de transiciones
- **Qué falta**: Utilidad que define transiciones válidas y las valida
- **Criterios de aceptación**:
  - [ ] `StateManager.canTransition(entity, from, to)` → boolean
  - [ ] `StateManager.transition(entity, to)` → throws if invalid
  - [ ] Configuración por entidad (Task, Lead, Invoice, Expense)
- **DoD**:
  - [ ] No se puede pasar Task de PENDING a COMPLETED sin IN_PROGRESS
- **Cómo verificar**: Test unitario
- **Archivos**: `src/lib/state-machine.ts` (NUEVO)

---

### [P1] Implementar flujo Lead → Oportunidad → Cliente

- **Tipo**: Feature
- **Dependencias**: StateManager, CRM existente
- **Qué hay ahora**: LeadStage enum básico, sin transiciones validadas
- **Qué falta**: Pipeline visual, validaciones, conversión a Cliente automática
- **Criterios de aceptación**:
  - [ ] Vista Kanban de leads por stage
  - [ ] Drag & drop respeta transiciones válidas
  - [ ] Al llegar a CLOSED_WON, opción de crear Client automático
- **DoD**:
  - [ ] Lead avanza por stages correctamente
  - [ ] No se puede saltar de NEW a CLOSED_WON
- **Archivos**: `src/app/(protected)/crm/`, `src/components/crm/`

---

### [P1] Implementar flujo Expense → Aprobación

- **Tipo**: Refactor
- **Dependencias**: StateManager
- **Qué hay ahora**: ExpenseStatus enum (PENDING/APPROVED/REJECTED/PAID)
- **Qué falta**: UI de aprobación, notificaciones, permisos (solo MANAGER aprueba)
- **Criterios de aceptación**:
  - [ ] WORKER crea expense en PENDING
  - [ ] MANAGER ve pendientes y aprueba/rechaza
  - [ ] Notificación al creador on change
- **DoD**:
  - [ ] Flujo completo testeable
- **Archivos**: `src/app/(protected)/expenses/`, actions.ts

---

### [P2] Implementar flujo TimeEntry → Aprobación

- **Tipo**: Feature
- **Dependencias**: StateManager
- **Qué hay ahora**: TimeEntry sin status (todo es válido)
- **Qué falta**: Estado: DRAFT → SUBMITTED → APPROVED/REJECTED
- **Criterios de aceptación**:
  - [ ] WORKER puede editar solo DRAFT
  - [ ] Submit bloquea edición
  - [ ] MANAGER aprueba/rechaza
- **DoD**:
  - [ ] No se puede editar TimeEntry aprobado
- **Archivos**: `prisma/schema.prisma`, `src/app/(protected)/hours/`

---

# EPIC 4: Finanzas Mínimas

---

### [P1] CRUD Facturas (Invoice)

- **Tipo**: Feature
- **Dependencias**: Invoice model, RBAC
- **Qué hay ahora**: Nada
- **Qué falta**: UI completa de facturas
- **Criterios de aceptación**:
  - [ ] Listado de facturas con filtros
  - [ ] Crear factura: cliente, líneas, impuestos
  - [ ] Editar solo en DRAFT
  - [ ] Enviar (cambiar a SENT)
  - [ ] PDF preview/download
- **DoD**:
  - [ ] Crear factura de €1000 + IVA
  - [ ] Descargar PDF
- **Archivos**: `src/app/(protected)/invoices/` (NUEVO)

---

### [P1] CRUD Pagos (Payment)

- **Tipo**: Feature
- **Dependencias**: Payment model, Invoice CRUD
- **Qué hay ahora**: Nada
- **Qué falta**: Registrar pagos contra facturas
- **Criterios de aceptación**:
  - [ ] Registrar pago parcial/total
  - [ ] Factura actualiza a PAID si balance = 0
  - [ ] Histórico de pagos por factura
- **DoD**:
  - [ ] Factura de €1000, pagar €500, ver pendiente €500
- **Archivos**: `src/app/(protected)/payments/` (NUEVO)

---

### [P2] Impuestos básicos (IVA)

- **Tipo**: Feature
- **Dependencias**: Invoice CRUD
- **Qué hay ahora**: currency en Lead/Expense pero no tax rates
- **Qué falta**: Modelo TaxRate, selector en Invoice/InvoiceItem
- **Criterios de aceptación**:
  - [ ] TaxRate: name, percentage, active
  - [ ] Seleccionar en línea de factura
  - [ ] Cálculo automático subtotal + tax = total
- **DoD**:
  - [ ] IVA 21% aplicado correctamente
- **Archivos**: `prisma/schema.prisma`, UI facturas

---

### [P2] Reportes financieros básicos

- **Tipo**: Feature
- **Dependencias**: Invoices, Payments
- **Qué hay ahora**: Analytics página con métricas de horas
- **Qué falta**: Dashboard financiero: facturado, cobrado, pendiente
- **Criterios de aceptación**:
  - [ ] Total facturado (periodo)
  - [ ] Total cobrado
  - [ ] Cuentas por cobrar (aging)
  - [ ] Gráfico tendencia
- **DoD**:
  - [ ] Dashboard muestra €X facturado este mes
- **Archivos**: `src/app/(protected)/analytics/`

---

# EPIC 5: Automatizaciones

---

### [P2] Sistema de eventos/triggers

- **Tipo**: Feature
- **Dependencias**: StateManager, Auditoría
- **Qué hay ahora**: Nada
- **Qué falta**: EventBus que dispara on entity.change
- **Criterios de aceptación**:
  - [ ] EventEmitter pattern
  - [ ] Eventos: entity.created, entity.updated, entity.deleted
  - [ ] Hooks subscriben a eventos
- **DoD**:
  - [ ] Crear Task dispara evento
- **Archivos**: `src/lib/events.ts` (NUEVO)

---

### [P2] Notificaciones automáticas por evento

- **Tipo**: Feature
- **Dependencias**: EventBus
- **Qué hay ahora**: Notificaciones manuales en algunas actions
- **Qué falta**: Centralizar: al asignar task → notificar, al aprobar expense → notificar
- **Criterios de aceptación**:
  - [ ] Config de qué eventos generan notificación
  - [ ] Template de mensaje por tipo
- **DoD**:
  - [ ] Asignar task crea notificación automática
- **Archivos**: `src/lib/notifications-auto.ts` (NUEVO)

---

### [P2] Reglas de negocio configurables

- **Tipo**: Feature
- **Dependencias**: EventBus, SystemSetting model
- **Qué hay ahora**: SystemSetting modelo existe pero vacío
- **Qué falta**: Reglas tipo "Si expense > €500, requiere doble aprobación"
- **Criterios de aceptación**:
  - [ ] CRUD de reglas en admin
  - [ ] Evaluación en servidor
- **DoD**:
  - [ ] Regla activa se ejecuta
- **Archivos**: `src/app/(protected)/admin/rules/` (NUEVO)

---

# EPIC 6: Seguridad y Auditoría

---

### [P0] Rate limiting en APIs

- **Tipo**: Feature / Security
- **Dependencias**: Middleware
- **Qué hay ahora**: Nada
- **Qué falta**: Limitar requests por IP/usuario
- **Criterios de aceptación**:
  - [ ] 100 req/min por IP (configurable)
  - [ ] 429 si excede
  - [ ] Log de IPs bloqueadas
- **DoD**:
  - [ ] Script de test con 200 requests falla después de 100
- **Archivos**: `src/middleware.ts`, librería (ej: `@upstash/ratelimit`)

---

### [P1] Login history y sesiones activas

- **Tipo**: Feature
- **Dependencias**: Auth, Auditoría
- **Qué hay ahora**: JWT sin tracking de sesiones
- **Qué falta**: Tabla Session, historial de logins
- **Criterios de aceptación**:
  - [ ] Cada login crea registro
  - [ ] Usuario ve sesiones activas
  - [ ] Puede cerrar sesiones remotas
- **DoD**:
  - [ ] Ver "Dispositivos conectados" en settings
- **Archivos**: `prisma/schema.prisma`, `src/app/(protected)/settings/`

---

### [P2] 2FA opcional

- **Tipo**: Feature
- **Dependencias**: Auth sólido
- **Qué hay ahora**: Solo password
- **Qué falta**: TOTP o email code como segundo factor
- **Criterios de aceptación**:
  - [ ] Activar 2FA desde settings
  - [ ] QR para TOTP
  - [ ] Verificar en login
- **DoD**:
  - [ ] Login con código activo
- **Archivos**: Auth flow, settings

---

# EPIC 7: UX ERP

---

### [P1] Acciones masivas en tablas

- **Tipo**: Feature
- **Dependencias**: RBAC (permisos por acción)
- **Qué hay ahora**: Acciones individuales por fila
- **Qué falta**: Seleccionar múltiples, aplicar acción (delete, export, status change)
- **Criterios de aceptación**:
  - [ ] Checkbox en tabla
  - [ ] Barra de acciones masivas
  - [ ] Confirmación para destructivas
- **DoD**:
  - [ ] Eliminar 5 tasks a la vez
- **Archivos**: Todos los componentes de tabla

---

### [P1] Filtros avanzados y guardados

- **Tipo**: Feature
- **Dependencias**: Ninguna
- **Qué hay ahora**: Filtros básicos en algunas páginas
- **Qué falta**: Filtros por cualquier campo, guardar filtros frecuentes
- **Criterios de aceptación**:
  - [ ] UI de filtros expandible
  - [ ] Guardar filtro con nombre
  - [ ] Aplicar filtro guardado
- **DoD**:
  - [ ] Guardar "Mis tasks urgentes" como filtro
- **Archivos**: Componente `AdvancedFilters.tsx`

---

### [P2] Export a PDF/Excel

- **Tipo**: Feature
- **Dependencias**: jsPDF ya instalado
- **Qué hay ahora**: jsPDF en package.json pero sin usar globalmente
- **Qué falta**: Botón export en listas principales
- **Criterios de aceptación**:
  - [ ] Export PDF tabla actual
  - [ ] Export Excel (CSV)
  - [ ] Respeta filtros aplicados
- **DoD**:
  - [ ] Descargar lista de proyectos en PDF
- **Archivos**: Componente `ExportButton.tsx`

---

### [P2] Dashboards configurables

- **Tipo**: Feature
- **Dependencias**: Analytics existente
- **Qué hay ahora**: Dashboard fijo
- **Qué falta**: Widgets drag & drop, guardar layout por usuario
- **Criterios de aceptación**:
  - [ ] Biblioteca de widgets
  - [ ] Arrastrar a posición
  - [ ] Persistir en preferences
- **DoD**:
  - [ ] Usuario A y B tienen dashboards distintos
- **Archivos**: `src/app/(protected)/dashboard/`

---

# EPIC 8: Extensibilidad

---

### [P2] Sistema de módulos

- **Tipo**: Feature
- **Dependencias**: Todo EPIC 1
- **Qué hay ahora**: Código acoplado
- **Qué falta**: Estructura que permita activar/desactivar módulos
- **Criterios de aceptación**:
  - [ ] Cada módulo en carpeta aislada
  - [ ] Config de módulos activos
  - [ ] Sidebar dinámico según módulos
- **DoD**:
  - [ ] Desactivar módulo CRM, desaparece del sidebar
- **Archivos**: `src/modules/` (NUEVO), config

---

### [P2] Webhooks salientes

- **Tipo**: Feature
- **Dependencias**: EventBus
- **Qué hay ahora**: Nada
- **Qué falta**: Enviar POST a URL externa on event
- **Criterios de aceptación**:
  - [ ] CRUD webhooks en admin
  - [ ] Enviar payload JSON firmado
  - [ ] Retry con exponential backoff
- **DoD**:
  - [ ] Crear task → POST a Zapier/N8n
- **Archivos**: `src/app/(protected)/admin/webhooks/` (NUEVO)

---

### [P2] API REST pública

- **Tipo**: Feature
- **Dependencias**: RBAC, Rate limiting
- **Qué hay ahora**: APIs internas en /api/
- **Qué falta**: /api/v1/ con auth por API key, documentación
- **Criterios de aceptación**:
  - [ ] API key generation
  - [ ] Endpoints CRUD por recurso
  - [ ] OpenAPI spec
- **DoD**:
  - [ ] curl con API key crea proyecto
- **Archivos**: `src/app/api/v1/` (NUEVO)

---

---

# RESUMEN EJECUTIVO

---

## Top 10 Tareas P0 Imprescindibles

1. **Crear middleware.ts** - Rutas desprotegidas actualmente
2. **Modelo Company (multi-tenant)** - Sin esto no escala
3. **Modelo Permission + RBAC** - Sin permisos reales
4. **checkPermission() en actions** - Cualquiera puede hacer cualquier cosa
5. **Rate limiting APIs** - Vulnerable a DDoS/abuse
6. **StateManager genérico** - Estados sin validar
7. **Tests unitarios base** - Cero tests = regresiones
8. **Auditoría sistemática** - ActivityLog no se usa
9. **ESLint + Prettier estrictos** - Código inconsistente
10. **Modelo Invoice** - Sin finanzas no es ERP

---

## Top 10 Refactors Más Rentables

1. **auth.config.ts → middleware.ts** - Más seguro, más control
2. **Hardcoded states → StateManager** - Reusable en todo el sistema
3. **Actions sin permisos → RBAC universal** - Una vez, aplica a todo
4. **ActivityLog manual → logActivity()** - Auditoría automática
5. **Notifications dispersas → EventBus** - Centralizado y extensible
6. **Dark mode parcheado → Design Tokens** - Ya iniciado, completar
7. **Console.logs → Logger condicional** - Profesionalismo
8. **30+ docs → 5 docs core** - Menos confusión
9. **Queries sin companyId → Multi-tenant** - Preparar escalado
10. **UI tables → DataTable genérico** - DRY, consistencia

---

## Camino Crítico (qué desbloquea qué)

```
middleware.ts
    ↓
Company model
    ↓
Permission model → checkPermission() → Todas las actions seguras
    ↓
StateManager → Flujos válidos (Lead, Expense, Invoice)
    ↓
Invoice model → Payment → Finanzas básicas
    ↓
EventBus → Automatizaciones → Escalabilidad
```

---

## Cosas que NO hacer todavía

| Feature | Por qué esperar |
|---------|-----------------|
| 2FA | Auth básico aún débil |
| Webhooks | Sin EventBus primero |
| API pública | Sin RBAC + Rate limit |
| Dashboards configurables | Sin datos financieros |
| Módulos dinámicos | Arquitectura no lista |
| Mobile app | Web aún incompleta |
| AI/ML features | Core no existe |
| Multi-idioma | Strings hardcoded |
| Theming por cliente | Design Tokens incompletos |
| Marketplace de plugins | Años antes |

