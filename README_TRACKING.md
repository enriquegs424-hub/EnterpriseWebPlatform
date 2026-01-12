# MEP Projects - README de Seguimiento (Auditoría Brutal)

> **Última actualización**: Enero 2026  
> **Estado**: 45% COMPLETO para producción  
> **Modo**: SINGLE-COMPANY (multiempresa-ready)

---

## 🚨 BLOQUEANTES ACTIVOS

Estos problemas **DEBEN resolverse ANTES de cualquier uso real**:

| # | BLOQUEANTE | Severidad | Acción Inmediata |
|---|------------|-----------|------------------|
| 1 | **Float para dinero (17 campos)** | 🔴 CRÍTICO | Migrar a Decimal |
| 2 | **Sin CI/CD** | 🔴 CRÍTICO | Crear `.github/workflows/ci.yml` |
| 3 | **Sin rate limiting auth** | 🔴 CRÍTICO | Implementar antes de deploy |
| 4 | **Quote no existe** | 🟠 ALTO | Bloquea flujo comercial |
| 5 | **RBAC incompleto (3 módulos)** | 🟠 ALTO | tasks, hours, documents |

---

## 1) Visión

ERP empresarial profesional comparable a Odoo:
- Single-company (preparado para multi-tenant futuro)
- RBAC granular
- Auditoría completa
- Flujos de negocio: Lead → Quote → Invoice → Payment
- UX de backoffice profesional

---

## 2) Arquitectura Actual

```
Stack: Next.js 16 + React 19 + Prisma + PostgreSQL + NextAuth v5

src/
├── app/(protected)/     # 16 módulos protegidos
│   ├── admin/           # Users, Clients, Products
│   ├── invoices/        # ✅ Mejor implementado
│   ├── projects/        # ✅ Bien
│   ├── tasks/           # ⚠️ Sin RBAC
│   ├── crm/             # ⚠️ Kanban básico
│   ├── finance/         # ✅ Dashboard nuevo
│   └── ...
├── components/          # 20+ componentes
│   ├── DataTable.tsx    # ✅ Genérico
│   ├── QuickActions.tsx # ✅ Cmd+K
│   └── ...
└── lib/
    ├── permissions.ts   # ✅ RBAC implementado
    └── state-machine.ts # ✅ 6 entidades
```

---

## 3) Contrato Global

| Contrato | Estado | Problema |
|----------|--------|----------|
| A1. Single-Company Ready | ⚠️ | companyId nullable en algunas entidades |
| A2. RBAC | ⚠️ | Solo 6/9 módulos con checkPermission |
| A3. Documento ERP | ⚠️ | Invoice OK, Quote NO EXISTE |
| A4. Finanzas (Decimal) | 🔴 | **17 campos con Float** |
| A5. Auditoría | ⚠️ | Backend OK, UI ausente |
| A6. UX Backoffice | ⚠️ | Sin tabs, export, import, bulk |
| A7. CI/Tests | 🔴 | **Sin CI, tests mínimos** |

---

## 4) Checklist por Módulos

| Módulo | Backend | RBAC | State | UI List | UI Detail | Form | Tests |
|--------|---------|------|-------|---------|-----------|------|-------|
| Auth | ✅ | N/A | N/A | ✅ | N/A | ✅ | ❌ |
| Users | ✅ | ✅ | N/A | ⚠️ | ⚠️ | ⚠️ | ❌ |
| Clients | ✅ | ⚠️ | N/A | ⚠️ | ⚠️ | ⚠️ | ❌ |
| **CRM/Leads** | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Products | ✅ | ✅ | N/A | ✅ | ✅ | ✅ | ❌ |
| Projects | ✅ | ✅ | N/A | ✅ | ✅ | ✅ | ❌ |
| **Tasks** | ✅ | ❌ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ |
| **Hours** | ✅ | ❌ | N/A | ✅ | N/A | ✅ | ❌ |
| Expenses | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| **Invoices** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Payments | ✅ | ✅ | N/A | ✅ | N/A | ✅ | ❌ |
| **Documents** | ⚠️ | ❌ | N/A | ⚠️ | ⚠️ | ⚠️ | ❌ |
| Finance Dash | ✅ | ✅ | N/A | ✅ | N/A | N/A | ❌ |
| **Quotes** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Leyenda:**
- ✅ OK (funcional y seguro)
- ⚠️ Parcial (funciona pero incompleto)
- ❌ No existe / Falta

---

## 5) Checklist por Flujos

| Flujo | Pasos implementados | Estado |
|-------|---------------------|--------|
| Lead → Quote → Invoice → Payment | Lead ✅, Quote ⬜, Invoice ✅ (Decimal), Payment ✅ (Decimal) | **70%** |
| Project → Tasks → Hours → Invoice | Todos ✅ (manual) | **90%** |
| Expense → Approval → Payment | ✅ Completo | **100%** |
| Document → Version → Share | ⚠️ Básico | **50%** |

