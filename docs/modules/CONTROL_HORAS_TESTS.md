# Control de Horas - Tests Mínimos

## Fecha: 2026-01-16
## Versión: 1.0

---

## 1. Tests Unitarios

### 1.1 Utilidades de cálculo

```typescript
// test/control-horas/utils.test.ts

import { 
  getDiasLaborables, 
  getDiasSinImputar, 
  getHorasPrevistas,
  calcularDiferencia,
  calcularPorcentaje
} from '@/app/(protected)/control-horas/utils';

describe('getDiasLaborables', () => {
  test('enero 2026 tiene 22 días laborables (sin festivos)', () => {
    const result = getDiasLaborables(2026, 0, []); // Enero
    expect(result).toBe(22);
  });

  test('excluye sábados y domingos', () => {
    // Febrero 2026 empieza en domingo
    const result = getDiasLaborables(2026, 1, []);
    expect(result).toBe(20);
  });

  test('excluye festivos configurados', () => {
    const festivos = [
      new Date(2026, 0, 1),  // 1 enero (jueves)
      new Date(2026, 0, 6),  // 6 enero (martes)
    ];
    const result = getDiasLaborables(2026, 0, festivos);
    expect(result).toBe(20); // 22 - 2 festivos
  });

  test('festivo en fin de semana no resta', () => {
    const festivos = [
      new Date(2026, 0, 4),  // 4 enero (domingo)
    ];
    const result = getDiasLaborables(2026, 0, festivos);
    expect(result).toBe(22); // Sin cambio
  });
});

describe('getDiasSinImputar', () => {
  const mockHoy = new Date(2026, 0, 16); // 16 enero 2026
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockHoy);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('mes actual: cuenta hasta hoy', () => {
    // 16 enero = 12 laborables (1,2,5,6,7,8,9,12,13,14,15,16)
    // Si usuario imputó 10 días
    const result = getDiasSinImputar({
      userId: 'test',
      año: 2026,
      mes: 0,
      diasLaborablesHastaHoy: 12,
      diasConEntries: 10
    });
    expect(result).toBe(2);
  });

  test('mes pasado: cuenta todo el mes', () => {
    const result = getDiasSinImputar({
      userId: 'test',
      año: 2025,
      mes: 11, // Diciembre 2025
      diasLaborables: 22,
      diasConEntries: 20
    });
    expect(result).toBe(2);
  });

  test('0 días sin imputar si todo completo', () => {
    const result = getDiasSinImputar({
      userId: 'test',
      año: 2025,
      mes: 11,
      diasLaborables: 22,
      diasConEntries: 22
    });
    expect(result).toBe(0);
  });
});

describe('getHorasPrevistas', () => {
  test('jornada standard: 22 días × 8h = 176h', () => {
    expect(getHorasPrevistas(22, 8)).toBe(176);
  });

  test('jornada reducida: 22 días × 6h = 132h', () => {
    expect(getHorasPrevistas(22, 6)).toBe(132);
  });

  test('usa jornada del usuario si existe', () => {
    expect(getHorasPrevistas(22, 7.5)).toBe(165);
  });
});

describe('calcularDiferencia', () => {
  test('positiva si reales > previstas', () => {
    expect(calcularDiferencia(180, 176)).toBe(4);
  });

  test('negativa si reales < previstas', () => {
    expect(calcularDiferencia(160, 176)).toBe(-16);
  });

  test('cero si iguales', () => {
    expect(calcularDiferencia(176, 176)).toBe(0);
  });
});

describe('calcularPorcentaje', () => {
  test('100% si completo', () => {
    expect(calcularPorcentaje(176, 176)).toBe(100);
  });

  test('50% si mitad', () => {
    expect(calcularPorcentaje(88, 176)).toBe(50);
  });

  test('0% si sin horas', () => {
    expect(calcularPorcentaje(0, 176)).toBe(0);
  });

  test('maneja división por cero', () => {
    expect(calcularPorcentaje(100, 0)).toBe(0);
  });
});
```

---

## 2. Tests de Server Actions

### 2.1 getMiHoja

