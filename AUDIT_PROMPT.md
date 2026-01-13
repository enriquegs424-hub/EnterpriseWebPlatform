# MEP Projects - Prompt de Auditoría Completa de Módulos

## Instrucciones para Claude

Eres un auditor de código experto. Tu objetivo es revisar **TODOS** los módulos de la aplicación MEP Projects de forma sistemática, uno por uno.

---

## Contexto del Proyecto

- **Stack**: Next.js 15, TypeScript, Prisma, PostgreSQL, NextAuth
- **Ubicación**: `c:\Users\MEP\Desktop\MEPJun-main\MepTest-main`
- **Idioma UI**: Español
- **Moneda**: EUR (€)

---

## Módulos a Revisar (en orden)

### 1. Dashboard (`/dashboard`)
- [ ] Verificar que carga estadísticas correctamente
- [ ] Revisar widgets de resumen
- [ ] Comprobar dark mode
- [ ] Agregar gráficos si faltan

### 2. Facturas (`/invoices`)
- [ ] CRUD completo (crear, ver, editar, eliminar)
- [ ] PDF descargable con plantilla profesional
- [ ] Filtrado por mes/año
- [ ] Multiselección para descarga masiva
- [ ] Símbolo € en todos los valores
- [ ] Estado de facturas (borrador, enviada, pagada, vencida)
- [ ] Registro de pagos parciales

### 3. Presupuestos (`/quotes`)
- [ ] CRUD completo
- [ ] Conversión presupuesto → factura
- [ ] PDF descargable
- [ ] Estados (borrador, enviado, aceptado, rechazado)
- [ ] Símbolo € en todos los valores

### 4. Clientes (`/admin/clients`)
- [ ] CRUD completo
- [ ] Búsqueda y filtros
- [ ] Información de contacto
- [ ] Historial de facturas por cliente

### 5. Proyectos (`/projects`)
- [ ] CRUD completo
- [ ] Dashboard de proyecto con estadísticas
- [ ] Tareas asociadas
- [ ] Documentos del proyecto
- [ ] Eventos/calendario
- [ ] Progreso del proyecto

### 6. Tareas (`/tasks`)
- [ ] Vista lista, Kanban y calendario
- [ ] CRUD completo
- [ ] Asignación a usuarios
- [ ] Estados y prioridades
- [ ] Filtros por proyecto, asignado, estado
- [ ] Comentarios en tareas

### 7. CRM (`/crm`)
- [ ] Dashboard con métricas
- [ ] Pipeline de leads
- [ ] Drag & drop en Kanban
- [ ] Conversión lead → cliente
- [ ] Historial de actividad

### 8. Horas (`/hours`)
- [ ] Timer funcional
- [ ] Registro manual de horas
- [ ] Resumen diario/mensual/anual
- [ ] Filtro por proyecto
- [ ] Exportación de datos

### 9. Gastos (`/expenses`)
- [ ] CRUD completo
- [ ] Categorías de gastos
- [ ] Adjuntar recibos
- [ ] Símbolo € en valores
- [ ] Aprobación de gastos

### 10. Documentos (`/documents`)
- [ ] Subida de archivos
- [ ] Organización en carpetas
- [ ] Vista previa PDF
- [ ] Compartir documentos

### 11. Configuración (`/settings`)
- [ ] Toggle dark mode funcional
- [ ] Configuración de perfil
- [ ] Preferencias de usuario

### 12. Admin (`/admin`)
- [ ] Gestión de usuarios
- [ ] Roles y permisos
- [ ] Logs de actividad

---

## Proceso de Auditoría para cada módulo

```
1. REVISAR: Ver archivos page.tsx y actions.ts del módulo
2. LISTAR: Documentar funcionalidades existentes vs faltantes
3. PROBAR: Verificar que la página compila sin errores
4. CORREGIR: Arreglar errores de tipos, imports, etc.
5. MEJORAR: Agregar símbolo €, dark mode, conversiones Decimal→Number
6. CREAR: Implementar funcionalidades faltantes
7. DOCUMENTAR: Actualizar estado en este checklist
```

---

## Prioridades

1. **CRÍTICO**: Errores que impiden compilación o uso
2. **ALTO**: Funcionalidades core faltantes (CRUD)
3. **MEDIO**: Mejoras UX (filtros, PDFs, dark mode)
4. **BAJO**: Optimizaciones y features avanzados

---

## Comandos Útiles

```bash
# Verificar compilación
npx tsc --noEmit

# Ejecutar dev server
npm run dev

# Ver schema de base de datos
cat prisma/schema.prisma
```

---

## Reglas

- No pedir permiso, actuar directamente
- Convertir todos los Decimal de Prisma a Number() antes de .toLocaleString()
- Usar 'es-ES' para formato y EUR para moneda
- Mantener dark mode en todos los componentes
- Usar RBAC existente (checkPermission, ProtectedRoute)
- Español en toda la UI

---

## Inicio

Empieza revisando el módulo **Dashboard** (`src/app/(protected)/dashboard/page.tsx`).

1. Lee el archivo
2. Identifica problemas
3. Corrige y mejora
4. Pasa al siguiente módulo

**NO TE DETENGAS** hasta revisar los 12 módulos.
