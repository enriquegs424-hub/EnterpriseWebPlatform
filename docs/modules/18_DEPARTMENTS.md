# ADMINISTRACIÓN — Departamentos (Organización por Departamentos)

## Objetivo
Organizar usuarios por departamentos para filtrado, reporting y visibilidad de equipo.

## Permisos
- **ADMIN/SUPERADMIN**: Gestión completa
- **MANAGER**: Lectura
- **WORKER/GUEST**: Sin acceso

## Navegación
### Rutas existentes
- `/admin/departments` - TBD (probable)

## Datos implementados

### Department (enum, no tabla separada)
```prisma
enum Department {
  CIVIL_DESIGN      // Diseño y Civil
  ELECTRICAL        // Eléctrico
  INSTRUMENTATION   // Instrumentación y Control
  ADMINISTRATION    // Administración
  IT                // Informática
  ECONOMIC          // Económico
  MARKETING         // Marketing
  OTHER             // Otros
}
```

**Nota:** Department es un ENUM en User, no una tabla separada
- `User.department: Department`
- No hay tabla Department con manager/miembros
- Para gestión avanzada: crear tabla Department

## Uso actual
- Filtro en Control de Horas (`/admin/hours`)
- Filtro en listados de usuarios
- Permisos por departamento (DepartmentPermission table)

## DepartmentPermission
```prisma
model DepartmentPermission {
  id         String     @id
  department Department
  resource   String     // "tasks", "expenses", etc.
  action     String     // "create", "read", "update"
  granted    Boolean    @default(true)
  scope      String?    // "all" | "own" | "department"
}
```

## Mejoras pendientes
- **Department table** - Crear tabla con manager y descripción
- **Department manager** - Líder de departamento
- **Department dashboard** - Métricas por departamento
- **Budget por department** - Control de presupuesto
