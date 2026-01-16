# GESTIÓN — Presupuestos (Quotes con Workflow Completo)

## Objetivo
Crear presupuestos con líneas detalladas, workflow de envío/aprobación, generación de PDF con branding, y conversión automática a factura.

## Permisos (RBAC implementado)
- **MANAGER/ADMIN/SUPERADMIN**: CRUD + aprobar + convertir
- **WORKER**: Lectura solo si participa en proyecto vinculado
- **GUEST**: Sin acceso

## Navegación
### Rutas existentes
- `/quotes` - Lista de presupuestos
- `/quotes/new` - Crear presupuesto
- `/quotes/[id]` - Detalle del presupuesto

## Flujos exactos implementados

### 1. Listar presupuestos
**Server action:** `getQuotes()`
- Filtrado por companyId
- Incluye: client, status, total
- Ordenado por fecha DESC

### 2. Obtener presupuesto
**Server action:** `getQuote(id)`
- Incluye: QuoteItem[], Client, Project
- Calcula totals automáticamente
- **No audita** (lectura)

### 3. Crear presupuesto
**Server action:** `createQuote(data)`
```typescript
{
  clientId: string
  projectId?: string
  leadId?: string
  number?: string      // Auto-generado si no se proporciona
  issueDate: Date
  validUntil: Date
  notes?: string
  items: {
    description: string
    quantity: number
    unitPrice: number
    taxRate: number    // Porcentaje (21 = 21%)
  }[]
}
```

**Flujo:**
1. Genera número secuencial si no se proporciona
2. Crea Quote con status DRAFT
3. Crea QuoteItem[] con cálculos:
   - subtotal = quantity * unitPrice
   - taxAmount = subtotal * (taxRate / 100)
   - total = subtotal + taxAmount
4. Calcula totales del quote
5. Audita: `QUOTE_CREATED`

### 4. Actualizar estado
**Server action:** `updateQuoteStatus(id, status)`
```typescript
status: QuoteStatus // DRAFT | SENT | APPROVED | REJECTED | EXPIRED
```

**Flujo:**
1. Valida transiciones permitidas
2. Si SENT: validar que tenga items
3. Si APPROVED: solo MANAGER+
4. Si REJECTED: requiere motivo (en notes)
5. Audita: `QUOTE_STATUS_CHANGED`
6. Notifica: creador si cambio por otro

### 5. Convertir a factura
**Server action:** `convertQuoteToInvoice(quoteId, dueDate)`

**Flujo crítico:**
1. Valida que quote.status == APPROVED
2. Crea Invoice clonando:
   - Mismos clientId, projectId
   - InvoiceItem[] desde QuoteItem[]
   - status: DRAFT
   - quoteId: referencia al presupuesto
3. Actualiza Quote: marca como "convertido" (flag interno)
4. Audita: `QUOTE_TO_INVOICE` (CRITICAL)
5. Retorna: nueva invoiceId

### 6. Eliminar presupuesto
**Server action:** `deleteQuote(id)`
- Solo si status == DRAFT
- Si ya fue enviado: no permitir eliminación
- Hard delete (cascade items)
- Audita: `QUOTE_DELETED` (WARNING)

### 7. Estadísticas
**Server action:** `getQuoteStats()`
```typescript
{
  total: number
  byStatus: { [status]: count }
  totalValue: Decimal
  conversionRate: number  // APPROVED / TOTAL
}
```

## Estados del presupuesto (enum QuoteStatus)
```prisma
DRAFT      // Borrador
SENT       // Enviado al cliente
APPROVED   // Aprobado por cliente
REJECTED   // Rechazado
EXPIRED    // Caducado (validUntil pasó)
```

## Datos (schema completo)

### Quote
```prisma
model Quote {
  id         String      @id @default(cuid())
  number     String      @unique
  companyId  String
  clientId   String
  projectId  String?
  leadId     String?
  
  status     QuoteStatus @default(DRAFT)
  issueDate  DateTime
  validUntil DateTime
  notes      String?     @db.Text
  
  // Totals (calculados)
  subtotal   Decimal     @default(0) @db.Decimal(12, 2)
  taxTotal   Decimal     @default(0) @db.Decimal(12, 2)
  total      Decimal     @default(0) @db.Decimal(12, 2)
  
  createdById String
  createdBy   User
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  items QuoteItem[]
}
```

### QuoteItem
```prisma
model QuoteItem {
  id          String  @id @default(cuid())
  quoteId     String
  description String
  quantity    Decimal @db.Decimal(10, 2)
  unitPrice   Decimal @db.Decimal(12, 2)
  taxRate     Decimal @default(21) @db.Decimal(5, 2)
  
  // Calculated
  subtotal    Decimal @db.Decimal(12, 2)
  taxAmount   Decimal @db.Decimal(12, 2)
  total       Decimal @db.Decimal(12, 2)
  
  order Int @default(0)
  
  quote Quote @relation(onDelete: Cascade)
}
```

## PDF Generation (pendiente implementación)
**Flujo recomendado:**
1. Botón "Generar PDF"
2. Server action: `generateQuotePDF(quoteId)`
3. Usa template con branding (CompanySettings)
4. Genera PDF con biblioteca (pdfmake, puppeteer)
5. Guarda como Document vinculado
6. Audita: `PDF_GENERATED`

## Notificaciones
- `QUOTE_SENT` - Presupuesto enviado (interno)
- `QUOTE_APPROVED` - Aprobado (al creador)
- `QUOTE_REJECTED` - Rechazado (al creador)
- `QUOTE_EXPIRING` - Caduca en 3 días

## Auditoría
- `QUOTE_CREATED` (INFO)
- `QUOTE_STATUS_CHANGED` (INFO)
- `QUOTE_TO_INVOICE` (CRITICAL)
- `QUOTE_DELETED` (WARNING)
- `PDF_GENERATED` (INFO)

## Criterios de aceptación
- Given quote DRAFT, When se convierte a factura, Then ERROR (debe estar APPROVED)
- Given quote APPROVED, When se convierte, Then crea Invoice con items clonados
- Given quote SENT, When se intenta eliminar, Then ERROR
- Given quote con validUntil pasado, When job ejecuta, Then status = EXPIRED

## Edge cases
- Convertir dos veces: validar que no cree duplicados
- Editar después de SENT: permitir pero auditar
- Items sin cantidad: validar quantity > 0
- Descuentos: añadir discount field en QuoteItem

## Tests mínimos
```typescript
- only_manager_can_approve
- quote_to_invoice_clones_items
- cannot_delete_sent_quote
- expired_quotes_marked_by_job
```

## Integraciones
- **Clientes** (`13_CLIENTS`): Quote.clientId
- **CRM** (`12_CRM`): Quote.leadId vincula a lead
- **Facturas** (`16_INVOICES`): Conversión Quote → Invoice
- **Proyectos** (`14_PROJECTS`): Quote.projectId
- **Documentos** (`09_DOCUMENTS`): PDF guardado como doc

## Mejoras pendientes
- **PDF generation** - Implementar generación automática
- **Email sending** - Enviar por correo al aprobar
- **Client portal** - Cliente aprueba desde portal
- **Discounts** - Descuentos por línea y globales
- **Templates** - Plantillas de presupuestos
- **Versioning** - Versiones del mismo presupuesto
- **Expiry job** - Marcar EXPIRED automáticamente
