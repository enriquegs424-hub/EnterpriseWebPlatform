# PRINCIPAL — Registro Diario

## Objetivo
Bitácora diaria de trabajo por usuario, exportable y con bloqueo de edición.

## Permisos
- WORKER: propio
- MANAGER: equipo (si setting enabled)
- ADMIN/SUPERADMIN: todo
- Invitado: no

## Rutas
- `/registro`
- `/registro/hoy`
- `/registro/:fecha`

## Flujos
- Editar hoy rápido
- Vincular tareas/proyecto
- Bloqueo edición tras N días

## Export
- mensual PDF/CSV (MANAGER+)

## Auditoría
- DAILYLOG_CREATE/UPDATE/DELETE
- EXPORT_DAILYLOGS
