# Time Entry Schema Migration Guide

## Descripción

Este documento describe las migraciones necesarias para mejorar el modelo `TimeEntry` y habilitar el sistema completo de registro horario con aprobaciones, validaciones avanzadas y facturación.

## Estado Actual del Schema

```prisma
model TimeEntry {
  id        String   @id @default(cuid())
  userId    String
  projectId String
  date      DateTime
  hours     Float    // ⚠️ Usar Decimal para precisión
  notes     String?
  createdAt DateTime @default(now())

  project   Project  @relation(fields: [projectId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@index([userId, date])
  @@index([projectId])
}
```

## Campos Faltantes

### 1. Workflow de Aprobación

```prisma
status        TimeEntryStatus @default(DRAFT)
submittedAt   DateTime?
approvedAt    DateTime?
approvedBy    String?
rejectedAt    DateTime?
rejectedBy    String?
rejectedReason String?
approvalNotes  String?

approver      User?    @relation("ApprovedTimeEntries", fields: [approvedBy], references: [id])
rejector      User?    @relation("RejectedTimeEntries", fields: [rejectedBy], references: [id])
```

**Enum necesario:**
```prisma
enum TimeEntryStatus {
  DRAFT      // Borrador (editable por usuario)
  SUBMITTED  // Enviado para aprobación
  APPROVED   // Aprobado (inmutable, facturable)
  REJECTED   // Rechazado (editable con razón)
}
```

### 2. Horarios Precisos

```prisma
startTime String?  // Formato "HH:MM" (ej: "09:00")
endTime   String?  // Formato "HH:MM" (ej: "17:30")
```

**Ventajas:**
- Detectar solapamientos de tiempo
- Calcular horas automáticamente
- Validar horarios lógicos
- Reporting más preciso

### 3. Facturación

```prisma
billable     Boolean  @default(true)
hourlyRate   Decimal? @db.Decimal(10,2)  // Rate específico de esta entrada
invoiceId    String?
invoice      Invoice? @relation(fields: [invoiceId], references: [id])
```

**Ventajas:**
- Separar horas facturables de internas
- Permitir rates variables por entrada
- Vincular horas directamente a facturas
- Calcular ingresos proyectados

### 4. Cambio de Float a Decimal

```prisma
hours Decimal @db.Decimal(6,2)  // En lugar de Float
```

**Razón:** Float tiene problemas de precisión en operaciones aritméticas. Para facturación se necesita precisión exacta.

**Migración:**
```sql
ALTER TABLE "TimeEntry"
ALTER COLUMN "hours" TYPE DECIMAL(6,2);
```

## Migración Completa Propuesta

### Archivo: `prisma/migrations/XXX_enhance_time_entry/migration.sql`

```sql
-- Create TimeEntryStatus enum
CREATE TYPE "TimeEntryStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- Add new columns to TimeEntry
ALTER TABLE "TimeEntry" ADD COLUMN "status" "TimeEntryStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "TimeEntry" ADD COLUMN "startTime" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "endTime" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "billable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "TimeEntry" ADD COLUMN "hourlyRate" DECIMAL(10,2);
ALTER TABLE "TimeEntry" ADD COLUMN "invoiceId" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "submittedAt" TIMESTAMP(3);
ALTER TABLE "TimeEntry" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "TimeEntry" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "TimeEntry" ADD COLUMN "rejectedBy" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "rejectedReason" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "approvalNotes" TEXT;

-- Convert hours from Float to Decimal
ALTER TABLE "TimeEntry" ALTER COLUMN "hours" TYPE DECIMAL(6,2);

-- Create indexes for new columns
CREATE INDEX "TimeEntry_status_idx" ON "TimeEntry"("status");
CREATE INDEX "TimeEntry_approvedBy_idx" ON "TimeEntry"("approvedBy");
CREATE INDEX "TimeEntry_rejectedBy_idx" ON "TimeEntry"("rejectedBy");
CREATE INDEX "TimeEntry_invoiceId_idx" ON "TimeEntry"("invoiceId");

-- Add foreign key for invoice
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign keys for approval workflow
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_approvedBy_fkey"
    FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_rejectedBy_fkey"
    FOREIGN KEY ("rejectedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Schema Prisma Completo Propuesto

```prisma
model TimeEntry {
  id        String   @id @default(cuid())
  userId    String
  projectId String
  date      DateTime
  hours     Decimal  @db.Decimal(6,2)

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
  @@index([approvedBy])
  @@index([rejectedBy])
  @@index([invoiceId])
}

