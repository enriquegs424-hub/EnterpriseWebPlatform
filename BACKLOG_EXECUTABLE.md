# MEP Projects - Backlog Ejecutable (Auditoría Brutal)

> **Priorización**: P0 = BLOQUEANTE, P1 = Hace usable, P2 = Mejora  
> **Modo**: SINGLE-COMPANY (multiempresa-ready)

---

# 🔴 BLOQUEANTES P0 (RESOLVER PRIMERO)

---

## EPIC 0: Base / CI / Tests

---

### [P0] Migrar Float a Decimal en Schema

- **Tipo**: BLOQUEANTE / Refactor
- **Dependencias**: Ninguna (BLOQUEA TODO)
- **Qué hay ahora**:
  - `Invoice.subtotal Float` (línea 610)
  - `Invoice.taxAmount Float` (línea 611)
  - `Invoice.total Float` (línea 612)
  - `Invoice.paidAmount Float` (línea 616)
  - `Invoice.balance Float` (línea 617)
  - `InvoiceItem.quantity Float` (línea 648)
  - `InvoiceItem.unitPrice Float` (línea 649)
  - `InvoiceItem.taxRate Float` (línea 650)
  - `InvoiceItem.subtotal Float` (línea 653)
  - `InvoiceItem.taxAmount Float` (línea 654)
  - `InvoiceItem.total Float` (línea 655)
  - `Payment.amount Float` (línea 664)
  - `Expense.amount Float` (línea 531)
  - `Lead.value Float` (línea 151)
  - `Product.price Float` (línea 715)
  - `Product.cost Float` (línea 716)
  - `TaxRate.rate Float` (línea 746)
- **Qué falta**:
  - Cambiar TODOS a `Decimal @db.Decimal(12, 2)`
  - `taxRate` y similar a `Decimal @db.Decimal(5, 2)` (para %)
  - Actualizar cálculos en actions para usar Decimal
- **Criterios de aceptación**:
  - [ ] 0 campos Float para dinero en schema
  - [ ] Cálculos deterministas (sin errores de redondeo)
  - [ ] Migración sin pérdida de datos
- **DoD**:
  - [ ] `npx prisma db push` exitoso
  - [ ] Tests de cálculo pasan con casos edge
  - [ ] 99.99 + 0.01 = 100.00 exacto
- **Cómo verificar**:
  ```bash
  grep -c "Float" prisma/schema.prisma  # Debe ser 0 para campos de dinero
  npm test -- --grep "calculation"
  ```
- **Archivos**:
  - `prisma/schema.prisma`
  - `src/app/(protected)/invoices/actions.ts`
  - `src/app/(protected)/expenses/actions.ts`
  - `src/app/(protected)/admin/products/actions.ts`

---

### [P0] Crear CI Pipeline (GitHub Actions)

- **Tipo**: DevOps / BLOQUEANTE
- **Dependencias**: Ninguna
- **Qué hay ahora**: `.github/` NO EXISTE
- **Qué falta**: Pipeline de CI con lint, typecheck, test, build
- **Criterios de aceptación**:
  - [ ] `.github/workflows/ci.yml` creado
  - [ ] Jobs: lint, typecheck, test, build
  - [ ] Triggers: push main, pull_request
  - [ ] Falla si algún job falla
- **DoD**:
  - [ ] Push a main ejecuta pipeline
  - [ ] PR bloqueado si tests fallan
  - [ ] Badge verde en README
- **Cómo verificar**:
  ```bash
  git push origin main
  # Ver Actions tab en GitHub
  ```
- **Archivos**:
  - `.github/workflows/ci.yml` (NUEVO)
  - `README.md` (agregar badge)

**Contenido mínimo de ci.yml:**
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test -- --run
      - run: npm run build
