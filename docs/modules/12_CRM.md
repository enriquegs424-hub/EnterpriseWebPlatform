# GESTIÓN — CRM / Leads (Sistema Completo de Gestión de Oportunidades)

## Objetivo
Pipeline de ventas con gestión de leads/oportunidades, seguimiento de etapas, conversión automática a clientes, y estadísticas del proceso comercial.

## Permisos (RBAC implementado)
- **WORKER**: Solo leads asignados (assignedToId)
- **MANAGER**: Leads de su companyId + reasignar
- **ADMIN/SUPERADMIN**: Acceso total
- **GUEST**: Sin acceso (403)

## Navegación
### Rutas existentes
- `/crm` - Landing CRM (dashboard)
- `/crm/leads` - TBD (probable lista leads)
- `/crm/pipeline` - Vista pipeline por etapas
- `/crm/clients` - Lista clientes CRM
-TBD: `/crm/leads/new`, `/crm/leads/:id `

## Flujos exactos implementados

### 1 Listar leads
**Server action:** `getLeads()`
- WORKER: solo assignedToId = currentUser
- MANAGER+: todos de companyId
- Incluye: client vinculado, stage, value

### 2. Crear lead
**Server action:** `createLead(data)`
```typescript
{
  title: string
  description?: string
  value: number
  currency?: string         // Default "EUR"
  probability?: number      // 0-100
  expectedCloseDate?: Date
  stage?: LeadStage        // Default NEW
  clientId?: string
  assignedToId?: string
}
```

**Flujo:**
1. Crea Lead con companyId del usuario
2. Si assignedToId: notifica `LEAD_ASSIGNED`
3. Audita: `LEAD_CREATED`
4. Retorna lead con ID

### 3. Actualizar etapa (pipeline)
**Server action:** `updateLeadStage(id, stage)`
```typescript
stage: LeadStage // NEW | QUALIFIED | PROPOSAL | NEGOTIATION | CLOSED_WON | CLOSED_LOST
```

**Flujo:**
1. Verifica RBAC (MANAGER+ o assignee)
2. Actualiza stage
3. Si CLOSED_WON: puede preparar conversión a cliente
4. Si CLOSED_LOST: marcar motivo de pérdida (manual)
5. Audita: `LEAD_STAGE_CHANGED` (incluye before/after)
6. Notifica: assignee si cambio hecho por otro

### 4. Convertir a cliente
**Implementación:** Proceso manual actualmente
- UI: Botón "Convertir a cliente" en detalle del lead
- Flujo recomendado:
  1. Abrir modal con datos pre-rellenados
  2. Crear Client (`createClient` de módulo Clients)
  3. Client.leadId = leadId (trazabilidad)
  4. Lead.stage = CLOSED_WON
  5. Audita: `CONVERT_TO_CLIENT` (CRITICAL)

### 5. Dashboard CRM
**Server action:** `getCRMDashboardStats()`
```typescript
{
  totalLeads: number
  byStage: { [stage]: count }
  totalValue: Decimal
  conversionRate: number  // WON / (WON + LOST)
  recentLeads: Lead[]
}
```

### 6. CRUD clientes desde CRM
**Server actions integradas:**
- `getClients()` - Lista clientes
- `createClient(data)` - Crear cliente
- `updateClient(id, data)` - Actualizar cliente
- `deleteClient(id)` - Eliminar cliente

**Nota:** Duplica funcionalidad de módulo Clients (`/admin/clients`)
Recomendación: unificar o usar mismas actions

## Reglas de negocio

### Etapas del Lead (enum LeadStage)
```prisma
NEW           // Nuevo, sin contactar
QUALIFIED     // Contactado y calificado
PROPOSAL      // Propuesta enviada
NEGOTIATION   // En negociación
CLOSED_WON    // Ganado/convertido
CLOSED_LOST   // Perdido
```

### Pipeline lógico
```
NEW → QUALIFIED → PROPOSAL → NEGOTIATION → CLOSED_WON
                                          ↘ CLOSED_LOST
```

### Probabilidad
- NEW: 10%
- QUALIFIED: 25%
- PROPOSAL: 50%
- NEGOTIATION: 75%
- CLOSED_WON: 100%
- CLOSED_LOST: 0%

### Valor estimado
- Currency default: "EUR"
- Usado para forecasting
- Weighted value = value * (probability / 100)

## Datos (schema completo)

### Lead
```prisma
model Lead {
  id                String    @id @default(cuid())
  title             String
  description       String?   @db.Text
  value             Decimal   @default(0) @db.Decimal(12, 2)
  currency          String    @default("EUR")
  probability       Int       @default(0)  // 0-100
  expectedCloseDate DateTime?
  stage             LeadStage @default(NEW)
  
  companyId    String
  ownerCompany Company @relation(...)
  
  clientId String?
  client   Client? @relation(...) // Puede vincularse a cliente existente
  
  assignedToId String?
  assignedTo   User?   @relation(...)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  Quote     Quote[]  // Presupuestos del lead
}
```

## Notificaciones
- `LEAD_ASSIGNED` - Lead asignado
- `LEAD_STAGE_CHANGED` - Cambio de etapa (al assignee)
- `LEAD_WON` - Lead ganado (celebración)
- `LEAD_LOST` - Lead perdido

## Auditoría
- `LEAD_CREATED` (INFO)
- `LEAD_UPDATED` (INFO)
- `LEAD_STAGE_CHANGED` (INFO - con diff)
- `CONVERT_TO_CLIENT` (CRITICAL)
- `LEAD_DELETED` (WARNING)

## Criterios de aceptación
- Given WORKER, When accede a leads, Then ve solo sus leads asignados
- Given lead en PROPOSAL, When se cambia a CLOSED_WON, Then puede convertirse a cliente
- Given lead convertido, When se crea cliente, Then cliente tiene leadId para trazabilidad
- Given MANAGER, When reasigna lead, Then nuevo assignee recibe notificación

## Edge cases
- Lead sin assignee: permitido (pool común)
- Lead sin client: permitido (nuevo contacto)
- Convertir lead ya convertido: validar que no cree duplicados
- Valor muy alto: permitido pero flaggear para revisión

## Tests mínimos
```typescript
- worker_only_sees_assigned_leads
- stage_change_creates_audit
- convert_to_client_links_leadid
- manager_can_reassign_leads
```

## Integraciones
- **Clientes** (`13_CLIENTS`): Lead → Cliente conversion
- **Presupuestos** (`15_QUOTES`): Lead puede tener Quote
- **Tareas** (`08_TASKS`): Crear follow-up task desde lead
- **Proyectos** (`14_PROJECTS`): Cliente lleva a proyecto

## Vista Pipeline (`/crm/pipeline`)
Kanban con columnas por stage:
- NEW
- QUALIFIED
- PROPOSAL
- NEGOTIATION
- CLOSED_WON
- CLOSED_LOST

Drag & drop para cambiar etapa

## Mejoras pendientes
- **LeadActivity table** - Timeline de acciones (llamadas, emails, reuniones)
- **Lead scoring** - Puntuación automática basada en comportamiento
- **Automatic follow-ups** - Tasks automáticas segun etapa
- **Email integration** - Rastrear emails en timeline
- **Duplicate detection** - Alertar leads similares
- **Lost reason** - Campo para motivo de pérdida
- **Win probability ML** - Predicción inteligente
