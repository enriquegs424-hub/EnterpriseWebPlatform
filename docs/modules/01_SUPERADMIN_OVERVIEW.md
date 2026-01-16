# SUPERADMIN — Panel de Control Global

## Objetivo
Dashboard ejecutivo para SUPERADMIN que gestiona múltiples compañías y tiene vista panorámica del sistema entero.

## Usuarios y permisos
- **Solo SUPERADMIN**.
- No tiene `companyId` (null) o puede switchear entre compañías.

## Navegación
### Rutas existentes
- `/superadmin` - Dashboard principal
- `/superadmin/companies` - Listado de compañías
- `/superadmin/companies/[id]/settings` - Configuración por compañía

### Rutas adicionales (recomendadas)
- `/superadmin/logs` - Ver especificado en `02_SUPERADMIN_LOGS`
- `/superadmin/stats` - Métricas agregadas
- `/superadmin/migrations` - Control de migraciones (si aplica)

## Flujos exactos
### Dashboard SUPERADMIN (`/superadmin`)
1. Al abrir, muestra:
   - Total de compañías activas
   - Usuarios totales (agregado)
   - Proyectos activos (agregado)
   - Facturas emitidas último mes (agregado)
2. Gráficos de crecimiento.
3. Selector de compañía en header.
4. Acceso rápido a:
   - Ver logs globales
   - Gestionar compañías
   - Ver usuarios cross-company

### Gestionar compañías (`/superadmin/companies`)
1. Lista todas las Company con estado (isActive).
2. Puede crear nueva compañía:
   - Asigna slug único
   - Configura timezone/currency
   - Crea usuario ADMIN inicial para esa company
3. Puede editar settings de cada company.
4. Puede desactivar compañía (soft delete via isActive: false).
5. Audita con `COMPANY_CREATE/UPDATE/DEACTIVATE`.

### Configuración de compañía (`/superadmin/companies/[id]/settings`)
1. Edita CompanySettings específicas:
   - Branding
   - Límites  (users, projects, storage)
   - Features habilitados
2. Guarda -> audita `COMPANY_SETTINGS_CHANGE`.

## Reglas de negocio
- SUPERADMIN **NO** está limitado por `companyId` en queries.
- Puede ver y modificar datos de cualquier compañía.
- Al crear company, debe crear admin inicial y seed data (categorías, estados, etc.).
- Desactivar company bloquea login de sus usuarios.

## Datos (entidades)
### Company
```prisma
model Company {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  logo      String?
  taxId     String?  // NIF/CIF
  currency  String   @default("EUR")
  timezone  String   @default("Europe/Madrid")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  users    User[]
  projects Project[]
  clients  Client[]
  settings CompanySettings?
}
```

### CompanySettings
```prisma
model CompanySettings {
  id             String  @id @default(cuid())
  companyId      String  @unique
  company        Company @relation(...)
  
  // Branding
  primaryColor   String?
  logo           String?
  favicon        String?
  
  // Config
  menuConfig     Json?   // orden/visibilidad de módulos
  features       Json?   // flags de features activos
  limits         Json?   // { maxUsers: 50, maxProjects: 100 }
}
```

## Notificaciones
- Opcional: notificar a admin de company cuando SUPERADMIN modifica settings.

## Auditoría (eventos obligatorios)
- `COMPANY_CREATE` (CRITICAL)
- `COMPANY_UPDATE` (WARNING)
- `COMPANY_DEACTIVATE` (CRITICAL)
- `COMPANY_SETTINGS_CHANGE` (WARNING)
- `SUPERADMIN_IMPERSONATE` (CRITICAL, si se implementa switch de company)

## Criterios de aceptación
- Given SUPERADMIN autenticado, When accede a /superadmin, Then ve dashboard con métricas de todas las companies.
- Given SUPERADMIN, When crea nueva company, Then se crea Company + admin user + settings por defecto.
- Given usuario ADMIN, When intenta acceder a /superadmin/*, Then 403.

## Edge cases
- Eliminar company con datos: impedir o soft delete (isActive: false).
- SUPERADMIN sin company asignada: permitido (es su estado normal).
- Cambiar slug de company: puede romper URLs si se usan en integraciones.

## Tests mínimos
- superadmin_only_access
- create_company_creates_admin_and_settings
- deactivate_company_blocks_user_login
- non_superadmin_gets_403

## Integraciones con otros módulos
- **Branding** (`03_SETTINGS_APPEARANCE_BRANDING`): SUPERADMIN puede editar por company.
- **Logs** (`02_SUPERADMIN_LOGS`): acceso cross-company.
- **Usuarios** (`17_USERS`): puede gestionar usuarios de cualquier company.