```

---

### [P0] Implementar Rate Limiting en Auth

- **Tipo**: Security / BLOQUEANTE
- **Dependencias**: Ninguna
- **Qué hay ahora**: Auth sin protección de fuerza bruta
- **Qué falta**: Límite de intentos fallidos
- **Criterios de aceptación**:
  - [ ] Max 5 intentos por IP/email en 15 min
  - [ ] Bloqueo temporal tras exceder
  - [ ] Log de intentos bloqueados
  - [ ] Mensaje user-friendly
- **DoD**:
  - [ ] 6 logins fallidos = 429 Too Many Requests
  - [ ] Desbloqueo automático tras 15 min
- **Cómo verificar**:
  ```bash
  # Script de prueba
  for i in {1..6}; do
    curl -X POST localhost:3000/api/auth/callback/credentials \
      -d "email=test@test.com&password=wrong"
  done
  # El 6º debe retornar 429
  ```
- **Archivos**:
  - `src/middleware.ts`
  - `src/lib/rate-limit.ts` (NUEVO)

---

### [P0] Escribir Tests Reales de Permissions

- **Tipo**: Test / BLOQUEANTE
- **Dependencias**: Ninguna
- **Qué hay ahora**: `tests/permissions.test.ts` contiene tests de STATE MACHINE, no de permissions
- **Qué falta**: Tests para `hasPermission()` y `checkPermission()`
- **Criterios de aceptación**:
  - [ ] Tests para cada rol × cada recurso × cada acción
  - [ ] Tests para "own" permissions
  - [ ] Tests para permission denied logging
- **DoD**:
  - [ ] 40+ test cases para permissions
  - [ ] Coverage >80% de permissions.ts
- **Cómo verificar**:
  ```bash
  npm test -- --grep "permissions" --coverage
  ```
- **Archivos**:
  - `tests/permissions.test.ts` (REESCRIBIR)

---

### [P0] Crear Test de Integración Invoice Flow

- **Tipo**: Test / BLOQUEANTE
- **Dependencias**: Decimal migration
- **Qué hay ahora**: 0 tests de integración
- **Qué falta**: Test que verifica flujo completo
- **Criterios de aceptación**:
  - [ ] Test: Create invoice → agregar items → totales correctos
  - [ ] Test: DRAFT → SENT → add payment → PARTIAL → full payment → PAID
  - [ ] Test: Cálculos de impuestos correctos
  - [ ] Usa database de test (no producción)
- **DoD**:
  - [ ] 4+ tests de integración
  - [ ] Pasan con `npm test`
- **Cómo verificar**:
  ```bash
  npm test -- --grep "invoice flow"
  ```
- **Archivos**:
  - `tests/integration/invoice-flow.test.ts` (NUEVO)
  - `tests/setup.ts` (configurar DB de test)

---

## EPIC 1: Core ERP

---

### [P0] Hacer companyId NOT NULL

- **Tipo**: Refactor / BLOQUEANTE para multiempresa
- **Dependencias**: Ninguna
- **Qué hay ahora**: `companyId String?` (nullable) en Invoice, Expense, Lead
- **Qué falta**: Cambiar a `companyId String` (NOT NULL)
- **Criterios de aceptación**:
  - [ ] Todos los companyId son NOT NULL
  - [ ] Company por defecto en seed
  - [ ] Migración asigna company existente a huérfanos
- **DoD**:
  - [ ] `prisma db push` sin errores
  - [ ] 0 registros con companyId = null
- **Archivos**:
  - `prisma/schema.prisma`
  - `prisma/seed.ts`

---

### [P1] Implementar RBAC en Tasks

- **Tipo**: Security / Fix
- **Dependencias**: Ninguna
- **Qué hay ahora**: `tasks/actions.ts` SIN `checkPermission()`
- **Qué falta**: Agregar verificación de permisos
- **Criterios de aceptación**:
  - [ ] `checkPermission("tasks", "read")` en getTasks
  - [ ] `checkPermission("tasks", "create")` en createTask
  - [ ] `checkPermission("tasks", "update", ownerId)` en updateTask
  - [ ] `checkPermission("tasks", "delete", ownerId)` en deleteTask
- **DoD**:
  - [ ] WORKER no puede borrar tarea de otro
  - [ ] CLIENT solo ve tareas de sus proyectos
- **Archivos**:
  - `src/app/(protected)/tasks/actions.ts`

---

### [P1] Implementar RBAC en Hours

- **Tipo**: Security / Fix
- **Dependencias**: Ninguna
- **Qué hay ahora**: `hours/actions.ts` SIN `checkPermission()`
- **Qué falta**: Agregar verificación de permisos
- **DoD**:
  - [ ] WORKER solo ve sus propias horas
  - [ ] MANAGER ve horas de su equipo
- **Archivos**:
  - `src/app/(protected)/hours/actions.ts`
  - `src/app/hours/actions.ts`

---

### [P1] Implementar RBAC en Documents

- **Tipo**: Security / Fix
- **Dependencias**: Ninguna
- **Qué hay ahora**: `documents/` SIN `checkPermission()`
- **Qué falta**: Permisos en todas las operaciones
- **Archivos**:
  - `src/app/(protected)/documents/actions.ts`

---

## EPIC 2: Seguridad / Auditoría

---

### [P1] Crear Activity Timeline UI Component

- **Tipo**: UI
- **Dependencias**: Ninguna
- **Qué hay ahora**: ActivityLog en DB pero sin UI
- **Qué falta**: Componente visual de timeline
- **Criterios de aceptación**:
  - [ ] Lista cronológica de eventos
  - [ ] Iconos por tipo de acción (CREATE, UPDATE, DELETE)
  - [ ] Avatar + nombre de usuario
  - [ ] Timestamp relativo ("hace 2 horas")
  - [ ] Detalles expandibles (before/after)
- **DoD**:
  - [ ] `<ActivityTimeline entityId="xxx" entityType="Invoice" />`
  - [ ] Muestra todos los eventos de la entidad
- **Archivos**:
  - `src/components/ui/ActivityTimeline.tsx` (NUEVO)

---

### [P1] Agregar Timeline a Invoice Detail

- **Tipo**: UI
- **Dependencias**: ActivityTimeline component
- **Qué hay ahora**: Invoice detail sin timeline
- **Qué falta**: Tab "Actividad" con timeline
- **Archivos**:
  - `src/app/(protected)/invoices/[id]/page.tsx`

---

## EPIC 3: UX Backoffice

---

### [P1] Crear Componente Tabs

- **Tipo**: UI
- **Dependencias**: Ninguna
- **Qué hay ahora**: Detail pages sin tabs
- **Qué falta**: Componente reutilizable
- **Criterios de aceptación**:
  - [ ] `<Tabs>` con `<Tab label="..." />` children
  - [ ] Estado controlado (activeTab)
  - [ ] URL persistence (?tab=activity)
  - [ ] Animación suave
  - [ ] Dark mode
- **DoD**:
  - [ ] Componente en `src/components/ui/Tabs.tsx`
  - [ ] Usado en invoice detail
- **Archivos**:
  - `src/components/ui/Tabs.tsx` (NUEVO)

---

### [P1] Implementar Export CSV en DataTable

- **Tipo**: Feature
- **Dependencias**: DataTable existe
- **Qué hay ahora**: Solo visualización
- **Qué falta**: Botón "Exportar CSV"
- **Criterios de aceptación**:
  - [ ] Botón en toolbar DataTable
  - [ ] Exporta columnas visibles
  - [ ] Respeta filtros actuales
  - [ ] Nombre descriptivo del archivo
- **DoD**:
  - [ ] Click → descarga .csv
  - [ ] Abre correctamente en Excel
- **Archivos**:
  - `src/components/DataTable.tsx`

---

### [P2] Implementar Import CSV

- **Tipo**: Feature
- **Dependencias**: Export CSV
- **Qué falta**: Modal de import con mapeo
- **DoD**:
  - [ ] Puede importar 100 productos desde CSV
- **Archivos**:
  - `src/components/CSVImporter.tsx` (NUEVO)

---

### [P2] Implementar Acciones Masivas

- **Tipo**: Feature
- **Dependencias**: DataTable
- **Qué falta**: Checkbox + bulk actions
- **DoD**:
  - [ ] Puede archivar 10 tareas a la vez
- **Archivos**:
  - `src/components/DataTable.tsx`

---

## EPIC 4: Quotes + Flow Comercial

---

### [P1] Crear Modelo Quote

- **Tipo**: Feature
- **Dependencias**: Decimal migration (P0)
- **Qué hay ahora**: NO EXISTE
- **Qué falta**: Modelo completo
- **Criterios de aceptación**:
  ```prisma
  model Quote {
    id            String      @id @default(cuid())
    number        String      @unique
    status        QuoteStatus @default(DRAFT)
    validUntil    DateTime
    
    companyId     String
    company       Company     @relation(...)
    
    clientId      String
    client        Client      @relation(...)
    
    leadId        String?
    lead          Lead?       @relation(...)
    
    subtotal      Decimal     @db.Decimal(12, 2)
    taxAmount     Decimal     @db.Decimal(12, 2)
    total         Decimal     @db.Decimal(12, 2)
    
    notes         String?     @db.Text
    terms         String?     @db.Text
    
    items         QuoteItem[]
    
    createdById   String
    createdBy     User        @relation(...)
    
    createdAt     DateTime    @default(now())
    updatedAt     DateTime    @updatedAt
  }

  model QuoteItem {
    id          String  @id @default(cuid())
    quoteId     String
    quote       Quote   @relation(...)
    
    description String
    quantity    Decimal @db.Decimal(10, 2)
    unitPrice   Decimal @db.Decimal(12, 2)
    taxRate     Decimal @db.Decimal(5, 2)
    
    subtotal    Decimal @db.Decimal(12, 2)
    taxAmount   Decimal @db.Decimal(12, 2)
    total       Decimal @db.Decimal(12, 2)
    
    order       Int     @default(0)
  }

  enum QuoteStatus {
    DRAFT
    SENT
    ACCEPTED
    REJECTED
    EXPIRED
    CONVERTED
  }
  ```
- **DoD**:
  - [ ] `prisma db push` exitoso
  - [ ] Tipos generados
- **Archivos**:
  - `prisma/schema.prisma`

---

### [P1] Crear Quote CRUD Actions

- **Tipo**: Feature
- **Dependencias**: Quote model
- **Qué falta**: Server actions completas
- **Criterios de aceptación**:
  - [ ] `getQuotes()` con filtros y paginación
  - [ ] `getQuote(id)` con items
  - [ ] `createQuote()` con items y cálculos
  - [ ] `updateQuote()` con validación de estado
  - [ ] `changeQuoteStatus()` con state machine
  - [ ] `convertQuoteToInvoice()` con copia de datos
  - [ ] Numeración automática QUO-YYYY-XXX
- **DoD**:
  - [ ] RBAC aplicado (checkPermission)
  - [ ] Audit logging
  - [ ] State machine validation
- **Archivos**:
  - `src/app/(protected)/quotes/actions.ts` (NUEVO)
  - `src/lib/state-machine.ts` (agregar Quote)

---

### [P1] Crear Quote List Page

- **Tipo**: UI
- **Dependencias**: Quote actions
- **Qué falta**: Página de lista
- **Criterios de aceptación**:
  - [ ] DataTable con columnas: número, cliente, total, estado, validez
  - [ ] Filtros: estado, cliente, fecha
  - [ ] Stats cards
  - [ ] Botón "Nuevo Presupuesto"
- **DoD**:
  - [ ] Navegación desde sidebar
  - [ ] Responsive
- **Archivos**:
  - `src/app/(protected)/quotes/page.tsx` (NUEVO)

---

### [P1] Crear Quote Form Page

- **Tipo**: UI
- **Dependencias**: Quote List
- **Qué falta**: Formulario con productos
- **DoD**:
  - [ ] Quote creada con items y totales
- **Archivos**:
  - `src/app/(protected)/quotes/new/page.tsx` (NUEVO)

---

### [P1] Implementar Lead → Quote Conversion

- **Tipo**: Feature
- **Dependencias**: Quote CRUD
- **Qué falta**: Botón en Lead detail
- **DoD**:
  - [ ] Lead CLOSED_WON → Quote con datos pre-llenados
- **Archivos**:
  - `src/app/(protected)/crm/[id]/page.tsx`
  - `quotes/actions.ts`

---

### [P1] Implementar Quote → Invoice Conversion

- **Tipo**: Feature
- **Dependencias**: Quote CRUD
- **Qué falta**: Botón en Quote ACCEPTED
- **DoD**:
  - [ ] Quote ACCEPTED → Invoice DRAFT con mismos items
  - [ ] Quote cambia a CONVERTED
- **Archivos**:
  - `quotes/actions.ts`
  - `invoices/actions.ts`

---

## EPIC 5: Reporting Mínimo

---

### [P2] Crear Dashboard Comercial

- **Tipo**: Feature
- **Dependencias**: Quote module
- **Qué falta**: KPIs de ventas
- **DoD**:
  - [ ] Pipeline de quotes (funnel)
  - [ ] Conversion rate
  - [ ] Revenue forecast
- **Archivos**:
  - `src/app/(protected)/analytics/sales/page.tsx` (NUEVO)

---

# ═══════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════

## TOP P0 BLOQUEANTES (Orden de Ejecución)

| # | Tarea | Bloquea |
|---|-------|---------|
| 1 | Migrar Float a Decimal | Todo desarrollo de finanzas |
| 2 | Crear CI Pipeline | Cualquier merge a main |
| 3 | Rate Limiting Auth | Deploy a producción |
| 4 | Tests de Permissions | Seguridad verificable |
| 5 | Test integración Invoice | Refactoring seguro |
| 6 | companyId NOT NULL | Multiempresa futuro |

## CAMINO CRÍTICO

```
[P0] Float → Decimal
        ↓
[P0] CI Pipeline + Tests
        ↓
[P0] Rate Limiting
        ↓
[P1] Quote Model
        ↓
[P1] RBAC completo (tasks, hours, docs)
        ↓
[P1] UI Components (Tabs, Timeline)
        ↓
[P1] Quote Flow completo
        ↓
[P2] Export/Import + Bulk Actions
```

## "NO HACER AÚN" (Distracciones)

- ❌ Multi-currency (solo EUR por ahora)
- ❌ Recurring invoices (después de Quote)
- ❌ Purchase Orders (después de Quote funcional)
- ❌ Helpdesk/Tickets (no prioritario)
- ❌ Webhooks (después de CI estable)
- ❌ API Keys (después de Webhooks)
- ❌ PDF editor (después de flujos completos)
- ❌ Mobile app (web first)
- ❌ AI features (distracción)

---

**⚠️ HASTA RESOLVER LOS 6 BLOQUEANTES P0, EL SISTEMA NO DEBE USARSE CON DATOS REALES.**