```typescript
// test/control-horas/actions.test.ts

import { getMiHoja } from '@/app/(protected)/control-horas/actions';
import { prisma } from '@/lib/prisma';

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn()
}));

describe('getMiHoja', () => {
  const mockUser = {
    id: 'user-1',
    role: 'WORKER',
    companyId: 'company-1',
    dailyWorkHours: 8
  };

  beforeEach(() => {
    (auth as jest.Mock).mockResolvedValue({ user: mockUser });
  });

  test('retorna datos del mes solicitado', async () => {
    // Setup: crear entries de prueba
    await prisma.timeEntry.createMany({
      data: [
        { userId: 'user-1', projectId: 'proj-1', date: new Date(2026, 0, 2), hours: 8 },
        { userId: 'user-1', projectId: 'proj-1', date: new Date(2026, 0, 3), hours: 6 },
      ]
    });

    const result = await getMiHoja(2026, 0); // Enero 2026
    
    expect(result.horasReales).toBe(14);
    expect(result.diasDelMes).toHaveLength(31); // Enero tiene 31 días
    expect(result.diasSinImputar).toBeGreaterThan(0);
  });

  test('WORKER solo puede ver su propia hoja', async () => {
    await expect(
      getMiHoja(2026, 0, 'otro-user-id')
    ).rejects.toThrow('No tienes permiso');
  });

  test('MANAGER puede ver hoja de otro usuario', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { ...mockUser, role: 'MANAGER' }
    });

    const result = await getMiHoja(2026, 0, 'otro-user-id');
    expect(result).toBeDefined();
  });
});
```

### 2.2 getEquipoResumen

```typescript
describe('getEquipoResumen', () => {
  test('WORKER no puede acceder', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'WORKER' }
    });

    await expect(getEquipoResumen(2026, 0)).rejects.toThrow('Sin permiso');
  });

  test('MANAGER ve solo su departamento', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { 
        id: 'manager-1', 
        role: 'MANAGER',
        department: 'IT',
        companyId: 'company-1'
      }
    });

    const result = await getEquipoResumen(2026, 0);
    
    result.forEach(item => {
      expect(item.department).toBe('IT');
    });
  });

  test('ADMIN ve todos los usuarios', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { 
        id: 'admin-1', 
        role: 'ADMIN',
        companyId: 'company-1'
      }
    });

    const result = await getEquipoResumen(2026, 0);
    
    const departments = new Set(result.map(r => r.department));
    expect(departments.size).toBeGreaterThan(1);
  });

  test('incluye último día imputado de cada usuario', async () => {
    const result = await getEquipoResumen(2026, 0);
    
    result.forEach(item => {
      expect(item).toHaveProperty('ultimoDiaImputado');
    });
  });

  test('calcula días sin imputar correctamente', async () => {
    const result = await getEquipoResumen(2026, 0);
    
    result.forEach(item => {
      expect(item.diasSinImputar).toBeGreaterThanOrEqual(0);
    });
  });
});
```

---

## 3. Tests de Integración (E2E conceptuales)

### 3.1 Flujo completo Mi Hoja

```typescript
describe('E2E: Mi Hoja', () => {
  test('usuario ve calendario con sus horas', async () => {
    // 1. Login como WORKER
    // 2. Navegar a /control-horas/mi-hoja
    // 3. Verificar que se muestra mes actual
    // 4. Verificar cards de resumen (horas, diferencia, etc.)
    // 5. Verificar tabla calendario
    // 6. Verificar colores por estado de día
  });

  test('cambiar mes actualiza datos', async () => {
    // 1. Cambiar selector a mes anterior
    // 2. Verificar que datos corresponden al mes seleccionado
  });

  test('export CSV descarga archivo válido', async () => {
    // 1. Click en "Exportar CSV"
    // 2. Verificar descarga
    // 3. Verificar contenido del CSV
  });
});
```

### 3.2 Flujo Vista Equipo

```typescript
describe('E2E: Vista Equipo', () => {
  test('MANAGER ve tabla de equipo', async () => {
    // 1. Login como MANAGER
    // 2. Navegar a /control-horas/equipo
    // 3. Verificar tabla con usuarios del departamento
    // 4. Verificar colores departamento
    // 5. Verificar ordenamiento por días sin imputar
  });

  test('click en usuario abre su hoja', async () => {
    // 1. Click en icono 🔍 de un usuario
    // 2. Verificar redirección a /control-horas/mi-hoja?userId=xxx
    // 3. Verificar datos del usuario seleccionado
  });

  test('WORKER es bloqueado', async () => {
    // 1. Login como WORKER
    // 2. Intentar navegar a /control-horas/equipo
    // 3. Verificar redirección o error 403
  });
});
```

