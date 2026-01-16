# GESTIÓN — Clientes (Gestión Centralizada de Clientes)

## Objetivo
Ficha completa de clientes con contactos, datos fiscales y acceso a historial (proyectos, presupuestos, facturas, documentos).

## Permisos (RBAC implementado)
- **MANAGER/ADMIN/SUPERADMIN**: CRUD completo
- **WORKER**: Lectura solo si participa en proyectos del cliente
- **GUEST**: Sin acceso (403)

## Navegación
###Rutas existentes
- `/admin/clients` - Lista clientes
- `/crm/clients` - Vista CRM (similar a admin/clients)
- TBD: `/admin/clients/[id]` - Detalle con tabs

## Flujos exactos implementados

### 1. Listar clientes
**Server action:** `getAllClients()` (admin/clients)
- Filtrado automático por companyId
- Incluye: name, email, status, contactos count

### 2. Crear cliente
**Server action:** `createClient(data)`
```typescript
{
  name: string
  email?: string
  phone?: string
  companyName?: string  // Razón social
  address?: string
  industry?: string
  website?: string
  notes?: string
  status?: ClientStatus  // Default ACTIVE
}
```

**Flujo:**
1. Valida campos fiscales básicos
2. Crea Client con companyId
3. Puede tener leadId si viene de conversión
4. Audita: `CLIENT_CREATED`

### 3. Actualizar cliente
**Server action:** `updateClient(id, data)`
- Solo MANAGER+
- Cambios en datos de contacto/fiscales
- Audita: `CLIENT_UPDATED`

### 4. Cambiar estado
**Server action:** `toggleClientStatus(id)`
- Alterna: ACTIVE ↔ INACTIVE
- Clientes INACTIVE no aparecen en dropdowns
- Audita: `CLIENT_STATUS_CHANGED`

## Estado del cliente (enum ClientStatus)
```prisma
ACTIVE    // Cliente activo
INACTIVE  // Cliente inactivo
PROSPECT  // Prospecto (aún no cliente)
```

## Datos (schema completo)

### Client
```prisma
model Client {
  id           String       @id @default(cuid())
  name         String
  email        String?
  phone        String?
  companyName  String?      // Empresa del cliente
  companyId    String?      // Tenant owner
  address      String?
  industry     String?
  website      String?
  notes        String?      @db.Text
  status       ClientStatus @default(ACTIVE)
  isActive     Boolean      @default(true)
  
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  
  // Relations
  projects     Project[]
  contacts     ClientContact[]
  leads        Lead[]
  invoices     Invoice[]
  Quote        Quote[]
}
```

### ClientContact
```prisma
model ClientContact {
  id         String  @id @default(cuid())
  clientId   String
  client     Client  @relation(onDelete: Cascade)
  
  name       String
  email      String?
  phone      String?
  position   String?     // Cargo
  isPrimary  Boolean     @default(false)
  accessCode String?     // Para portal cliente (futuro)
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Tabs del cliente (UI recomendada)

### Tab "Datos" (`/admin/clients/[id]`)
- Información del cliente
- Lista de contactos (CRUD inline)
- Notas

### Tab "Proyectos"
- Projects filtrados por clientId
- Link a cada proyecto

### Tab "Presupuestos"
- Quotes del cliente
- Conversión rate

### Tab "Facturas"
- Invoices del cliente
- Estado de pagos
- Balance total

### Tab "Documentos"
- Documents vinculados (si se implementa doc.clientId)
- Carpeta compartida

## Notificaciones
- Opcionales según negocio
- `CLIENT_UPDATED` - a equipo asignado

## Auditoría
- `CLIENT_CREATED` (INFO)
- `CLIENT_UPDATED` (INFO)
- `CLIENT_STATUS_CHANGED` (INFO)
- `CLIENT_DELETED` (WARNING - si se permite)

## Criterios de aceptación
- Given WORKER sin proyectos del cliente, When intenta ver cliente, Then 403
- Given cliente con facturas, When se intenta eliminar, Then error o soft delete
- Given contacto isPrimary, When se marca otro como primary, Then anterior se desmarca

## Edge cases
- Cliente sin contactos: permitido
- Nombre duplicado: permitir (diferentes companies)
- Email duplicado en contactos: validar por cliente
- Cliente eliminado: soft delete (isActive: false) recomendado

## Tests mínimos
```typescript
- manager_can_create_clients
- worker_can_read_client_only_if_in_project
- toggle_status_changes_active_inactive
- client_contact_crud_works
```

## Integraciones
- **CRM** (`12_CRM`): Lead → Cliente
- **Proyectos** (`14_PROJECTS`): Client en Project.clientId
- **Facturas** (`16_INVOICES`): Client en Invoice.clientId
- **Presupuestos** (`15_QUOTES`): Client en Quote.clientId

## Mejoras pendientes
- **NIF/CIF validation** - Validar formato fiscal
- **Portal cliente** - ClientContact.accessCode para login
- **Duplicate detection** - Sugerir clientes similares
- **Tags/categorías** - Clasificación de clientes
- **Custom fields** - Campos personalizables por company
- **Client health score** - Puntuación de satisfacción
