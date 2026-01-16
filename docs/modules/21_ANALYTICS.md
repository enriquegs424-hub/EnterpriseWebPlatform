# ADMINISTRACIÓN — Analytics (Dashboard de Métricas)

## Objetivo
Dashboard de métricas operativas con filtros y exportación para toma de decisiones.

## Permisos
- **MANAGER/ADMIN/SUPERADMIN**: Acceso completo
- **WORKER**: Sin acceso por defecto

## Navegación
### Rutas existentes
- `/analytics` - Dashboard principal

## Métricas implementadas/recomendadas

### Proyectos
- Total proyectos activos/completados
- Proyectos por departamento
- Proyectos por cliente

### Tareas
- Tareas completadas por semana/mes
- Tareas por estado (Kanban metrics)
- Tareas por prioridad
- Tasa de completado

### Finanzas
- Facturas emitidas vs cobradas
- Presupuestos ganados/perdidos
- Revenue por mes/trimestre
- Aging report (facturas vencidas)

### CRM
- Leads por etapa (funnel)
- Conversion rate
- Valor del pipeline
- Leads ganados/perdidos

### Horas
- Horas registradas vs aprobadas
- Horas por proyecto
- Horas por usuario
- Utilización (horas/horas esperadas)

### Documentos
- Documentos cargados por mes
- Storage usado
- Documentos por tipo

## Filtros disponibles
- Rango de fechas
- Proyecto
- Usuario/responsable
- Departamento
- Cliente

## Exportación
- CSV/PDF de reportes
- Auditar: `EXPORT_ANALYTICS`

## Auditoría
- `VIEW_ANALYTICS` (INFO)
- `EXPORT_ANALYTICS` (WARNING)

## Integración
Agrega datos de todos los módulos principales

## Mejoras pendientes
- **Gráficos interactivos** - Charts.js, Recharts
- **Dashboards personalizados** - Por rol/usuario
- **KPIs configurables** - Métricas custom
- **Scheduled reports** - Envío automático por email
- **Compare periods** - YoY, MoM comparisons
