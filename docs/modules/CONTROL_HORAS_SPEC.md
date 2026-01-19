# Control de Horas - Especificación Funcional

## Fecha: 2026-01-16
## Versión: 1.0
## Basado en: CONTROL_HORAS_SHEETS_MAPPING.md

---

## 1. Resumen Ejecutivo

El módulo **Control de Horas** es una capa de vistas agregadas que consume datos del sistema existente **Registro Horario** (fuente de verdad) para proporcionar:

1. **Vista "Mi Hoja"** - Calendario mensual personal tipo Sheets
2. **Vista "Equipo"** - Dashboard global de trabajadores
3. **Vista "Proyectos"** - Resumen de horas por proyecto
4. **Vista "Anual"** - Tabla anual por persona y mes

> ⚠️ **IMPORTANTE**: Este módulo NO modifica el Registro Horario. Solo lee datos.

---

## 2. Navegación

### Nuevas rutas:
```
/control-horas              → Redirect a /control-horas/mi-hoja
/control-horas/mi-hoja      → Vista personal mensual
/control-horas/equipo       → Vista global de equipo (MANAGER+)
/control-horas/proyectos    → Resumen por proyecto (MANAGER+)
/control-horas/anual        → Vista anual (MANAGER+)
```

### Menú sidebar (sugerido):
```
📊 Control de Horas
  ├── 📅 Mi Hoja
  ├── 👥 Equipo (*)
  ├── 📁 Proyectos (*)
  └── 📈 Anual (*)

(*) Solo visible para MANAGER+
```

---

## 3. Vista "Mi Hoja" (`/control-horas/mi-hoja`)

### 3.1 Permisos
- **WORKER**: Ve solo su propia hoja
- **MANAGER+**: Puede seleccionar usuario (dropdown o parámetro URL)

### 3.2 Controles superiores
- **Selector de mes/año**: Dropdown o date picker (default: mes actual)
- **Selector de usuario**: Solo visible para MANAGER+ (dropdown con usuarios del equipo)
- **Botón "Exportar"**: CSV / PDF

### 3.3 Indicadores resumen (cards)
| Card | Valor | Cálculo |
|------|-------|---------|
| Horas Reales | 142.5 h | `SUM(TimeEntry.hours)` del mes |
| Horas Previstas | 176 h | `diasLaborables × User.dailyWorkHours` |
| Diferencia | -33.5 h | `reales - previstas` |
| Días sin imputar | 4 | Laborables sin entries |
| % Cumplimiento | 81% | `(reales/previstas) × 100` |

### 3.4 Calendario mensual (tabla)
Diseño tipo hoja de cálculo:

| Día | Lun | Proyecto 1 | Proyecto 2 | ... | Total | Notas |
|-----|-----|------------|------------|-----|-------|-------|
| 1 | Mié | 4h | 4h | | 8h | Reunión |
| 2 | Jue | 8h | | | 8h | |
| 3 | Vie | 6h | 2h | | 8h | |
| 4 | Sáb | - | - | | - | (fin de semana) |
| 5 | Dom | - | - | | - | (fin de semana) |
| 6 | Lun | 8h | | | 8h | |
| ... | | | | | | |

**Indicadores visuales por fila:**
- 🟢 Verde: día completo (≥ jornada)
- 🟡 Ámbar: día incompleto (>0 pero < jornada)
- 🔴 Rojo: día laborable sin horas (0h)
- ⚪ Gris: fin de semana o festivo

### 3.5 Totales por proyecto
Debajo del calendario:
```
Proyecto MEP-2024-001: 92h
Proyecto MEP-2024-002: 50.5h
Total mes: 142.5h
```

---

## 4. Vista "Equipo" (`/control-horas/equipo`)

### 4.1 Permisos
- **MANAGER**: Ve usuarios de su departamento
- **ADMIN/SUPERADMIN**: Ve todos los usuarios

### 4.2 Controles superiores
- **Selector de mes/año**
- **Filtro departamento**: Dropdown
- **Búsqueda**: Por nombre
- **Botón "Exportar"**

### 4.3 Tabla de equipo

| Trabajador | Dpto. | Último día | Días sin | Previstas | Reales | Dif. | % | |
|------------|-------|------------|----------|-----------|--------|-----|---|---|
| Juan García | 🔵 Civil | 15 Ene | 🔴 5 | 176h | 120h | -56h | 68% | 🔍 |
| María López | 🔴 Eléctrico | 16 Ene | 🟢 0 | 176h | 178h | +2h | 101% | 🔍 |
| Pedro Ruiz | 🟢 Inst. | 14 Ene | 🟡 2 | 176h | 160h | -16h | 91% | 🔍 |

**Columnas:**
1. **Trabajador**: Nombre completo
2. **Dpto.**: Departamento con color de fondo
3. **Último día**: Fecha del último TimeEntry
4. **Días sin**: Días laborables sin imputar (colorizado)
5. **Previstas**: Horas previstas del mes
6. **Reales**: Horas reales registradas
7. **Dif.**: Diferencia (rojo si negativo)
8. **%**: Porcentaje cumplimiento
9. **🔍**: Link a `/control-horas/mi-hoja?userId=xxx&mes=xxx`

