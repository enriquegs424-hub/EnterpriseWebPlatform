# MEP Projects - Especificación ERP (Auditoría Brutal)

> **Versión**: 3.0 CRÍTICA  
> **Modo**: SINGLE-COMPANY (multiempresa-ready)  
> **Evaluación**: BRUTAL - Sin suavizar conclusiones

---

# 🚨 BLOQUEANTES IDENTIFICADOS

Antes de cualquier otra cosa, estos problemas deben resolverse:

| # | BLOQUEANTE | Severidad | Ubicación |
|---|------------|-----------|-----------|
| 1 | **Float para dinero** | 🔴 CRÍTICO | 15+ campos en schema.prisma |
| 2 | **Sin CI/CD** | 🔴 CRÍTICO | `.github/` no existe |
| 3 | **Sin tests de integración** | 🟠 ALTO | Solo tests unitarios de state-machine |
| 4 | **Sin rate limiting** | 🔴 CRÍTICO | Auth sin protección de fuerza bruta |
| 5 | **Modelo Quote no existe** | 🟠 ALTO | Flujo comercial incompleto |

---

# ═══════════════════════════════════════════════════════════════
# A) CONTRATO GLOBAL (INNEGOCIABLE)
# ═══════════════════════════════════════════════════════════════

## A1) Tenancy / Single-Company Ready

### Situación Actual
- Model `Company` existe con todos los campos necesarios
- `companyId` presente en entidades core (Invoice, Expense, Lead, Project, Product)
- **PROBLEMA**: `companyId` es `String?` (nullable) en algunas entidades

### Contrato Obligatorio (Single-Company)
```
REGLA: Todas las entidades con datos de negocio DEBEN tener companyId.
       Para single-company, usar un "DEFAULT_COMPANY_ID" constante.
       El campo DEBE ser NOT NULL para garantizar integridad.
```

### Preparación Multi-empresa Futura
| Requisito | Estado | Acción |
|-----------|--------|--------|
| companyId en User | ✅ Existe | Hacer NOT NULL |
| companyId en Invoice | ✅ Existe | Hacer NOT NULL |
| companyId en Expense | ✅ Existe | Hacer NOT NULL |
| companyId en Lead | ✅ Existe | Hacer NOT NULL |
| companyId en Product | ✅ Existe | OK (ya NOT NULL) |
| Scoping automático en queries | ⚠️ PARCIAL | Crear helper genérico |

### VEREDICTO: ⚠️ PARCIAL
- Arquitectura correcta pero nullable peligroso
- Migración futura: solo agregar selector empresa + junction table N:M

---

## A2) IAM y RBAC

### Situación Actual
- 4 roles definidos: ADMIN, MANAGER, WORKER, CLIENT
- Matriz de permisos en `src/lib/permissions.ts` (82 líneas)
- `checkPermission()` llamada en 34 lugares

### Auditoría de Uso de checkPermission()

| Módulo | Usa checkPermission | Cantidad |
|--------|---------------------|----------|
| invoices/actions.ts | ✅ | 6 llamadas |
| projects/actions.ts | ✅ | 5 llamadas |
| expenses/actions.ts | ✅ | 4 llamadas |
| crm/actions.ts | ✅ | 4 llamadas |
| admin/products/actions.ts | ✅ | 9 llamadas |
| finance/actions.ts | ✅ | 1 llamada |
| **tasks/actions.ts** | ❌ **FALTA** | 0 |
| **hours/actions.ts** | ❌ **FALTA** | 0 |
| **documents/actions.ts** | ❌ **FALTA** | 0 |

### Matriz de Permisos (Implementada)
```
Resource    | ADMIN | MANAGER | WORKER | CLIENT
------------|-------|---------|--------|--------
users       | CRUD  | R       | -      | -
projects    | CRUD  | CRU     | R      | own
clients     | CRUD  | CRU     | R      | own
leads       | CRUD  | CRUD    | CRU-own| -
tasks       | CRUD  | CRUD    | CRU-own| own
timeentries | CRUD  | CRUD    | own    | -
documents   | CRUD  | CRUD    | own    | own
expenses    | CRUD  | CRUD-app| own    | -
invoices    | CRUD  | CRU-app | -      | own
settings    | CRUD  | R       | own    | own
analytics   | CRUD  | R       | -      | -
```

### VEREDICTO: ⚠️ PARCIAL
- Permisos solo aplicados en 6 de 9 módulos con actions
- FALTA: tasks, hours, documents

---

## A3) Modelo "Documento ERP" Universal

### Situación Actual
- **Invoice** implementado correctamente con:
  - Status workflow (6 estados)
  - Numeración automática `INV-YYYY-XXX`
  - Líneas (InvoiceItem)
  - Totales calculados
  - Bloqueo por estado (en state-machine)

