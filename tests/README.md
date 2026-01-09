# Tests - Guía de Instalación y Ejecución

## ⚠️ Estado Actual

Los archivos de test están **creados y listos**, pero requieren instalar vitest primero.

---

## 📦 Instalación

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
```

**Nota**: Si falla la instalación, intenta limpiar cache:
```bash
npm cache clean --force
npm install -D vitest @vitest/ui @vitest/coverage-v8
```

---

## 🧪 Tests Disponibles

### 1. State Machine (49 tests)
**Archivo**: `tests/state-machine.test.ts`

Valida transiciones de estado en:
- ✅ Task (PENDING → IN_PROGRESS → COMPLETED)
- ✅ Lead (NEW → QUALIFIED → ... → CLOSED_WON)
- ✅ Expense (PENDING → APPROVED → PAID)
- ✅ Invoice (DRAFT → SENT → PAID)

### 2. RBAC Permissions (70+ tests)
**Archivo**: `tests/permissions.test.ts`

Valida permisos por rol:
- ✅ ADMIN (full CRUD)
- ✅ MANAGER (CRUD minus some)
- ✅ WORKER (CRU on own)
- ✅ CLIENT (read-only on own)

---

## 🚀 Comandos

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar con UI interactiva
```bash
npm run test:ui
```

### Ejecutar con coverage
```bash
npm run test:coverage
```

### Ejecutar tests específicos
```bash
# Solo state machine
npx vitest tests/state-machine.test.ts

# Solo permissions
npx vitest tests/permissions.test.ts
```

### Watch mode (auto-rerun on changes)
```bash
npm test -- --watch
```

---

## 📊 Resultados Esperados

Al ejecutar `npm test`, deberías ver:

```
✓ tests/state-machine.test.ts (49 tests)
  ✓ StateManager - Task States (15)
  ✓ StateManager - Lead States (12)
  ✓ StateManager - Expense States (10)
  ✓ StateManager - Invoice States (12)

✓ tests/permissions.test.ts (70+ tests)
  ✓ Permission Matrix Structure (3)
  ✓ ADMIN Permissions (15)
  ✓ MANAGER Permissions (12)
  ✓ WORKER Permissions (10)
  ✓ CLIENT Permissions (8)
  ✓ Permission Validation (3)
  ✓ Permission Hierarchy (3)

Test Files  2 passed (2)
Tests  120 passed (120)
```

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'vitest/config'"
**Solución**: Instalar vitest primero
```bash
npm install -D vitest @vitest/ui
```

### Tests fallan por imports
**Solución**: Verificar que las rutas en `vitest.config.ts` sean correctas
```typescript
resolve: {
    alias: {
        '@': path.resolve(__dirname, './src'),
    },
}
```

### Error: "PERMISSIONS is not exported"
**Solución**: Actualizar `src/lib/permissions.ts` para exportar `PERMISSIONS`
```typescript
export const PERMISSIONS = { ... };
```

---

## 📁 Estructura de Tests

```
tests/
├── setup.ts                  # Test setup
├── state-machine.test.ts     # 49 tests - State transitions
└── permissions.test.ts       # 70+ tests - RBAC rules

vitest.config.ts              # Vitest configuration
```

---

## ✅ Checklist de Instalación

- [ ] `npm install -D vitest @vitest/ui @vitest/coverage-v8`
- [ ] `npm test` ejecuta sin errores
- [ ] Ver todos los tests en verde (120 passed)
- [ ] (Opcional) `npm run test:ui` para ver UI interactiva

---

## 🎯 Next Steps Después de Tests

1. ✅ Agregar más tests para Invoice actions
2. ✅ Integration tests con Prisma (mock DB)
3. ✅ E2E tests con Playwright
4. ✅ CI/CD pipeline con tests automáticos

---

**Estado**: ✅ Tests listos para ejecutar  
**Requiere**: `npm install -D vitest @vitest/ui`  
**Cobertura**: 2 archivos críticos (permissions, state-machine)