**Colores departamento:**
```typescript
CIVIL_DESIGN:     #2563eb (blue-600)
ELECTRICAL:       #dc2626 (red-600)
INSTRUMENTATION:  #16a34a (green-600)
ADMINISTRATION:   #9333ea (purple-600)
IT:               #0891b2 (cyan-600)
ECONOMIC:         #ca8a04 (yellow-600)
MARKETING:        #db2777 (pink-600)
OTHER:            #6b7280 (gray-500)
```

**Colores "Días sin imputar":**
- 🟢 Verde (0 días): `bg-green-100 text-green-700`
- 🟡 Ámbar (1-3 días): `bg-amber-100 text-amber-700`
- 🔴 Rojo (>3 días): `bg-red-100 text-red-700`

### 4.4 Ordenamiento
- Por defecto: "Días sin imputar" descendente (mostrar primero los problemáticos)
- Clickeable en headers para ordenar por cualquier columna

---

## 5. Vista "Proyectos" (`/control-horas/proyectos`)

### 5.1 Permisos
- **MANAGER+**: Acceso completo

### 5.2 Controles
- **Selector de rango**: Mes actual / Trimestre / Año / Custom
- **Filtro proyecto**: Dropdown multi-select
- **Filtro departamento**: Opcional
- **Botón "Exportar"**

### 5.3 Tabla resumen

| Proyecto | Ene | Feb | Mar | ... | Dic | Total | % |
|----------|-----|-----|-----|-----|-----|-------|---|
| MEP-2024-001 | 320h | 280h | 310h | | | 1,240h | 35% |
| MEP-2024-002 | 150h | 180h | 200h | | | 780h | 22% |
| MEP-2024-003 | 100h | 120h | 90h | | | 450h | 13% |
| ... | | | | | | | |
| **TOTAL** | 870h | 900h | 920h | | | **3,500h** | 100% |

### 5.4 Desglose por persona (expandible)
Al hacer click en un proyecto, expandir para ver:

| Usuario | Horas | % del proyecto |
|---------|-------|----------------|
| Juan García | 450h | 36% |
| María López | 380h | 31% |
| Pedro Ruiz | 410h | 33% |

---

## 6. Vista "Anual" (`/control-horas/anual`)

### 6.1 Permisos
- **MANAGER+**: Acceso completo

### 6.2 Controles
- **Selector de año**
- **Filtro departamento** 
- **Modo**: Horas reales / Diferencias
- **Botón "Exportar"**

### 6.3 Tabla anual por persona

| Trabajador | Dpto. | Ene | Feb | Mar | ... | Dic | Total | Previsto | Dif. |
|------------|-------|-----|-----|-----|-----|-----|-------|----------|------|
| Juan García | Civil | 160h | 152h | 168h | | | 1,920h | 2,080h | -160h |
| María López | Eléctrico | 172h | 168h | 176h | | | 2,100h | 2,080h | +20h |
| ... | | | | | | | | | |
| **TOTAL** | | 2,450h | 2,380h | 2,520h | | | 28,800h | 31,200h | -2,400h |

### 6.4 Indicadores visuales
- Celdas con menos de 80% jornada: fondo ámbar
- Celdas con 0h en mes laboral: fondo rojo
- Totales positivos: verde, negativos: rojo

---

## 7. Cálculos y Fórmulas

### 7.1 Días laborables del mes
```typescript
function getDiasLaborables(año: number, mes: number, festivos: Date[]): number {
  const diasMes = new Date(año, mes + 1, 0).getDate();
  let laborables = 0;
  
  for (let dia = 1; dia <= diasMes; dia++) {
    const fecha = new Date(año, mes, dia);
    const diaSemana = fecha.getDay();
    
    // Excluir sábado (6) y domingo (0)
    if (diaSemana !== 0 && diaSemana !== 6) {
      // Excluir festivos
      const esFestivo = festivos.some(f => 
        f.getDate() === dia && f.getMonth() === mes && f.getFullYear() === año
      );
      if (!esFestivo) laborables++;
    }
  }
  
  return laborables;
}
```

### 7.2 Días sin imputar
```typescript
function getDiasSinImputar(
  userId: string, 
  año: number, 
  mes: number, 
  diasLaborables: number,
  entriesCount: number
): number {
  // Días laborables hasta hoy (si es mes actual)
  const hoy = new Date();
  const esActual = hoy.getFullYear() === año && hoy.getMonth() === mes;
  
  if (esActual) {
    const laborablesHastaHoy = getDiasLaborablesHastaFecha(año, mes, hoy.getDate());
    return laborablesHastaHoy - entriesCount;
  }
  
  return diasLaborables - entriesCount;
}
```

### 7.3 Horas previstas
```typescript
function getHorasPrevistas(
  diasLaborables: number,
  jornadaDiaria: number = 8.0
): number {
  return diasLaborables * jornadaDiaria;
}
```

