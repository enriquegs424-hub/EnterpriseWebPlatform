# PRINCIPAL — Inicio (Dashboard)

## Objetivo
Mostrar al usuario su resumen operativo y accesos rápidos.

## Permisos
- Autenticado: WORKER/MANAGER/ADMIN/SUPERADMIN
- Invitado: versión limitada

## Navegación
- `/inicio` (si existe otra home, mantener alias/redirect sin romper)

## Flujos
- Ver “Mi día”:
  - tareas hoy
  - próximos eventos
  - notificaciones recientes
- Acciones rápidas: crear tarea, registrar horas, subir documento, crear proyecto (según permisos)

## Reglas
- Todo filtrado por permisos (proyectos donde es miembro).
- Invitado solo ve documentos públicos + aviso.

## Auditoría
- `VIEW_DASHBOARD` (INFO)

## Tests
- invitado_sees_limited_home
