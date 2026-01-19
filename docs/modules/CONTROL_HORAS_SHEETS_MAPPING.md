# Control de Horas - Mapping: Sistema Actual → Sheets → Implementación

## Fecha: 2026-01-16
## Versión: 1.0

---

## A) AS-IS: Estado Actual del Proyecto

### Módulo "Registro Horario" (`/hours`)
El proyecto ya tiene un sistema completo de registro de horas funcionando:

#### Rutas existentes:
| Ruta | Función | Roles |
|------|---------|-------|
| `/hours` | Página principal de registro personal | WORKER+ |
| `/hours/daily` | Vista diaria de horas | WORKER+ |
| `/hours/summary` | Resumen personal (mes/año) | WORKER+ |
| `/hours/approvals` | Aprobaciones pendientes | MANAGER+ |
| `/admin/hours` | Vista global con filtros | MANAGER+ |

#### Modelo de datos (`TimeEntry`):
```prisma
model TimeEntry {
  id        String   @id @default(cuid())
  userId    String
  projectId String
  date      DateTime
  hours     Float
  notes     String?
  createdAt DateTime @default(now())
  
  user      User     @relation(...)
  project   Project  @relation(...)
  
  @@index([userId, date])
  @@index([projectId])
}
```

#### Campos clave del Usuario (`User`):
- `department: Department` - Departamento del usuario (enum)
- `dailyWorkHours: Float @default(8.0)` - Jornada diaria configurable

#### Server Actions existentes:
**En `/hours/actions.ts`:**
- `getTimeEntries()` - Listar horas propias con paginación
- `createTimeEntry()` - Crear registro de horas
- `updateTimeEntry()` - Editar registro
- `deleteTimeEntry()` - Eliminar registro
- `submitTimeEntryForApproval()` - Enviar a aprobación
- `approveTimeEntry()` / `rejectTimeEntry()` - Aprobar/rechazar
- `getDailyEntries()` - Horas de un día específico
- `getUserSummary()` - Resumen personal (hoy/semana/mes/año)
- `getProjectHoursSummary()` - Horas por proyecto
- `getPendingApprovals()` - Pendientes de aprobar

**En `/admin/hours/actions.ts`:**
- `getAllUsersHours(filters)` - Vista global con filtros
- `getTeamStats(period)` - Estadísticas de equipo
- `getAllUsers()` - Lista usuarios para filtros
- `getProjects()` - Lista proyectos para filtros
- `getDepartments()` - Lista departamentos para filtros

**En `/hours/summary/actions.ts`:**
- `getUserSummary(year)` - Tabla pivote por proyecto/mes

#### Estados de aprobación (schema no incluye pero actions sí):
El código sugiere workflow: `DRAFT → SUBMITTED → APPROVED/REJECTED`
(Pero el modelo actual NO tiene campo `status` - pendiente migración)

---

## B) SHEETS MODEL: Sistema Actual de Google Sheets

Basado en la especificación del usuario, el sistema de Sheets funciona así:

### Hoja 1: "Mi Hoja Personal" (por trabajador)
Cada trabajador tiene una hoja con:

| Columna | Descripción |
|---------|-------------|
| Fecha | Día del mes (1-31) |
| Lunes...Domingo | Día de la semana |
| Proyecto 1 | Horas imputadas a proyecto 1 |
| Proyecto 2 | Horas imputadas a proyecto 2 |
| ... | Más proyectos |
| Total día | Suma horizontal |
| Notas | Comentarios |

**Agregados mensuales:**
- Total horas reales del mes
- Días laborables del mes
- Horas previstas = días laborables × jornada (ej: 22 × 8 = 176h)
- Diferencia = real - prevista
- Días sin imputar (laborables con 0h)
- Días incompletos (menos de 8h)

### Hoja 2: "Global Trabajadores"
Vista resumen de todos los empleados:

| Columna | Descripción |
|---------|-------------|
| Trabajador | Nombre empleado |
| Departamento | Con color de fondo |
| Último día imputado | Fecha última entrada |
| Días sin imputar | Días laborables sin registro |
| Horas previstas | Según fórmula |
| Horas reales | Suma mes actual |
| Diferencia | Real - Prevista |
| % Cumplimiento | (Real/Prevista) × 100 |
| Enlace | Link a hoja personal |

**Indicadores visuales:**
- 🔴 Rojo: >3 días sin imputar
- 🟡 Ámbar: 1-3 días sin imputar
- 🟢 Verde: Al día

