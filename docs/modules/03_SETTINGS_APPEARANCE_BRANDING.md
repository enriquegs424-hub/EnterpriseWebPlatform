# Configuración — Apariencia / Branding (solo SUPERADMIN)

## Objetivo
Que SUPERADMIN pueda cambiar imagen corporativa y tema desde UI y que se aplique globalmente sin romper estilos existentes.

## Permisos
- Solo SUPERADMIN.

## Navegación
- `/admin/configuracion/apariencia`

## Flujos
1. SUPERADMIN abre pantalla.
2. Cambia colores/logos en modo previsualización (sin guardar).
3. Pulsa Guardar -> se persiste.
4. App refleja cambios globales (sin FOUC).
5. Puede Restaurar defaults.

## Reglas
- No eliminar Tailwind/CSS actual: se extiende con CSS variables.
- Si Settings no existe: crear defaults equivalentes al look actual.

## Datos (Settings singleton)
- appName, companyName
- logoSidebarUrl, logoHeaderUrl, faviconUrl
- colors: primary, secondary, accent, background, text
- themeDefault: dark|light
- allowUserThemeToggle (bool)
- sidebarMode: normal|compact

## Notificaciones
- Opcional: notificación a admins “Branding actualizado”.

## Auditoría
- `BRANDING_CHANGE` (CRITICAL) con diff completo.

## Aceptación
- Cambio de color afecta sidebar, botones y elementos principales.
- Logos y favicon se actualizan con cache bust.
- Sin parpadeos de tema al cargar.

## Tests
- superadmin_only
- settings_applies_css_variables