- **Quote NO EXISTE** ← 🚨 BLOQUEANTE para flujo comercial

### Patrón Esperado (No Implementado)
```
BaseDocument {
  id, number, date, dueDate/validUntil
  status, companyId, clientId, projectId?
  subtotal, taxAmount, total, currency
  notes, terms
  items[], payments[]?
  createdById, createdAt, updatedAt
}

Heredan: Quote, SalesOrder, Invoice, PurchaseOrder
```

### VEREDICTO: ⚠️ PARCIAL
- Invoice bien implementado
- No hay abstracción base para documentos
- Quote no existe

---

## A4) Finanzas y Números

### 🚨 BLOQUEANTE: Float para dinero

**Campos con Float que DEBEN ser Decimal:**

| Modelo | Campo | Línea |
|--------|-------|-------|
| Invoice | subtotal | 610 |
| Invoice | taxAmount | 611 |
| Invoice | total | 612 |
| Invoice | paidAmount | 616 |
| Invoice | balance | 617 |
| InvoiceItem | quantity | 648 |
| InvoiceItem | unitPrice | 649 |
| InvoiceItem | taxRate | 650 |
| InvoiceItem | subtotal | 653 |
| InvoiceItem | taxAmount | 654 |
| InvoiceItem | total | 655 |
| Payment | amount | 664 |
| Expense | amount | 531 |
| Lead | value | 151 |
| Product | price | 715 |
| Product | cost | 716 |
| Product | taxRate | 717 |
| TaxRate | rate | 746 |

**Total: 17 campos con Float para dinero**

### Estándar Obligatorio
```prisma
// CORRECTO:
subtotal    Decimal @db.Decimal(12, 2)
taxAmount   Decimal @db.Decimal(12, 2)
total       Decimal @db.Decimal(12, 2)

// Reglas:
// - 12 dígitos totales, 2 decimales
// - Redondeo: HALF_UP
// - Cálculos: siempre en backend, nunca en frontend
```

### Cálculo de Impuestos (Actual)
- Par línea: `subtotal = quantity * unitPrice`, `tax = subtotal * rate/100`
- Por total: Suma de líneas
- **PROBLEMA**: No determinista debido a Float

### VEREDICTO: 🔴 BLOQUEANTE
- Imposible usar en producción con Float para dinero
- Migración requerida antes de cualquier uso real

---

## A5) Auditoría

### Situación Actual
- Model `ActivityLog` existe con:
  - userId, action, entityId, details, createdAt
- Helper `auditCrud()` en permissions.ts
- `logActivity()` para registro manual

### Uso Actual
```
auditCrud() llamado en:
- invoices/actions.ts (create, update, delete, changeStatus)
- projects/actions.ts (create, update, delete)
- expenses/actions.ts (create, changeStatus, delete)
- crm/actions.ts (create, updateStage)
- admin/products/actions.ts (create, update, delete)
```

### Problemas
1. **No hay UI de Activity Timeline** ← Los eventos se guardan pero no se muestran
2. **No hay before/after completo** ← Solo se guarda un snapshot
3. **No es inmutable** ← Se puede borrar/modificar

### VEREDICTO: ⚠️ PARCIAL
- Backend implementado
- UI completamente ausente

---

## A6) UX Backoffice

### Componentes Implementados
| Componente | Estado | Calidad |
|------------|--------|---------|
| Sidebar | ✅ | OK |
| Header | ✅ | OK |
| DataTable | ✅ | Bueno (sort, filter, pagination) |
| GlobalSearch | ✅ | Bueno |
| QuickActions | ✅ | Bueno |
| PaymentModal | ✅ | Bueno |
| NotificationCenter | ✅ | OK |

### Páginas por Tipo
| Tipo | Implementadas | Calidad |
|------|---------------|---------|
| List Page | 10+ | ⚠️ Solo invoices usa DataTable bien |
| Detail Page | 5+ | ❌ Sin tabs (Overview/Activity/Attachments) |
| Form Page | 8+ | ⚠️ Validación básica |

### Funcionalidades Faltantes
- ❌ Tabs en detail pages
- ❌ Activity timeline UI
- ❌ Export CSV
- ❌ Import CSV
- ❌ Acciones masivas
- ❌ Columnas configurables

### VEREDICTO: ⚠️ PARCIAL
- Componentes base buenos
- Patrones de página incompletos

---

## A7) Calidad Mínima

### CI/CD
- `.github/workflows/` **NO EXISTE** ← 🚨 BLOQUEANTE
- No hay pipeline de lint, test, build

