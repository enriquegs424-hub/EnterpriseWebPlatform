# GESTIÓN — Facturas (Invoices con Gestión de Pagos)

## Objetivo
Emitir facturas, registrar pagos parciales/totales, generar PDF con branding, marcar vencidas automáticamente y tracking completo de cobros.

## Permisos (RBAC implementado)
- **MANAGER/ADMIN/SUPERADMIN**: CRUD, emitir, registrar pagos
- **WORKER**: Lectura si participa en proyecto vinculado
- **GUEST**: Sin acceso

## Navegación
### Rutas existentes
- `/invoices` - Lista facturas
- `/invoices/new` - Crear factura
- `/invoices/[id]` - Detalle factura

## Flujos exactos implementados

### 1. Listar facturas
**Server action:** `getInvoices()`
- Filtrado por companyId
- Incluye: client, status, total, balance
- Ordenado por fecha DESC

### 2. Obtener factura
**Server action:** `getInvoice(id)`
- Incluye: InvoiceItem[], Payment[], Client, Project
- Calcula balance automáticamente
- **No audita** (lectura)

### 3. Crear factura
**Server action:** `createInvoice(data)`
```typescript
{
  clientId: string
  projectId?: string
  number?: string       // Auto-generado
  date?: Date          // Default hoy
  dueDate: Date
  notes?: string
  terms?: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    taxRate: number
  }[]
}
```

**Flujo:**
1. Genera número secuencial (INV-2024-001)
2. Crea Invoice con status DRAFT
3. Crea InvoiceItem[] con cálculos
4. Inicializa: paidAmount = 0, balance = total
5. Audita: `INVOICE_CREATED`

### 4. Actualizar estado
**Server action:** `updateInvoiceStatus(id, status)`
```typescript
status: InvoiceStatus // DRAFT | SENT | OVERDUE | PAID | CANCELLED | PARTIAL
```

**Flujo:**
1. Si SENT: marca issuedAt = now()
2. Si CANCELLED: solo ADMIN+ y audita CRITICAL
3. Si PAID: verifica que paidAmount == total
4. Audita: `INVOICE_STATUS_CHANGED`

### 5. Registrar pago
**Server action:** `addPayment(data)`
```typescript
{
  invoiceId: string
  amount: number
  date: Date
  method: PaymentMethod  // CASH | TRANSFER | CARD | CHEQUE | OTHER
  reference?: string
  notes?: string
}
```

**Flujo crítico:**
1. Crea Payment vinculado a invoiceId
2. Actualiza Invoice:
   ```typescript
   paidAmount += payment.amount
   balance = total - paidAmount
   
   if (balance <= 0) {
     status = PAID
     paid At = now()
   } else if (paidAmount > 0) {
     status = PARTIAL
   }
   ```
3. Audita: `PAYMENT_ADDED` (WARNING)
4. Notifica: si balance = 0 → `INVOICE_PAID`

### 6. Eliminar factura
**Server action:** `deleteInvoice(id)`
- Solo si status == DRAFT
- Si SENT o con pagos: no permitir
- Hard delete (cascade items y payments)
- Audita: `INVOICE_DELETED` (CRITICAL)

### 7. Estadísticas
**Server action:** `getInvoiceStats()`
```typescript
{
  total: number
  byStatus: { [status]: count }
  totalValue:Decimal
  totalPaid: Decimal
  totalPending: Decimal
  overdueCount: number
}
```

## Job automático: Marcar vencidas
**Recomendado:** Ejecutar diariamente
```typescript
// Pseudocódigo
WHERE status = SENT 
  AND dueDate < today
  AND balance > 0
→ UPDATE status = OVERDUE
→ Notify managers
→ Audit OVERDUE_SET
```

## Estados (enum InvoiceStatus)
```prisma
DRAFT     // Borrador
SENT      // Enviada al cliente
OVERDUE   // Vencida (dueDate pasó)
PAID      // Pagada completamente
CANCELLED // Cancelada
PARTIAL   // Pago parcial
```

## Datos (schema completo)

