# 🚀 SPRINT 1 - INICIO INMEDIATO
## Mejoras de Dashboard, Horas y Tareas (Semanas 1-2)

---

## 📋 TAREAS DE ESTA SEMANA

### ✅ **Día 1: Dashboard Personal Mejorado**
- [ ] Crear componente de widgets
- [ ] Gráfico circular de horas del mes
- [ ] Lista de tareas pendientes
- [ ] Próximos deadlines
- [ ] Quick actions

### ✅ **Día 2: Temporizador de Horas**
- [ ] Componente de timer en Header
- [ ] Start/Stop/Pause functionality
- [ ] Guardar estado en localStorage
- [ ] Registro automático al detener

### ✅ **Día 3-4: Vista Kanban de Tareas**
- [ ] Crear página `/tasks/kanban`
- [ ] Columnas drag & drop
- [ ] Actualizar estado al mover
- [ ] Filtros y búsqueda

### ✅ **Día 5: Plantillas de Tareas**
- [ ] Modelo TaskTemplate en BD
- [ ] CRUD de plantillas
- [ ] Aplicar plantilla
- [ ] Tareas recurrentes

### ✅ **Día 6-7: Testing y Pulido**
- [ ] Probar todos los flujos
- [ ] Corregir bugs
- [ ] Optimizar performance
- [ ] Documentar cambios

---

## 🎯 OBJETIVO DEL SPRINT

**Al final de estas 2 semanas tendrás:**

✅ Dashboard con widgets interactivos y gráficos  
✅ Temporizador de horas en tiempo real  
✅ Vista Kanban drag & drop para tareas  
✅ Sistema de plantillas y tareas recurrentes  
✅ Mejor UX en todos los módulos core  

---

## 🔧 ARCHIVOS A CREAR/MODIFICAR

### Nuevos Archivos
```
src/components/dashboard/
  ├── HoursWidget.tsx
  ├── TasksWidget.tsx
  ├── DeadlinesWidget.tsx
  ├── QuickActions.tsx
  └── ProductivityChart.tsx

src/components/hours/
  └── Timer.tsx

src/app/(protected)/tasks/
  ├── kanban/
  │   ├── page.tsx
  │   ├── KanbanBoard.tsx
  │   └── KanbanCard.tsx
  └── templates/
      ├── page.tsx
      └── actions.ts

prisma/schema.prisma
  └── model TaskTemplate
```

### Archivos a Modificar
```
src/app/(protected)/dashboard/page.tsx
src/components/layout/Header.tsx
src/app/(protected)/tasks/page.tsx
src/app/(protected)/hours/daily/page.tsx
```

---

## 📊 PROGRESO ESPERADO

```
Día 1:  ████░░░░░░ 20% - Dashboard mejorado
Día 2:  ████████░░ 40% - Timer funcionando
Día 4:  ████████████░░ 60% - Kanban completo
Día 5:  ██████████████░░ 80% - Plantillas listas
Día 7:  ████████████████ 100% - Sprint completado
```

---

**¿Empezamos con el Dashboard mejorado?** 🎨