### Tests
| Tipo | Estado | Archivos |
|------|--------|----------|
| Unit (state-machine) | ✅ | `tests/state-machine.test.ts` (163 líneas) |
| Unit (permissions) | ❌ | Archivo nombrado mal (es state-machine) |
| Integration | ❌ | **NO EXISTE** |
| E2E | ❌ | **NO EXISTE** |

**Nota**: El archivo `tests/permissions.test.ts` en realidad contiene tests de state-machine, no de permissions.

### Coverage
- Vitest configurado ✅
- Coverage: **<5%** estimado

### VEREDICTO: 🔴 BLOQUEANTE
- Sin CI = cualquier push puede romper producción
- Tests insuficientes

---

# ═══════════════════════════════════════════════════════════════
# B) ESPECIFICACIÓN POR MÓDULO
# ═══════════════════════════════════════════════════════════════

## B.1) AUTH

### Modelo de Datos
```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  passwordHash    String
  name            String
  role            Role     @default(WORKER)
  isActive        Boolean  @default(true)
  companyId       String?  // ⚠️ Debería ser NOT NULL
}
```

### Estado Actual
| Item | Estado |
|------|--------|
| Login | ✅ OK |
| Register | ❌ NO (solo manual/seed) |
| Logout | ✅ OK |
| Refresh token | ✅ OK (JWT) |
| Rate limit | ❌ FALTA |
| Session tracking | ❌ FALTA |

### VEREDICTO: ⚠️ PARCIAL (rate limit es BLOQUEANTE)

---

## B.2) USERS & ROLES

### Modelo implementado: ✅
### RBAC aplicado: ✅
### UI Admin: ⚠️ BÁSICA

### Frontend Obligatorio vs Actual
| Pantalla | Estado |
|----------|--------|
| List Page con DataTable | ⚠️ Sin DataTable genérico |
| Detail Page con tabs | ❌ NO |
| Form create/edit | ⚠️ BÁSICO |

---

## B.3) CONTACTS (CLIENTS)

### Modelo
```prisma
model Client { id, name, email, phone, companyName, companyId, status }
model ClientContact { id, clientId, name, email, phone, position, isPrimary }
```

### Estado: ⚠️ PARCIAL
- CRUD: ✅
- RBAC: ⚠️ (getClients no tiene checkPermission)
- UI: ⚠️ BÁSICA

---

## B.4) CRM (LEADS)

### Modelo
```prisma
model Lead {
  id, title, description
  value Float  // ⚠️ BLOQUEANTE: Float
  stage LeadStage // NEW→QUALIFIED→PROPOSAL→NEGOTIATION→CLOSED_WON/LOST
  assignedToId, clientId, companyId
}
```

### State Machine: ✅ Implementada
### RBAC: ✅ Aplicado
### UI Kanban: ⚠️ BÁSICO

### FALTA:
- Conversión Lead → Quote (Quote no existe)

---

## B.5) PRODUCTS/SERVICES

### Modelo
```prisma
model Product {
  id, name, description, sku, type, category
  price Float      // ⚠️ BLOQUEANTE: Float
  cost Float?      // ⚠️ BLOQUEANTE: Float
  taxRate Float    // ⚠️ BLOQUEANTE: Float
  companyId String // ✅ NOT NULL
}
```

### Estado: ✅ OK (excepto Float)
- CRUD Actions: ✅
- RBAC: ✅
- UI Admin: ✅
- Integración Invoice: ✅

---

## B.6) PROJECTS + TASKS + TIME

### Modelos: ✅ Completos
### State Machines: ✅ Task implementada
### RBAC Projects: ✅
### RBAC Tasks: ❌ FALTA
### RBAC TimeEntries: ❌ FALTA

---

## B.7) EXPENSES

### Modelo
```prisma
model Expense {
  amount Float  // ⚠️ BLOQUEANTE: Float
  status ExpenseStatus // PENDING→APPROVED→PAID|REJECTED
}
```

### State Machine: ✅
### RBAC: ✅
### Approval Flow: ✅

---

## B.8) INVOICES + PAYMENTS

### Modelo
```prisma
model Invoice {
  subtotal Float    // ⚠️ BLOQUEANTE
  taxAmount Float   // ⚠️ BLOQUEANTE
  total Float       // ⚠️ BLOQUEANTE
  paidAmount Float  // ⚠️ BLOQUEANTE
  balance Float     // ⚠️ BLOQUEANTE
  status InvoiceStatus
  items InvoiceItem[]
  payments Payment[]
}
```

### Estado (ignorando Float): ✅ MUY BUENO
- CRUD: ✅
- State Machine: ✅
- PDF Generation: ✅
- Payment Modal: ✅
- Auto status update: ✅
- Numeración automática: ✅

### FALTA:
- Email send (marca como SENT pero no envía)