### 7.4 Último día imputado
```typescript
// En Prisma
const ultimoDia = await prisma.timeEntry.findFirst({
  where: { userId },
  orderBy: { date: 'desc' },
  select: { date: true }
});
```

---

## 8. Server Actions

### 8.1 Archivo: `/control-horas/actions.ts`

```typescript
// Funciones principales
export async function getMiHoja(año: number, mes: number, userId?: string)
export async function getEquipoResumen(año: number, mes: number, departamento?: string)
export async function getProyectosResumen(fechaInicio: Date, fechaFin: Date, proyectos?: string[])
export async function getAnualResumen(año: number, departamento?: string)

// Utilidades
export async function getDiasLaborables(año: number, mes: number)
export async function getHoursSettings()
export async function updateHoursSettings(data: HoursSettingsInput)
```

### 8.2 Tipos de retorno

```typescript
interface MiHojaData {
  diasDelMes: DiaData[];
  horasReales: number;
  horasPrevistas: number;
  diferencia: number;
  diasSinImputar: number;
  diasIncompletos: number;
  porcentajeCumplimiento: number;
  totalesPorProyecto: { projectId: string; projectName: string; hours: number }[];
}

interface DiaData {
  fecha: Date;
  diaSemana: string;
  esLaborable: boolean;
  esFestivo: boolean;
  horasPorProyecto: { projectId: string; projectCode: string; hours: number }[];
  totalHoras: number;
  notas: string[];
  estado: 'completo' | 'incompleto' | 'vacio' | 'no_laborable';
}

interface EquipoResumenItem {
  userId: string;
  userName: string;
  userImage?: string;
  department: string;
  departmentColor: string;
  ultimoDiaImputado: Date | null;
  diasSinImputar: number;
  horasPrevistas: number;
  horasReales: number;
  diferencia: number;
  porcentajeCumplimiento: number;
}
```

---

## 9. Auditoría

Acciones a registrar en `ActivityLog`:

| Acción | Cuándo | Nivel |
|--------|--------|-------|
| `CONTROL_HORAS_VIEW_OTHER` | MANAGER ve hoja de otro | INFO |
| `CONTROL_HORAS_EXPORT` | Cualquier export | WARNING |
| `CONTROL_HORAS_SETTINGS_CHANGE` | Cambio settings | WARNING |

---

## 10. Notificaciones (Fase 2)

Notificaciones opcionales para recordatorios:

| Tipo | Trigger | Destinatario |
|------|---------|--------------|
| `HOURS_REMINDER` | X días sin imputar | WORKER |
| `TEAM_HOURS_ALERT` | Usuario con >Y días sin imputar | MANAGER |

---

## 11. Settings (Opcional - Fase 2)

Configuración editable por ADMIN:

| Setting | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `defaultDailyHours` | Float | 8.0 | Jornada por defecto |
| `lockAfterDays` | Int | 30 | Bloquear edición tras N días |
| `reminderThresholdDays` | Int | 3 | Recordar si >N días sin imputar |
| `approvalFrequency` | Enum | none | none/weekly/monthly |
| `calculationMode` | Enum | laborables | laborables/imputados |
| `holidays` | JSON | [] | Festivos personalizados |

---

## 12. Tests Mínimos

```typescript
describe('Control de Horas', () => {
  // Permisos
  test('WORKER solo ve su propia hoja');
  test('MANAGER puede ver hojas de su departamento');
  test('WORKER no puede acceder a /control-horas/equipo');
  
  // Cálculos
  test('días laborables calcula correctamente excluyendo fines de semana');
  test('días laborables excluye festivos si están configurados');
  test('horas previstas = días laborables × jornada');
  test('diferencia = reales - previstas');
  
  // Datos
  test('getMiHoja retorna todos los días del mes');
  test('getEquipoResumen retorna todos los usuarios del departamento');
  test('último día imputado es correcto');
  test('días sin imputar cuenta solo laborables');
  
  // UI
  test('calendario muestra colores correctos por estado');
  test('tabla equipo ordena por días sin imputar');
  test('export genera CSV/PDF válido');
});
```

---

## 13. Checklist de Implementación

- [ ] Crear `/control-horas/actions.ts`
- [ ] Implementar `getDiasLaborables()`
- [ ] Implementar `getMiHoja()`
- [ ] Crear `/control-horas/mi-hoja/page.tsx`
- [ ] Implementar `getEquipoResumen()`
- [ ] Crear `/control-horas/equipo/page.tsx`
- [ ] Implementar `getProyectosResumen()`
- [ ] Crear `/control-horas/proyectos/page.tsx`
- [ ] Implementar `getAnualResumen()`
- [ ] Crear `/control-horas/anual/page.tsx`
- [ ] Añadir auditoría en exports
- [ ] Añadir colores departamento
- [ ] Añadir rutas al sidebar
- [ ] Verificar build sin errores
- [ ] Test manual de todas las vistas