enum TimeEntryStatus {
  DRAFT      // Borrador (editable por usuario)
  SUBMITTED  // Enviado para aprobación
  APPROVED   // Aprobado (inmutable, facturable)
  REJECTED   // Rechazado (editable con razón)
}
```

### Actualizar Modelo User

```prisma
model User {
  // ... existing fields ...

  timeEntries       TimeEntry[] @relation("UserTimeEntries")
  approvedEntries   TimeEntry[] @relation("ApprovedTimeEntries")
  rejectedEntries   TimeEntry[] @relation("RejectedTimeEntries")
}
```

### Actualizar Modelo Invoice

```prisma
model Invoice {
  // ... existing fields ...

  timeEntries TimeEntry[]
}
```

## Pasos de Migración

### 1. Crear Migración

```bash
npx prisma migrate dev --name enhance_time_entry_model
```

### 2. Ejecutar Migración

```bash
npx prisma migrate deploy
```

### 3. Regenerar Cliente Prisma

```bash
npx prisma generate
```

### 4. Actualizar Código Existente

#### Antes:
```typescript
const entry = await prisma.timeEntry.create({
    data: {
        userId: user.id,
        projectId: projectId,
        date: new Date(),
        hours: 8.5,
        notes: "Trabajo en backend"
    }
});
```

#### Después:
```typescript
const entry = await prisma.timeEntry.create({
    data: {
        userId: user.id,
        projectId: projectId,
        date: new Date(),
        hours: 8.5,
        startTime: "09:00",
        endTime: "17:30",
        billable: true,
        status: 'DRAFT',
        notes: "Trabajo en backend"
    }
});
```

### 5. Migrar Datos Existentes (Opcional)

Si ya tienes TimeEntries en producción:

```sql
-- Marcar todas las entradas existentes como aprobadas
UPDATE "TimeEntry" SET
    status = 'APPROVED',
    billable = true,
    approvedAt = createdAt
WHERE status = 'DRAFT';
```

## Compatibilidad Retroactiva

El código en `/src/app/(protected)/hours/actions.ts` está diseñado para ser **compatible con el schema actual Y el schema mejorado**:

- Usa `as any` para campos opcionales que pueden no existir
- Verifica existencia de campos antes de usarlos
- Valores por defecto seguros

### Ejemplo:

```typescript
const entry = await prisma.timeEntry.create({
    data: {
        userId: user.id,
        projectId: validated.projectId,
        date: new Date(validated.date),
        hours: finalHours,
        startTime: validated.startTime || null,
        endTime: validated.endTime || null,
        notes: validated.notes || null,
        billable: validated.billable ?? true,
        status: 'DRAFT' as any, // 'as any' permite compilar sin el campo
    }
});
```

## Ventajas de la Migración

### Para Usuarios
- ✅ Control sobre qué horas se facturan
- ✅ Aprobación de manager antes de facturar
- ✅ Tracking preciso con horarios start/end
- ✅ Transparencia con razones de rechazo
- ✅ Histórico inmutable de horas aprobadas

### Para Managers
- ✅ Dashboard de aprobaciones pendientes
- ✅ Bulk approval de horas
- ✅ Validación antes de facturación
- ✅ Notas de aprobación
- ✅ Reportes de horas por estado

### Para Facturación
- ✅ Solo horas APPROVED son facturables
- ✅ Rates variables por entrada
- ✅ Vinculación directa con invoices
- ✅ Precisión decimal (no Float)
- ✅ Cálculo automático de totales

### Para Sistema
- ✅ Audit trail completo
- ✅ Validaciones de negocio
- ✅ State machine clara (DRAFT→SUBMITTED→APPROVED/REJECTED)
- ✅ Integridad referencial
- ✅ Índices optimizados para queries

## Testing de la Migración

### Test en Development

```bash
# 1. Crear migración
npx prisma migrate dev --name enhance_time_entry_model

# 2. Verificar schema
npx prisma db pull

# 3. Seed con datos de prueba
npx prisma db seed

# 4. Verificar en Prisma Studio
npx prisma studio
```

### Test de Rollback

```bash
# Si algo falla, hacer rollback
npx prisma migrate resolve --rolled-back XXX_enhance_time_entry
```

## Próximos Pasos

1. **Revisar y aprobar** este documento
2. **Crear branch** para la migración
3. **Ejecutar migración** en development
4. **Actualizar tests** unitarios y de integración
5. **Verificar** todas las funcionalidades
6. **Deploy** a staging
7. **Testing** completo en staging
8. **Deploy** a production con backup previo

## Archivos Afectados

- ✅ `prisma/schema.prisma` - Modelo actualizado
- ✅ `/src/app/(protected)/hours/actions.ts` - Ya compatible
- ✅ `/src/components/hours/actions.ts` - Ya compatible
- ✅ `/src/lib/time-entry-validator.ts` - Ya soporta nuevos campos
- ⏳ `/src/components/hours/Timer.tsx` - Necesita actualización UI
- ⏳ `/src/app/(protected)/hours/daily/daily-form.tsx` - Agregar startTime/endTime
- ⏳ `/src/app/(protected)/hours/page.tsx` - Dashboard ya listo
- ⏳ Crear: `/src/app/(protected)/hours/approvals/page.tsx` - Nueva página

## Preguntas Frecuentes

### ¿Puedo ejecutar la migración sin afectar datos existentes?

Sí, la migración es aditiva (agrega campos, no elimina). Los TimeEntries existentes mantendrán sus datos.

### ¿Qué pasa con las horas ya registradas?

Se marcarán como `APPROVED` automáticamente con un script de migración de datos.

### ¿El cambio de Float a Decimal afecta queries?

No, Prisma maneja la conversión automáticamente. Solo mejora la precisión.

### ¿Necesito actualizar todos los formularios?

No inmediatamente. Los campos nuevos son opcionales. Puedes actualizarlos gradualmente.

### ¿Cómo manejo entornos sin la migración?

El código usa `as any` para ser compatible. Simplemente no usará las features nuevas.

## Soporte y Dudas

Para cualquier duda sobre esta migración, contactar al equipo de desarrollo.