---

## B.9) DOCUMENTS

### Modelo: ✅ Existe
### Upload: ⚠️ BÁSICO
### Versionado: ⚠️ Modelo existe, no implementado
### Shares: ⚠️ Modelo existe, no implementado
### RBAC: ❌ FALTA

---

## B.10) REPORTING

### Dashboard Finance: ✅ NUEVO
- P&L cards
- Monthly trends
- Top clients
- Recent transactions

### Otros: ❌ Solo analytics básico

---

## B.11) QUOTES

### 🚨 NO EXISTE

Modelo requerido:
```prisma
model Quote {
  id            String      @id @default(cuid())
  number        String      @unique // QUO-2024-001
  status        QuoteStatus // DRAFT→SENT→ACCEPTED|REJECTED|EXPIRED
  validUntil    DateTime
  
  companyId     String
  clientId      String
  leadId        String?     // Origen
  
  subtotal      Decimal     @db.Decimal(12, 2)
  taxAmount     Decimal     @db.Decimal(12, 2)
  total         Decimal     @db.Decimal(12, 2)
  
  items         QuoteItem[]
  
  createdById   String
  convertedToInvoiceId String?  // Trazabilidad
}
```

---

# ═══════════════════════════════════════════════════════════════
# C) FLUJOS END-TO-END
# ═══════════════════════════════════════════════════════════════

## C1) Lead → Quote → Invoice → Payment

| Paso | Estado | Detalle |
|------|--------|---------|
| Create Lead | ✅ | CRM pipeline |
| Lead → QUALIFIED | ✅ | State machine |
| Lead → PROPOSAL | ✅ | State machine |
| **Create Quote from Lead** | ❌ | **Quote no existe** |
| Quote → SENT | ❌ | - |
| Quote → ACCEPTED | ❌ | - |
| **Convert Quote → Invoice** | ❌ | **Quote no existe** |
| Invoice → SENT | ✅ | (sin email real) |
| Create Payment | ✅ | PaymentModal |
| Invoice → PAID | ✅ | Auto-update |

### VEREDICTO: 🔴 INCOMPLETO (Quote bloquea flujo comercial)

---

## C2) Project → Tasks → TimeEntries → Invoice

| Paso | Estado |
|------|--------|
| Create Project | ✅ |
| Create Tasks | ✅ |
| Log TimeEntries | ✅ |
| **Invoice from Project** | ⚠️ Manual |

### VEREDICTO: ⚠️ FUNCIONAL pero no automatizado

---

## C3) Expense → Approval → Payment

| Paso | Estado |
|------|--------|
| Create Expense | ✅ |
| Submit for approval | ✅ |
| Approve | ✅ |
| Mark as Paid | ✅ |

### VEREDICTO: ✅ OK

---

# ═══════════════════════════════════════════════════════════════
# D) RESUMEN AUDITORÍA
# ═══════════════════════════════════════════════════════════════

## Estado por Módulo

| Módulo | Backend | RBAC | State | UI | Tests | Total |
|--------|---------|------|-------|-----|-------|-------|
| Auth | ✅ | N/A | N/A | ✅ | ❌ | ⚠️ |
| Users | ✅ | ✅ | N/A | ⚠️ | ❌ | ⚠️ |
| Clients | ✅ | ⚠️ | N/A | ⚠️ | ❌ | ⚠️ |
| CRM/Leads | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Products | ✅ | ✅ | N/A | ✅ | ❌ | ⚠️ |
| Projects | ✅ | ✅ | N/A | ✅ | ❌ | ⚠️ |
| Tasks | ✅ | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| Hours | ✅ | ❌ | N/A | ✅ | ❌ | ⚠️ |
| Expenses | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Invoices | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| Payments | ✅ | ✅ | N/A | ✅ | ❌ | ⚠️ |
| Documents | ⚠️ | ❌ | N/A | ⚠️ | ❌ | ❌ |
| Finance Dash | ✅ | ✅ | N/A | ✅ | ❌ | ⚠️ |
| **Quotes** | ❌ | ❌ | ❌ | ❌ | ❌ | 🔴 |

## Deuda Técnica Crítica

1. **Float para dinero** - Corrupción de datos inevitable
2. **Sin CI** - Regresiones garantizadas
3. **Tests mínimos** - Refactoring peligroso
4. **Rate limit** - Vulnerable a ataques
5. **RBAC incompleto** - 3 módulos sin permisos
6. **Quote inexistente** - Flujo comercial roto

---

**Evaluación Global: 45% COMPLETO (contando solo lo usable)**

El sistema tiene buenos cimientos (RBAC, state machines, UI components) pero está incompleto para uso en producción debido a los BLOQUEANTES identificados.