### Hoja 3: "Resumen por Proyecto" (mensual)
| Columna | Descripción |
|---------|-------------|
| Proyecto | Código + Nombre |
| Ene | Horas enero |
| Feb | Horas febrero |
| ... | ... |
| Dic | Horas diciembre |
| Total Año | Suma anual |
| Desglose | Por persona |

### Hoja 4: "Anual por Persona"
Tabla anual con:
- Filas: Trabajadores
- Columnas: Meses (Ene...Dic) + Total
- Valores: Horas reales mensuales

### Fórmulas clave de Sheets:
```
Horas previstas (Opción A - días laborables):
= DIAS_LABORABLES(inicio_mes, fin_mes) × 8

Horas previstas (Opción B - días imputados):
= CONTAR.SI.CONJUNTO(rango_dias, ">0") × 8

Días sin imputar:
= DIAS_LABORABLES(inicio_mes, hoy) - CONTAR.SI(rango_dias, ">0")

Último día imputado:
= MAX.SI.CONJUNTO(columna_fecha, columna_usuario, nombre_usuario)
```

---

## C) MAPPING: Equivalencias Sheets ↔ Sistema

| Métrica Sheets | Fuente en Sistema | Cálculo/Implementación |
|----------------|-------------------|------------------------|
| **Horas día (por proyecto)** | `TimeEntry` agrupado por fecha+proyecto | ✅ Ya existe |
| **Total horas mes** | `SUM(TimeEntry.hours)` WHERE mes | ✅ Existe en `getUserSummary` |
| **Días laborables** | Nuevo cálculo | ⚠️ Implementar util con festivos |
| **Horas previstas** | `diasLaborables × User.dailyWorkHours` | ⚠️ Nuevo cálculo |
| **Diferencia** | `horasReales - horasPrevistas` | ⚠️ Nuevo cálculo |
| **Días sin imputar** | Contar días laborables sin entradas | ⚠️ Nuevo cálculo |
| **Días incompletos** | Días < `dailyWorkHours` | ⚠️ Nuevo cálculo |
| **Último día imputado** | `MAX(TimeEntry.date)` por usuario | ⚠️ Nuevo query |
| **Desglose mensual por proyecto** | `GROUP BY projectId, month` | ✅ Existe en `/summary` |
| **Resumen anual por persona** | `GROUP BY userId, month` | ⚠️ Extender vista |
| **% Cumplimiento** | `(real/prevista) × 100` | ⚠️ Nuevo cálculo |
| **Color departamento** | `Department` enum | ⚠️ Añadir colorHex a config |

### Lo que FALTA implementar:

1. **Cálculo de días laborables** (con festivos configurables)
2. **Vista "Mi Hoja"** tipo calendario mensual
3. **Vista "Equipo/Global"** con métricas agregadas
4. **Vista "Anual por Persona"** tabla pivote
5. **Colores por departamento** en tabla
6. **Alertas visuales** días sin imputar
7. **Export mejorado** (PDF además de CSV)
8. **Settings** para configurar políticas

---

## D) DECISIONES TÉCNICAS

### ✅ LO QUE SE REUTILIZA TAL CUAL

1. **Modelo `TimeEntry`** - No modificar
2. **Rutas existentes** (`/hours`, `/hours/daily`, `/admin/hours`) - No tocar
3. **Server actions de `/hours/actions.ts`** - No modificar
4. **Flujo de registro de horas** - Totalmente intacto
5. **Sistema de aprobación individual** - Funciona para entries individuales

### ⚠️ LO QUE SE AÑADE COMO CAPA AGREGADORA

Nuevas rutas para "Control de Horas":

| Nueva Ruta | Propósito |
|------------|-----------|
| `/control-horas` | Redirect a mi-hoja |
| `/control-horas/mi-hoja` | Vista personal tipo calendario |
| `/control-horas/equipo` | Vista global de equipo |
| `/control-horas/proyectos` | Resumen por proyecto |
| `/control-horas/anual` | Vista anual por persona |

Nuevos server actions en `/control-horas/actions.ts`:
- `getMiHoja(mes, año)` - Datos para vista personal
- `getEquipoResumen(mes, año)` - Datos para vista global
- `getProyectosResumen(rango)` - Datos por proyecto
- `getAnualResumen(año)` - Vista anual
- `getDiasLaborables(mes, año)` - Util con festivos
- `getHoursControlSettings()` - Configuración

