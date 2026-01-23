# Configuración — Menú (solo SUPERADMIN)

## Objetivo
Permitir configurar el sidebar (orden, visibilidad y renombre) sin romper rutas existentes.

## Permisos
- Solo SUPERADMIN.

## Navegación
- `/admin/configuracion/menu`

## Flujos
1. Reordenar módulos.
2. Ocultar/mostrar módulos.
3. Renombrar etiquetas.
4. Guardar -> sidebar se construye desde menuConfig.
5. Restaurar -> vuelve a default.

## Reglas
- Ocultar solo afecta UI (la ruta sigue existiendo y protegida).
- Nunca renombrar rutas por renombrar etiquetas.
- Mantener compatibilidad con enlaces existentes.

## Datos
- Settings.menuConfig (json)

## Auditoría
- `MENU_CHANGE` (CRITICAL)

## Tests
- superadmin_only
- hidden_items_not_rendered