---

## 6) Estado de Migración Decimal

### ✅ COMPLETADO (FASE 1.1-1.2)
- [x] Schema: 17 campos Float → Decimal migrados
- [x] `money.ts`: Helper Decimal determinista (231 líneas)
- [x] `format.ts`: Formateo consistente (190 líneas)  
- [x] `invoices/actions.ts`: Cálculos con Decimal (createInvoice, addPayment)

### 🔄 EN PROGRESO (FASE 1.2)
- [ ] `expenses/actions.ts`: Migrar a Decimal
- [ ] `admin/products/actions.ts`: Usar calculateMargin()
- [ ] `crm/actions.ts`: Lead.value como Decimal
- [ ] `finance/actions.ts`: Dashboard totales

### ⏸️ PENDIENTE (FASE 1.3-1.4)
- [ ] Frontend: inputs dinero como string + transform
- [ ] Frontend: display con formatMoney/formatPercent
- [ ] Verificación: dev + build + tests verdes

---

## 7) DoD Global (Definition of Done)

Para considerar un módulo **PRODUCTION-READY**:

- [ ] Modelo con companyId NOT NULL
- [ ] Importes en Decimal (no Float)
- [ ] CRUD server actions con checkPermission
- [ ] State machine (si aplica) con validación
- [ ] auditCrud() en todas las operaciones
- [ ] UI List con DataTable genérico
- [ ] UI Detail con tabs (Overview/Activity/Attachments)
- [ ] UI Form con validación
- [ ] Tests unitarios (>80% coverage del módulo)
- [ ] Test integración (flujo completo)
- [ ] Dark mode support
- [ ] Responsive design

**Módulos que cumplen DoD actualmente: 0**

---

## 7) Siguiente Paso Lógico (Orden de Dependencias)

### AHORA (P0 BLOQUEANTES):

```bash
# 1. Migrar Float a Decimal (BLOQUEANTE)
# Ver BACKLOG_EXECUTABLE.md tarea [P0] Migrar Float a Decimal

# 2. Crear CI básico
echo "Crear .github/workflows/ci.yml"

# 3. Rate limiting
echo "Implementar antes de cualquier deploy"
```

### DESPUÉS (P1):

1. Crear modelo Quote + CRUD + UI
2. Implementar RBAC en tasks, hours, documents
3. Crear Activity Timeline UI
4. Implementar tabs en detail pages

---

## 8) Riesgos y Deuda Técnica

### 🔴 Críticos (Bloquean producción)

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Float para dinero | Corrupción de datos | Migrar a Decimal YA |
| Sin CI | Regresiones en cada push | Crear pipeline |
| Sin rate limit | Vulnerable a brute force | Implementar middleware |

### 🟠 Altos (Impiden uso real)

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Quote no existe | Flujo comercial roto | Implementar módulo |
| RBAC incompleto | Seguridad parcial | Completar 3 módulos |
| Tests mínimos | Refactoring peligroso | Escribir tests |

### 🟡 Medios (Reducen valor)

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Sin email | Invoices no se envían | Integrar Resend |
| Sin export CSV | Datos atrapados | Implementar en DataTable |
| UI sin tabs | UX pobre | Crear componente |

---

## 9) Registro de Cambios

| Versión | Cambios | Estado |
|---------|---------|--------|
| 3.0 | Auditoría brutal, BLOQUEANTES identificados | Actual |
| 2.x | Products, Finance Dashboard, PaymentModal | Anteriores |
| 1.x | Base: Auth, Projects, Tasks, Invoices | Base |

---

## Comandos

```bash
# Desarrollo
npm run dev

# Tests
npm test              # Vitest
npm run test:coverage # Con coverage (solo state-machine tiene tests)

# Base de datos
npx prisma studio     # Ver datos
npx prisma db push    # Aplicar schema
npx prisma generate   # Regenerar cliente

# Calidad
npm run lint          # ESLint
npm run format        # Prettier

# Build
npm run build         # Producción
```

---

## Métricas de Calidad Actual

| Métrica | Valor | Objetivo |
|---------|-------|----------|
| Módulos con RBAC | 6/9 (67%) | 100% |
| Campos Decimal vs Float | 0/17 (0%) | 100% |
| Tests coverage | <5% | >80% |
| CI/CD | 0% | 100% |
| UI con DataTable | 2/10 (20%) | 100% |

---

**⚠️ ADVERTENCIA: Este sistema NO está listo para producción hasta resolver los BLOQUEANTES.**