---

## 4. Tests de Regresión

### 4.1 Registro Horario NO afectado

```typescript
describe('Regresión: Registro Horario intacto', () => {
  test('/hours sigue funcionando', async () => {
    const response = await fetch('/hours');
    expect(response.status).toBe(200);
  });

  test('/hours/daily sigue funcionando', async () => {
    const response = await fetch('/hours/daily');
    expect(response.status).toBe(200);
  });

  test('/admin/hours sigue funcionando', async () => {
    const response = await fetch('/admin/hours');
    expect(response.status).toBe(200);
  });

  test('createTimeEntry sigue funcionando', async () => {
    const entry = await createTimeEntry({
      projectId: 'proj-1',
      date: new Date().toISOString(),
      hours: 8
    });
    expect(entry.id).toBeDefined();
  });

  test('TimeEntry no tiene campos nuevos obligatorios', async () => {
    // Verificar que la migración no rompió el modelo
    const entry = await prisma.timeEntry.create({
      data: {
        userId: 'user-1',
        projectId: 'proj-1',
        date: new Date(),
        hours: 8
      }
    });
    expect(entry).toBeDefined();
  });
});
```

---

## 5. Tests de Permisos

```typescript
describe('Permisos Control de Horas', () => {
  describe('Mi Hoja', () => {
    test('GUEST no tiene acceso', async () => {
      // Mock session con GUEST
      await expect(getMiHoja(2026, 0)).rejects.toThrow();
    });

    test('WORKER accede a su hoja', async () => {
      // Mock session con WORKER
      const result = await getMiHoja(2026, 0);
      expect(result).toBeDefined();
    });

    test('WORKER no puede ver hoja de otro', async () => {
      await expect(getMiHoja(2026, 0, 'otro-id')).rejects.toThrow();
    });
  });

  describe('Equipo', () => {
    test('WORKER no tiene acceso', async () => {
      await expect(getEquipoResumen(2026, 0)).rejects.toThrow();
    });

    test('MANAGER tiene acceso', async () => {
      const result = await getEquipoResumen(2026, 0);
      expect(result).toBeDefined();
    });
  });

  describe('Proyectos', () => {
    test('WORKER no tiene acceso', async () => {
      await expect(
        getProyectosResumen(new Date(), new Date())
      ).rejects.toThrow();
    });
  });

  describe('Anual', () => {
    test('WORKER no tiene acceso', async () => {
      await expect(getAnualResumen(2026)).rejects.toThrow();
    });
  });
});
```

---

## 6. Tests de Rendimiento

```typescript
describe('Rendimiento', () => {
  test('getMiHoja responde en <500ms', async () => {
    const start = Date.now();
    await getMiHoja(2026, 0);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });

  test('getEquipoResumen responde en <1000ms para 50 usuarios', async () => {
    const start = Date.now();
    await getEquipoResumen(2026, 0);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });

  test('getAnualResumen responde en <2000ms', async () => {
    const start = Date.now();
    await getAnualResumen(2026);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});
```

---

## 7. Checklist Manual de QA

### Pre-implementación
- [ ] Verificar `/hours` funciona antes de cambios
- [ ] Verificar `/admin/hours` funciona antes de cambios
- [ ] Tomar screenshots de referencia

### Post-implementación
- [ ] `/hours` sigue funcionando igual
- [ ] `/admin/hours` sigue funcionando igual
- [ ] `/control-horas/mi-hoja` carga sin errores
- [ ] `/control-horas/equipo` carga sin errores (MANAGER+)
- [ ] `/control-horas/proyectos` carga sin errores (MANAGER+)
- [ ] `/control-horas/anual` carga sin errores (MANAGER+)
- [ ] Cálculos de horas previstas son correctos
- [ ] Días sin imputar cuenta correctamente
- [ ] Colores de departamento se muestran
- [ ] Export CSV funciona
- [ ] WORKER no puede acceder a vistas de equipo
- [ ] No hay errores en consola
- [ ] Build production exitoso
- [ ] TypeScript sin errores

---

## 8. Comandos de Test

```bash
# Ejecutar tests unitarios
npm run test:unit -- --grep "Control de Horas"

# Ejecutar tests de integración
npm run test:integration -- --grep "Control de Horas"

# Ejecutar todos los tests
npm run test

# Verificar tipos
npm run typecheck

# Build de producción
npm run build
```
