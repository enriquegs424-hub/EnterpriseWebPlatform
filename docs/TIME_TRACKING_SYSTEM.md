# Sistema de Registro Horario MEP Projects

## Descripción General

Sistema completo y profesional de tracking de horas con aprobaciones, validaciones avanzadas, integración con facturación y reporting comprehensivo.

## Índice

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Componentes Principales](#componentes-principales)
3. [Workflow de Aprobación](#workflow-de-aprobación)
4. [Validaciones de Negocio](#validaciones-de-negocio)
5. [Integraciones](#integraciones)
6. [Export y Reportes](#export-y-reportes)
7. [Guía de Uso](#guía-de-uso)
8. [API Reference](#api-reference)

---

## Arquitectura del Sistema

### Stack Tecnológico

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions, Prisma ORM
- **Base de Datos**: PostgreSQL
- **Autenticación**: NextAuth v5
- **Autorización**: RBAC (Role-Based Access Control)

### Estructura de Archivos

```
src/
├── app/(protected)/hours/
│   ├── page.tsx                      # Dashboard principal
│   ├── daily/                        # Registro diario
│   │   ├── page.tsx
│   │   └── daily-form.tsx
│   ├── summary/                      # Resúmenes
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── approvals/                    # Aprobaciones (MANAGER/ADMIN)
│   │   └── page.tsx
│   └── actions.ts                    # Actions principales (800+ líneas)
│
├── components/hours/
│   ├── AdvancedTimeEntryForm.tsx     # Formulario avanzado
│   ├── Timer.tsx                     # Timer component
│   ├── TimerWrapper.tsx
│   └── actions.ts                    # Timer actions
│
└── lib/
    ├── time-entry-validator.ts       # Validaciones (500+ líneas)
    ├── integrations/
    │   └── time-tracking-integration.ts  # Integración Projects/Invoices
    └── exports/
        └── time-entry-export.ts      # Export CSV/Excel
```

### Modelo de Datos

#### TimeEntry (Schema Actual)

```prisma
model TimeEntry {
  id        String   @id @default(cuid())
  userId    String
  projectId String
  date      DateTime
  hours     Float    // TODO: Migrar a Decimal
  notes     String?
  createdAt DateTime @default(now())

  project   Project  @relation(fields: [projectId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@index([userId, date])
  @@index([projectId])
}
```

#### TimeEntry (Schema Propuesto - Ver TIME_ENTRY_SCHEMA_MIGRATION.md)

```prisma
model TimeEntry {
  id        String   @id @default(cuid())
  userId    String
  projectId String
  date      DateTime
  hours     Decimal  @db.Decimal(6,2)  // ✅ Precisión decimal

  // Time tracking
  startTime String?  // "HH:MM"
  endTime   String?  // "HH:MM"
  notes     String?

  // Billing
  billable   Boolean  @default(true)
  hourlyRate Decimal? @db.Decimal(10,2)
  invoiceId  String?

  // Approval workflow
  status         TimeEntryStatus @default(DRAFT)
  submittedAt    DateTime?
  approvedAt     DateTime?
  approvedBy     String?
  rejectedAt     DateTime?
  rejectedBy     String?
  rejectedReason String?
  approvalNotes  String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  project   Project  @relation(fields: [projectId], references: [id])
  user      User     @relation("UserTimeEntries", fields: [userId], references: [id])
  invoice   Invoice? @relation(fields: [invoiceId], references: [id])
  approver  User?    @relation("ApprovedTimeEntries", fields: [approvedBy], references: [id])
  rejector  User?    @relation("RejectedTimeEntries", fields: [rejectedBy], references: [id])

  @@index([userId, date])
  @@index([projectId])
  @@index([status])
  @@index([invoiceId])
}

enum TimeEntryStatus {
  DRAFT      // Borrador (editable por usuario)
  SUBMITTED  // Enviado para aprobación
  APPROVED   // Aprobado (inmutable, facturable)
  REJECTED   // Rechazado (editable con razón)
}
```

---

## Componentes Principales

### 1. Dashboard Principal ([/hours/page.tsx](../src/app/(protected)/hours/page.tsx))

**Ruta**: `/hours`

**Características**:
- 4 Cards de estadísticas (Hoy, Semana, Mes, Año)
- Barra de progreso mensual
- Gráfico de 12 meses
- Top 5 proyectos del mes
- Enlaces rápidos a Daily y Summary

**Acceso**: WORKER, MANAGER, ADMIN

**Actions Usadas**:
```typescript
getUserSummary(userId?: string): Promise<{
    today: number;
    week: number;
    month: number;
    year: number;
    monthlyTotals: number[];
    topProjects: Array<{ project: Project; hours: number }>;
}>
```

### 2. Registro Diario ([/hours/daily/page.tsx](../src/app/(protected)/hours/daily/page.tsx))

**Ruta**: `/hours/daily`

**Características**:
- Timer integrado para tracking en tiempo real
- Formulario manual de registro
- Lista de entradas del día
- Edición/eliminación (límite 24h)

**Componentes**:
- `TimerWrapper` - Timer con proyecto y notas
- `DailyTimeForm` - Formulario manual
- `EditButton` - Edición inline
- `DeleteButton` - Eliminación con confirmación

### 3. Formulario Avanzado ([/components/hours/AdvancedTimeEntryForm.tsx](../src/components/hours/AdvancedTimeEntryForm.tsx))

**Características**:
- Modo crear/editar
- Toggle rango de horas (start/end) o manual
- Auto-cálculo de horas desde rango
- Toggle billable/non-billable
- Validación client-side y server-side
- Warnings y errors diferenciados
- Dark mode support

**Props**:
```typescript
interface AdvancedTimeEntryFormProps {
    projects: Project[];
    initialData?: Partial<FormData>;
    onSubmit: (data: FormData) => Promise<Result>;
    onCancel?: () => void;
    mode?: 'create' | 'edit';
}
```

### 4. Aprobaciones Pendientes ([/hours/approvals/page.tsx](../src/app/(protected)/hours/approvals/page.tsx))

**Ruta**: `/hours/approvals`

**Acceso**: MANAGER, ADMIN únicamente

**Características**:
- Tabla completa de entradas en estado SUBMITTED
- Checkbox de selección múltiple
- Aprobación individual o masiva
- Rechazo con motivo obligatorio
- Notas de aprobación opcionales
- Filtros por usuario/proyecto/fecha

**Actions Usadas**:
```typescript
getPendingApprovals(): Promise<TimeEntry[]>
approveTimeEntry(id: string, notes?: string): Promise<Result>
rejectTimeEntry(id: string, reason: string): Promise<Result>
bulkApproveTimeEntries(ids: string[], notes?: string): Promise<Result>
```

---

## Workflow de Aprobación

### Estados de TimeEntry

```
DRAFT → SUBMITTED → APPROVED/REJECTED
  ↓                      ↑
  └──────────────────────┘
   (si rechazado, vuelve a DRAFT)
```

### Diagrama de Flujo

```
┌─────────────┐
│ Usuario     │
│ crea entry  │
└──────┬──────┘
       │
       ↓ status: DRAFT
┌─────────────┐
│ Editable    │◄─────────────────┐
│ por usuario │                  │
│ (24h limit) │                  │
└──────┬──────┘                  │
       │                         │
       ↓ submitForApproval()     │
┌─────────────┐                  │
│ SUBMITTED   │                  │
└──────┬──────┘                  │
       │                         │
       ↓                         │
┌─────────────┐                  │
│ Manager     │                  │
│ revisa      │                  │
└──────┬──────┘                  │
       │                         │
    ┌──┴──┐                      │
    │     │                      │
    ↓     ↓                      │
┌────────┐ ┌────────┐            │
│APPROVED│ │REJECTED│────────────┘
│(inmut.)│ │(+reason)
└────┬───┘ └────────┘
     │
     ↓ linkToInvoice()
┌─────────────┐
│ INVOICED    │
│ (invoiceId) │
└─────────────┘
```

### Reglas de Negocio

1. **DRAFT**:
   - Editable por propietario durante 24h
   - Editable por ADMIN siempre
   - MANAGER puede editar con restricciones

2. **SUBMITTED**:
   - Inmutable (no se puede editar)
   - Solo MANAGER/ADMIN pueden aprobar/rechazar
   - No se puede auto-aprobar

3. **APPROVED**:
   - Completamente inmutable
   - Apto para facturación
   - Vinculable a Invoice

4. **REJECTED**:
   - Vuelve a estado editable
   - Incluye motivo de rechazo
   - Usuario puede corregir y reenviar

---

## Validaciones de Negocio

Todas implementadas en [/lib/time-entry-validator.ts](../src/lib/time-entry-validator.ts)

### 1. Validación de Solapamiento (No Overlaps)

**Función**: `validateNoOverlap()`

**Reglas**:
- Detecta si dos rangos de tiempo (startTime-endTime) se solapan
- Compara todas las entradas del mismo usuario en el mismo día
- Algoritmo: `(newStart < existingEnd) AND (newEnd > existingStart)`

**Ejemplo**:
```typescript
// Usuario ya tiene: 09:00 - 13:00
// Intenta crear: 12:00 - 14:00
// ❌ Rechazado: Solapamiento de 12:00 - 13:00
```

### 2. Validación de Límite Diario

**Función**: `validateDailyLimit()`

**Reglas**:
- Cada usuario tiene `dailyWorkHours` (default: 8.0)
- Límite flexible: 1.5× dailyWorkHours (12h para 8h/día)
- Si excede límite: Error
- Si excede normal pero < límite: Warning

**Ejemplo**:
```typescript
// dailyWorkHours = 8.0
// Ya registradas: 7.5h
// Intenta agregar: 3.0h
// Total: 10.5h > 8.0h pero < 12.0h
// ⚠️ Warning: "Total de 10.5h supera la jornada normal de 8h"
```

### 3. Validación de Rango de Fechas

**Función**: `validateDateRange()`

**Reglas**:
- ❌ No fechas futuras
- ❌ No fechas más antiguas de 90 días
- ✅ Fechas dentro del rango permitido

### 4. Validación de Permisos de Edición

**Función**: `validateCanEdit()`

**Reglas**:
- ADMIN: Puede editar cualquier entrada
- Propietario: Solo si status ≠ APPROVED y < 24h desde creación
- MANAGER: Puede editar entradas de su equipo sin límite 24h

### 5. Validación de Eliminación

**Función**: `validateCanDelete()`

**Reglas**:
- No se pueden eliminar entradas APPROVED
- Mismas reglas que edición para el resto

### 6. Validación de Aprobación

**Función**: `validateCanApprove()`

**Reglas**:
- Solo MANAGER/ADMIN pueden aprobar
- Solo se aprueban entradas en estado SUBMITTED
- No se puede auto-aprobar (approver ≠ entry.userId)

---

## Integraciones

### Integración con Projects

Archivo: [/lib/integrations/time-tracking-integration.ts](../src/lib/integrations/time-tracking-integration.ts)

#### Funciones Disponibles

##### 1. `getProjectTotalHours(projectId, filters?)`

Obtiene total de horas de un proyecto con breakdown detallado.

**Retorna**:
```typescript
{
    totalHours: number;
    billableHours: number;
    nonBillableHours: number;
    entriesCount: number;
    hoursByUser: Array<{
        user: User;
        hours: number;
    }>;
    monthlyHours: Array<{
        month: string;
        hours: number;
    }>;
}
```

**Uso en Project Detail Page**:
```typescript
const stats = await getProjectTotalHours(projectId, {
    approvedOnly: true,
    billableOnly: false
});

// Mostrar:
// - Total: {stats.totalHours}h
// - Facturables: {stats.billableHours}h
// - Chart: monthlyHours
// - Team breakdown: hoursByUser
```

##### 2. `getProjectTimeWidget(projectId)`

Widget compacto para dashboard de proyecto.

**Retorna**:
```typescript
{
    weekHours: number;      // Últimos 7 días
    monthHours: number;     // Mes actual
    totalHours: number;     // Total histórico
    lastEntries: TimeEntry[]; // Últimas 5 entradas
}
```

##### 3. `getProjectTimeEntries(projectId, filters?)`

Lista completa de entradas para un proyecto.

**Filtros**:
- `startDate`, `endDate`: Rango de fechas
- `userId`: Filtrar por usuario
- `status`: Filtrar por estado
- `limit`: Límite de resultados

### Integración con Invoices

#### Funciones Disponibles

##### 1. `getBillableHoursForInvoice(params)`

Obtiene horas facturables para crear una invoice.

**Parámetros**:
```typescript
{
    projectId?: string;
    clientId?: string;
    startDate: Date;
    endDate: Date;
    includeInvoiced?: boolean; // Default: false (solo no facturadas)
}
```

**Retorna**:
```typescript
{
    entries: TimeEntry[];        // Entradas individuales
    projectSummaries: Array<{
        project: Project;
        entries: TimeEntry[];
        totalHours: number;
        estimatedAmount: number; // Si tienen hourlyRate
    }>;
    totalHours: number;
    totalAmount: number;
    count: number;
}
```

**Ejemplo de Uso**:
```typescript
// En página de crear invoice
const billable = await getBillableHoursForInvoice({
    clientId: selectedClient.id,
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 0, 31),
    includeInvoiced: false
});

// Mostrar preview:
// "Tienes {billable.totalHours}h facturables para {billable.projectSummaries.length} proyectos"
// Total estimado: €{billable.totalAmount}
```

##### 2. `generateInvoiceLineItemsFromHours(params)`

Genera line items para invoice agrupados según preferencia.

**Parámetros**:
```typescript
{
    projectId?: string;
    clientId?: string;
    startDate: Date;
    endDate: Date;
    groupBy: 'project' | 'user' | 'day';
    hourlyRate: number; // Rate default si entries no tienen rate
}
```

**Retorna**:
```typescript
{
    lineItems: Array<{
        description: string;
        quantity: number;       // hours
        unitPrice: number;      // €/hour
        amount: number;         // quantity × unitPrice
        entryIds: string[];     // Para vincular después
    }>;
    totalHours: number;
    totalAmount: number;
    entryCount: number;
}
```

**Ejemplo groupBy='project'**:
```
Line Item 1:
  description: "Horas de Website Redesign (01/01/2024 - 31/01/2024)"
  quantity: 120.5
  unitPrice: €50.00
  amount: €6,025.00
  entryIds: ['entry1', 'entry2', ...]
```

**Ejemplo groupBy='user'**:
```
Line Item 1:
  description: "Juan Pérez - Website Redesign"
  quantity: 80.0
  unitPrice: €55.00
  amount: €4,400.00

Line Item 2:
  description: "María García - Website Redesign"
  quantity: 40.5
  unitPrice: €45.00
  amount: €1,822.50
```

##### 3. `linkTimeEntriesToInvoice(entryIds, invoiceId)`

Vincula entries a una invoice después de crearla.

**Validaciones**:
- Todas deben estar APPROVED
- Todas deben ser billable
- Ninguna debe estar ya vinculada

**Ejemplo de Flujo Completo**:
```typescript
// 1. Usuario selecciona período
const billable = await getBillableHoursForInvoice({
    clientId: '...',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31')
});

// 2. Usuario revisa y confirma
const lineItems = await generateInvoiceLineItemsFromHours({
    clientId: '...',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    groupBy: 'project',
    hourlyRate: 50.00
});

// 3. Crear invoice
const invoice = await createInvoice({
    clientId: '...',
    items: lineItems.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice
    }))
});

// 4. Vincular entries
await linkTimeEntriesToInvoice(
    lineItems.lineItems.flatMap(item => item.entryIds),
    invoice.id
);

// Ahora las entries tienen invoiceId y no se pueden volver a facturar
```

##### 4. `unlinkTimeEntriesFromInvoice(invoiceId)`

Desvincular entries si invoice es cancelada/anulada.

##### 5. `getInvoiceTimeEntries(invoiceId)`

Ver qué entries están vinculadas a una invoice específica.

---

## Export y Reportes

Archivo: [/lib/exports/time-entry-export.ts](../src/lib/exports/time-entry-export.ts)

### Formatos Disponibles

#### 1. CSV Detallado

**Función**: `exportTimeEntriesToCSV(filters?)`

**Columnas**:
- ID, Fecha, Usuario, Email
- Proyecto, Código Proyecto, Cliente
- Horas, Hora Inicio, Hora Fin
- Facturable, Estado, Notas

**Filtros**:
```typescript
interface ExportFilters {
    projectId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    billable?: boolean;
}
```

**Uso**:
```typescript
const csv = await exportTimeEntriesToCSV({
    projectId: 'abc123',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    billableOnly: true
});

// Descargar
downloadCSV(csv, 'horas_enero_2024.csv');
```

#### 2. Excel (CSV con BOM)

**Función**: `exportTimeEntriesToExcel(filters?)`

Mismo que CSV pero con BOM (Byte Order Mark) para correcta codificación UTF-8 en Excel.

#### 3. Resumen por Proyecto

**Función**: `exportProjectSummaryCSV(filters?)`

**Columnas**:
- Código Proyecto, Nombre Proyecto, Cliente
- Total Horas, Número de Entradas, Promedio Horas/Entrada
- Fila TOTAL al final

**Ejemplo Output**:
```csv
Código Proyecto,Nombre Proyecto,Cliente,Total Horas,Número de Entradas,Promedio Horas/Entrada
PRJ-0001,Website Redesign,Acme Corp,120.50,45,2.68
PRJ-0002,API Development,TechStart,85.25,32,2.66
,TOTAL,,205.75,77,2.67
```

#### 4. Resumen por Usuario

**Función**: `exportUserSummaryCSV(filters?)`

**Columnas**:
- Usuario, Email, Rol, Departamento
- Total Horas, Número de Entradas, Promedio Horas/Día
- Fila TOTAL al final

#### 5. Resumen Mensual

**Función**: `exportMonthlySummaryCSV(year, filters?)`

**Columnas**:
- Mes
- Total Horas, Horas Facturables, Horas No Facturables
- Entradas, Horas Aprobadas, Horas Pendientes
- Fila TOTAL año al final

**Ejemplo Output**:
```csv
Mes,Total Horas,Horas Facturables,Horas No Facturables,Entradas,Horas Aprobadas,Horas Pendientes
enero 2024,165.50,140.00,25.50,68,165.50,0.00
febrero 2024,152.25,130.00,22.25,62,145.00,7.25
...
TOTAL 2024,1842.75,1580.00,262.75,782,1800.50,42.25
```

### Utilidades

#### Generar Nombre de Archivo

```typescript
generateExportFilename('entries', 'csv')
// → "horas_2024-01-15.csv"

generateExportFilename('project-summary', 'xlsx')
// → "resumen-proyectos_2024-01-15.xlsx"
```

#### Descargar en Browser

```typescript
import { downloadCSV } from '@/lib/exports/time-entry-export';

const handleExport = async () => {
    const csv = await exportTimeEntriesToCSV(filters);
    downloadCSV(csv, 'mi-reporte.csv');
};
```

---

## Guía de Uso

### Para Usuarios (WORKER)

#### 1. Registrar Horas Diarias

**Opción A: Timer**
1. Ir a `/hours/daily`
2. Click en "Start Timer"
3. Seleccionar proyecto
4. Trabajar normalmente
5. Click en "Stop" → Se guarda automáticamente

**Opción B: Entrada Manual**
1. Ir a `/hours/daily`
2. Completar formulario:
   - Proyecto
   - Fecha (default: hoy)
   - Horas O rango (inicio-fin)
   - Notas
   - Billable (checkbox)
3. Click "Guardar"

#### 2. Editar/Eliminar Entradas

- Solo dentro de las primeras 24h
- Click en botón "Editar" o "Eliminar" en la lista
- Entradas aprobadas NO se pueden editar

#### 3. Enviar a Aprobación

1. Ir a `/hours`
2. Ver lista de entradas DRAFT
3. Seleccionar entradas a enviar
4. Click "Enviar a aprobación"
5. Estado cambia a SUBMITTED

#### 4. Ver Resúmenes

1. Ir a `/hours/summary`
2. Seleccionar período (día, semana, mes, año)
3. Ver totales y gráficos
4. Exportar si necesario

### Para Managers (MANAGER, ADMIN)

#### 1. Aprobar Horas

1. Ir a `/hours/approvals`
2. Ver tabla de entradas pendientes
3. Revisar cada entrada:
   - Usuario, proyecto, fecha
   - Horas, notas
   - Billable
4. **Aprobar Individual**:
   - Click "Aprobar"
   - Opcional: Agregar notas
5. **Aprobar Múltiples**:
   - Seleccionar checkboxes
   - Click "Aprobar seleccionadas"

#### 2. Rechazar Horas

1. En `/hours/approvals`
2. Click "Rechazar" en entrada
3. **Obligatorio**: Escribir motivo claro
4. Confirmar
5. Usuario recibe notificación con motivo

#### 3. Reportes de Equipo

1. Ir a `/hours/summary`
2. Filtrar por usuario específico o todos
3. Exportar resumen mensual/anual
4. Analizar distribución por proyecto

#### 4. Pre-facturación

1. Ir a `/invoices/new`
2. Seleccionar cliente
3. Click "Importar horas facturables"
4. Revisar período sugerido
5. Ver preview de line items
6. Confirmar y crear invoice

### Para Administradores (ADMIN)

Todas las funciones anteriores +

- Editar cualquier entrada sin límite 24h
- Eliminar entradas aprobadas (con precaución)
- Ver analytics de toda la empresa
- Configurar límites diarios por usuario
- Gestionar hourly rates

---

## API Reference

### Actions Principales

#### `/src/app/(protected)/hours/actions.ts`

##### CRUD Operations

```typescript
// Listar entradas con filtros
getTimeEntries(filters?: TimeEntryFilters): Promise<{
    entries: TimeEntry[];
    total: number;
    pages: number;
    currentPage: number;
}>

// Obtener una entrada
getTimeEntryById(id: string): Promise<TimeEntry>

// Crear entrada
createTimeEntry(data: TimeEntryCreateSchema): Promise<{
    success: boolean;
    entry: TimeEntry;
    warnings: string[];
}>

// Actualizar entrada
updateTimeEntry(id: string, data: TimeEntryUpdateSchema): Promise<{
    success: boolean;
    entry: TimeEntry;
    warnings: string[];
}>

// Eliminar entrada
deleteTimeEntry(id: string): Promise<{
    success: boolean;
    message: string;
}>
```

##### Approval Workflow

```typescript
// Enviar a aprobación
submitTimeEntryForApproval(id: string): Promise<{
    success: boolean;
    message: string;
    entry: TimeEntry;
}>

// Aprobar
approveTimeEntry(id: string, notes?: string): Promise<{
    success: boolean;
    message: string;
    entry: TimeEntry;
}>

// Rechazar
rejectTimeEntry(id: string, reason: string): Promise<{
    success: boolean;
    message: string;
    entry: TimeEntry;
}>

// Aprobación masiva
bulkApproveTimeEntries(ids: string[], notes?: string): Promise<{
    success: boolean;
    message: string;
    succeeded: number;
    failed: number;
}>
```

##### Queries & Reports

```typescript
// Entradas del día
getDailyEntries(date: string): Promise<TimeEntry[]>

// Resumen del usuario
getUserSummary(userId?: string): Promise<{
    today: number;
    week: number;
    month: number;
    year: number;
    monthlyTotals: number[];
    topProjects: Array<{
        project: Project;
        hours: number;
    }>;
}>

// Resumen del proyecto
getProjectHoursSummary(projectId: string, startDate?: Date, endDate?: Date): Promise<{
    totalHours: number;
    billableHours: number;
    nonBillableHours: number;
    entries: number;
    userBreakdown: Array<{
        user: User;
        hours: number;
    }>;
}>

// Aprobaciones pendientes
getPendingApprovals(): Promise<TimeEntry[]>

// Proyectos activos (para dropdowns)
getActiveProjects(): Promise<Project[]>
```

### Validator Functions

#### `/src/lib/time-entry-validator.ts`

```typescript
// Validar solapamiento
validateNoOverlap(params: {
    userId: string;
    date: Date;
    startTime: string;
    endTime: string;
    excludeEntryId?: string;
}): Promise<{
    valid: boolean;
    error?: string;
    conflictingEntry?: TimeEntry;
}>

// Validar límite diario
validateDailyLimit(params: {
    userId: string;
    date: Date;
    hours: number;
    excludeEntryId?: string;
}): Promise<{
    valid: boolean;
    error?: string;
    currentTotal?: number;
    limit?: number;
}>

// Validar rango de fecha
validateDateRange(date: Date): {
    valid: boolean;
    error?: string;
}

// Validar permisos de edición
validateCanEdit(params: {
    entryId: string;
    userId: string;
    userRole: string;
}): Promise<{
    valid: boolean;
    error?: string;
}>

// Validar permisos de eliminación
validateCanDelete(params: {
    entryId: string;
    userId: string;
    userRole: string;
}): Promise<{
    valid: boolean;
    error?: string;
}>

// Validar envío a aprobación
validateCanSubmit(params: {
    entryId: string;
    userId: string;
}): Promise<{
    valid: boolean;
    error?: string;
}>

// Validar aprobación
validateCanApprove(params: {
    entryId: string;
    approverRole: string;
    approverId: string;
}): Promise<{
    valid: boolean;
    error?: string;
    entry?: TimeEntry;
}>

// Calcular horas desde rango
calculateHoursFromTime(startTime: string, endTime: string): number

// Validación completa para crear
validateCreateTimeEntry(params: {
    userId: string;
    projectId: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    hours: number;
}): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
}>

// Validación completa para actualizar
validateUpdateTimeEntry(params: {
    entryId: string;
    userId: string;
    userRole: string;
    projectId: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    hours: number;
}): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
}>
```

---

## Mejores Prácticas

### 1. Registro de Horas

- ✅ Registrar horas diariamente (no esperar al final de semana)
- ✅ Usar timer para tareas largas (> 1h)
- ✅ Agregar notas descriptivas (qué se hizo)
- ✅ Marcar correctamente billable/non-billable
- ✅ Enviar a aprobación semanalmente

### 2. Aprobación

- ✅ Revisar aprobaciones al menos 2 veces por semana
- ✅ Proveer feedback constructivo en rechazos
- ✅ Usar notas de aprobación para contexto
- ✅ No aprobar horas sin revisar el proyecto

### 3. Facturación

- ✅ Solo facturar horas APPROVED
- ✅ Revisar hourly rates antes de generar invoice
- ✅ Usar groupBy='project' para facturas simples
- ✅ Usar groupBy='user' para transparencia con cliente
- ✅ Verificar que todas las horas del período están aprobadas

### 4. Reportes

- ✅ Exportar reportes mensuales para archivo
- ✅ Comparar horas facturables vs no facturables
- ✅ Analizar distribución por proyecto
- ✅ Identificar usuarios con horas pendientes

---

## Troubleshooting

### Error: "No puedes editar esta entrada (límite de 24h superado)"

**Solución**:
- Contactar a tu MANAGER o ADMIN para edición
- En futuro: Editar entradas dentro de 24h

### Error: "Solapamiento detectado con entrada de PRJ-0001 (09:00 - 13:00)"

**Solución**:
- Ajustar horarios para no solapar
- O usar entrada manual sin startTime/endTime

### Error: "Límite diario excedido: 14.0h supera el máximo de 12h"

**Solución**:
- Verificar si hay entradas duplicadas
- Contactar ADMIN para ajustar dailyWorkHours si es necesario
- Distribuir horas en varios días

### Error: "Solo se pueden aprobar entradas en estado SUBMITTED"

**Solución**:
- El usuario debe primero enviar la entrada a aprobación
- Verificar que la entrada no fue ya aprobada/rechazada

### Error: "No se puede eliminar un proyecto con tareas, facturas o horas registradas"

**Solución**:
- Desvincular todas las horas del proyecto (cambiar a otro proyecto)
- O mantener el proyecto y marcarlo como inactivo

---

## Roadmap Futuro

### Fase 1: Funcionalidades Core ✅

- [x] CRUD completo con RBAC
- [x] Validaciones de negocio
- [x] Workflow de aprobación
- [x] Integración Projects
- [x] Integración Invoices
- [x] Export CSV/Excel
- [x] Reportes básicos

### Fase 2: Mejoras UX (Próximo)

- [ ] Notificaciones push/email
- [ ] Recordatorios automáticos (fin de día sin horas)
- [ ] Templates de entradas recurrentes
- [ ] Drag & drop en calendario
- [ ] Mobile app companion

### Fase 3: Analytics Avanzado

- [ ] Dashboard con gráficos interactivos (Chart.js/Recharts)
- [ ] Predicción de horas por proyecto
- [ ] Alertas de proyecto sobre-estimado
- [ ] Comparación períodos (mes actual vs anterior)
- [ ] Export PDF con gráficos

### Fase 4: Integraciones Externas

- [ ] Sincronización con calendarios (Google Calendar, Outlook)
- [ ] Integración con Jira/GitHub (auto-track desde commits/issues)
- [ ] Webhook para sistemas externos
- [ ] API pública REST

---

## Soporte

Para dudas o problemas:
- **Documentación**: Este archivo
- **Schema Migration**: [TIME_ENTRY_SCHEMA_MIGRATION.md](./TIME_ENTRY_SCHEMA_MIGRATION.md)
- **Código**: Comentarios inline en cada archivo
- **Issues**: GitHub Issues del proyecto

---

**Última actualización**: 2024-01-15
**Versión del sistema**: 2.0.0
**Autor**: MEP Projects Development Team