Nueva tabla auxiliar (OPCIONAL):
```prisma
model HoursControlSettings {
  id                   String  @id @default("default")
  defaultDailyHours    Float   @default(8.0)
  lockAfterDays        Int     @default(30)
  reminderThresholdDays Int    @default(3)
  approvalFrequency    String  @default("none") // none|weekly|monthly
  calculationMode      String  @default("laborables") // laborables|imputados
  holidays             String  @default("[]") // JSON array de fechas
  updatedAt            DateTime @updatedAt
}
```

Colores de departamentos (hardcoded o en settings):
```typescript
const DEPARTMENT_COLORS = {
  CIVIL_DESIGN: '#2563eb',      // blue
  ELECTRICAL: '#dc2626',        // red
  INSTRUMENTATION: '#16a34a',   // green
  ADMINISTRATION: '#9333ea',    // purple
  IT: '#0891b2',                // cyan
  ECONOMIC: '#ca8a04',          // yellow
  MARKETING: '#db2777',         // pink
  OTHER: '#6b7280'              // gray
};
```

### 🚫 LO QUE NO SE TOCA

1. `TimeEntry` - Modelo intacto
2. `/hours/*` - Rutas existentes intactas
3. `/admin/hours` - Vista admin intacta
4. Lógica de `createTimeEntry` - Registro igual
5. Sistema de aprobación entry-by-entry

---

## E) ARQUITECTURA PROPUESTA

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTROL DE HORAS                          │
│         (Nueva capa de vistas agregadas)                     │
├─────────────────────────────────────────────────────────────┤
│  /control-horas/mi-hoja     → getMiHoja()                   │
│  /control-horas/equipo      → getEquipoResumen()            │
│  /control-horas/proyectos   → getProyectosResumen()         │
│  /control-horas/anual       → getAnualResumen()             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Queries de solo lectura
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRO HORARIO                          │
│              (Sistema existente - NO TOCAR)                  │
├─────────────────────────────────────────────────────────────┤
│  /hours           → Registro personal                        │
│  /hours/daily     → Vista diaria                            │
│  /hours/summary   → Resumen personal                        │
│  /hours/approvals → Aprobar entries                         │
│  /admin/hours     → Vista global admin                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      TimeEntry                               │
│                 (Tabla - FUENTE DE VERDAD)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## F) PRIORIDADES DE IMPLEMENTACIÓN

### Fase 1: Foundation (OBLIGATORIO)
1. ✅ Crear `/control-horas/actions.ts` con queries agregadas
2. ✅ Implementar `getDiasLaborables()` utility
3. ✅ Implementar `getMiHoja()` con métricas completas
4. ✅ Crear UI `/control-horas/mi-hoja/page.tsx`

### Fase 2: Vistas Globales
5. ✅ Implementar `getEquipoResumen()`
6. ✅ Crear UI `/control-horas/equipo/page.tsx`
7. ✅ Implementar colores departamento

### Fase 3: Reportes
8. ✅ Implementar `getProyectosResumen()`
9. ✅ Crear UI `/control-horas/proyectos/page.tsx`
10. ✅ Implementar `getAnualResumen()`
11. ✅ Crear UI `/control-horas/anual/page.tsx`

### Fase 4: Mejoras
12. ⬜ Settings de políticas (opcional)
13. ⬜ Workflow aprobación mensual (opcional)
14. ⬜ Export PDF (opcional)
15. ⬜ Festivos configurables (opcional)

---

## G) CRITERIOS DE ACEPTACIÓN

- [ ] `/hours` sigue funcionando exactamente igual
- [ ] `/admin/hours` sigue funcionando exactamente igual
- [ ] `/control-horas/mi-hoja` muestra calendario mes con horas por día
- [ ] `/control-horas/mi-hoja` calcula horas previstas vs reales
- [ ] `/control-horas/mi-hoja` muestra días sin imputar
- [ ] `/control-horas/equipo` muestra tabla tipo "Global" de Sheets
- [ ] `/control-horas/equipo` muestra último día imputado por usuario
- [ ] `/control-horas/equipo` usa colores por departamento
- [ ] `/control-horas/proyectos` muestra resumen por proyecto
- [ ] `/control-horas/anual` muestra tabla anual por persona
- [ ] Permisos: WORKER solo ve su hoja, MANAGER+ ve equipo
- [ ] No hay errores de TypeScript
- [ ] Build exitoso