### Invoice
```prisma
model Invoice {
  id      String        @id @default(cuid())
  number  String        @unique  // INV-2024-001
  date    DateTime      @default(now())
  dueDate DateTime
  status  InvoiceStatus @default(DRAFT)
  
  companyId String?
  clientId  String
  projectId String?
  
  // Totals
  subtotal   Decimal @db.Decimal(12, 2)
  taxAmount  Decimal @db.Decimal(12, 2)
  total      Decimal @db.Decimal(12, 2)
  currency   String  @default("EUR")
  
  // Payment tracking
  paidAmount Decimal @default(0) @db.Decimal(12, 2)
  balance    Decimal @db.Decimal(12, 2)  // total - paidAmount
  
  notes       String? @db.Text
  terms       String? @db.Text
  createdById String
  
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  issuedAt  DateTime?
  paidAt    DateTime?
  
  items    InvoiceItem[]
  payments Payment[]
}
```

### InvoiceItem
```prisma
model InvoiceItem {
  id          String  @id
  invoiceId   String
  description String
  quantity    Decimal @db.Decimal(10, 2)
  unitPrice   Decimal @db.Decimal(12, 2)
  taxRate     Decimal @db.Decimal(5, 2)
  
  // Calculated
  subtotal    Decimal @db.Decimal(12, 2)
  taxAmount   Decimal @db.Decimal(12, 2)
  total       Decimal @db.Decimal(12, 2)
  
  order Int @default(0)
  
  invoice Invoice @relation(onDelete: Cascade)
}
```

### Payment
```prisma
model Payment {
  id        String        @id
  amount    Decimal       @db.Decimal(12, 2)
  date      DateTime      @default(now())
  method    PaymentMethod @default(TRANSFER)
  reference String?
  notes     String?
  
  invoiceId   String
  invoice     Invoice
  createdById String
  createdBy   User
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Notificaciones
- `INVOICE_DUE_SOON` - Vence en 24/48h
- `INVOICE_OVERDUE` - Pasó la fecha de vencimiento
- `INVOICE_PAID` - Pagada completamente
- `PAYMENT_RECEIVED` - Nuevo pago registrado

## Auditoría
- `INVOICE_CREATED` (INFO)
- `INVOICE_STATUS_CHANGED` (INFO)
- `INVOICE_ISSUED` (INFO - cuando pasa de DRAFT a SENT)
- `PAYMENT_ADDED` (WARNING)
- `INVOICE_CANCELLED` (CRITICAL)
- `INVOICE_DELETED` (CRITICAL)
- `OVERDUE_SET` (INFO - job automático)

## Criterios de aceptación
- Given pago parcial, When se registra, Then status = PARTIAL y balance actualizado
- Given pagos >= total, When se completa, Then status = PAID y paidAt marcado
- Given factura SENT, When dueDate pasa, Then job marca OVERDUE
- Given pago > total, When se intenta, Then advertir overpayment

## Edge cases
- Pago mayor que balance: permitir, marcar "pago en exceso"
- Cancelar factura con pagos: validar o permitir con auditoría crítica
- Múltiples pagos el mismo día: permitir
- Factura sin items: validar antes de emitir

## Tests mínimos
```typescript
- payment_updates_status_to_paid
- overdue_job_marks_expired_invoices
- cannot_delete_invoice_with_payments
- partial_payment_sets_partial_status
```

## Integraciones
- **Clientes** (`13_CLIENTS`): Invoice.clientId
- **Proyectos** (`14_PROJECTS`): Invoice.projectId
- **Presupuestos** (`15_QUOTES`): Creada desde quote
- **Documentos** (`09_DOCUMENTS`): PDF guardado

## Mejoras pendientes
- **PDF generation** - Factura en PDF con branding
- **Recurring invoices** - Facturación recurrente
- **Email sending** - Envío automático por email
- **Payment reminders** - Recordatorios automáticos
- **Credit notes** - Notas de crédito
- **Multi-currency** - Soporte real de divisas
- **Tax reports** - Reportes fiscales automáticos
