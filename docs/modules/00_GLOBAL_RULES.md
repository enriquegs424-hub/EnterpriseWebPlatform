# GLOBAL_RULES — Reglas Transversales del Sistema

## Objetivo del módulo
Definir reglas de seguridad, auditoría y comportamiento que aplican a TODOS los módulos del sistema sin excepción.

## Reglas de autenticación y sesión
- Todas las rutas bajo `(protected)` requieren sesión activa.
- Timeout de sesión: configurable (por defecto 24h).
- Refresh token: automático en actividad.
- Logout: limpia sesión y marca presencia OFFLINE.

## RBAC (Role-Based Access Control)
Roles del sistema (enum `Role`):
- **SUPERADMIN**: acceso total multi-compañía (tabla Company).
- **ADMIN**: acceso total dentro de su companyId.
- **MANAGER**: gestión de equipo, proyectos, aprobaciones.
- **WORKER**: operaciones limitadas a recursos asignados.
- **GUEST** (Invitado): modo demo read-only limitado.

### Matriz de permisos base
| Módulo | GUEST | WORKER | MANAGER | ADMIN | SUPERADMIN |
|--------|-------|--------|---------|-------|------------|
| Dashboard | Limitado | Sí | Sí | Sí | Sí |
| Proyectos | No | Solo miembro | Equipo + crear | Todo company | Multi-company |
| Tareas | No | Asignadas | Equipo | Todo | Todo |
| Documentos | PUBLIC only | Permisos | Gestión | Todo | Todo |
| Clientes/CRM | No | Read proyecto | CRUD | CRUD | CRUD |
| Facturación | No | No | Read | CRUD | CRUD |
| Usuarios | No | No | Read | CRUD | CRUD |
| Config/Settings | No | No | No | Algunos | Todo |
| Logs/Audit | No | No | Opcional | Sí | Sí |

## Multi-tenancy (Company)
- Todos los datos filtran por `companyId` automáticamente (excepto SUPERADMIN).
- SUPERADMIN ve selector de compañía en header.
- Aislamiento estricto entre compañías.

## Auditoría obligatoria
Toda acción sensible DEBE registrarse en `ActivityLog`:

### Eventos CRITICAL (severidad alta)
- USER_CREATED, USER_DELETED, ROLE_CHANGE
- BRANDING_CHANGE, MENU_CHANGE
- CLIENT_DELETE, PROJECT_DELETE
- INVOICE_CANCEL, PAYMENT_ADDED
- EXPORT_* (cualquier export de datos)
- CONVERT_TO_CLIENT, QUOTE_TO_INVOICE

### Eventos WARNING
- STATUS_CHANGE (proyectos, tasks, leads, facturas)
- MEMBER_REMOVE, PERMISSION_CHANGE
- DELETE (general)

### Eventos INFO
- CREATE, UPDATE, VIEW_*, LOGIN, LOGOUT

Campos obligatorios en ActivityLog:
```prisma
{
  userId, companyId
  entityType, entityId
  actionType
  before/after (JSON diff)
  severity
  metadata
  createdAt
}
```

## Sistema de notificaciones
- Tabla `Notification` centralizada.
- Tipos: INFO, SUCCESS, WARNING, ERROR.
- linkUrl para navegación directa.
- Badge con contador de no leídas en header.
- Polling cada 30s o WebSocket (pendiente).

## Reglas de datos comunes
- **Soft delete preferido**: usar `deletedAt` en vez de eliminar registros vinculados.
- **Timestamps obligatorios**: `createdAt`, `updatedAt` en todas las tablas principales.
- **Índices**: siempre en `companyId`, claves foráneas y campos de búsqueda frecuente.

## Validaciones frontend + backend
- Nunca confiar en validación cliente.
- Server actions validan permisos, formato y lógica de negocio.
- Errores devuelven `{ error: string }`.

## Campos internationalizables
- Moneda: usar Company.currency.
- Timezone: usar Company.timezone.
- Idioma: (pendiente, estructura lista para i18n).

## Reglas de UI/UX
- Tema dark/light persistente en User.preferences.
- Sidebar colapsable y estado persistente.
- Loading states obligatorios en fetch.
- Error boundaries en componentes críticos.

## Documentos y archivos
- Versionado automático si se sube archivo con mismo nombre.
- Carpeta PUBLIC accesible para GUEST.
- Permisos granulares en DocumentShare.
- Integración con proyectos: carpeta auto-created.

## Presencia (nueva feature)
- Sistema tipo Teams con 6 estados.
- Heartbeat cada 30s actualiza `lastActiveAt`.
- Idle (5 min) → AWAY automático.
- Cerrar navegador → OFFLINE (best effort).

## Reglas de testing
Tests mínimos por módulo:
- RBAC: verificar que roles inferiores no accedan.
- Auditoría: verificar que eventos se registran.
- Multi-tenancy: verificar aislamiento entre companies.

## Configuración global (CompanySettings)
Campos típicos:
- Branding (logos, colores, nombre).
- Configuración de menú.
- Políticas (días para bloquear edición, etc.).
- Integraciones (SMTP, storage).

## Edge cases comunes
- Usuario sin companyId (solo SUPERADMIN o seeds).
- Invitado: cuenta especial protegida (no se puede eliminar/cambiar rol).
- Concurrencia: último write gana (optimistic locking pendiente).

## Aceptación general
- Given usuario sin sesión, When accede a /protected/*, Then redirect a login.
- Given WORKER, When intenta acceder a recurso fuera de su alcance, Then 403.
- Given acción auditada, When se ejecuta, Then debe existir log correspondiente.
