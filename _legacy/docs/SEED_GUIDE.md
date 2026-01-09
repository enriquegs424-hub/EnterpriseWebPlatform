# 🌱 GUÍA DE SEED - Datos de Ejemplo

## 📋 Descripción

Este script crea datos de ejemplo completos para poder ver la plataforma MEP Projects funcionando con información realista.

---

## 🎯 ¿Qué Crea el Seed?

### 👥 **6 Usuarios**
- **1 Administrador**: Enrique García
- **5 Trabajadores**:
  - Carlos Martínez (Ingeniería)
  - Ana López (Arquitectura)
  - Miguel Sánchez (Ingeniería)
  - Laura Fernández (Administración)
  - David Rodríguez (Ingeniería)

### 🏢 **5 Clientes**
- Constructora Mediterránea S.L.
- Inmobiliaria Costa del Sol
- Ayuntamiento de Valencia
- Grupo Hotelero Ibérico
- Desarrollos Urbanos BCN

### 📁 **6 Proyectos Activos**
- P-26-001: Rehabilitación Edificio Histórico Centro
- P-26-002: Diseño MEP Complejo Residencial
- P-26-003: Remodelación Plaza Mayor Valencia
- P-25-088: Hotel 5 Estrellas Costa del Sol
- P-25-089: Oficinas Corporativas Barcelona
- P-26-004: Mantenimiento Industrial Planta Norte

### ✅ **12 Tareas**
- 2 Urgentes (vencen hoy/mañana)
- 3 Alta prioridad
- 3 Prioridad media
- 2 Completadas
- 2 Baja prioridad

**Estados:**
- Pendientes: 7
- En progreso: 3
- Completadas: 2

### ⏱️ **~300 Registros de Horas**
- Últimos 30 días laborables
- Cada trabajador con 2-3 entradas diarias
- Distribuidas entre todos los proyectos

---

## 🚀 Cómo Ejecutar el Seed

### Opción 1: Comando NPM
```bash
npm run seed
```

### Opción 2: Directamente con Prisma
```bash
npx prisma db seed
```

### Opción 3: TypeScript directo
```bash
npx ts-node prisma/seed.ts
```

---

## 🔐 Credenciales de Acceso

### **Administrador**
```
📧 Email: admin@mep-projects.com
🔑 Password: admin123
```

### **Trabajadores** (todos con la misma contraseña)
```
📧 carlos.martinez@mep-projects.com
📧 ana.lopez@mep-projects.com
📧 miguel.sanchez@mep-projects.com
📧 laura.fernandez@mep-projects.com
📧 david.rodriguez@mep-projects.com

🔑 Password: admin123
```

---

## ⚠️ Importante

### **El seed BORRA todos los datos anteriores**

El script incluye estas líneas al inicio:
```typescript
await prisma.timeEntry.deleteMany()
await prisma.task.deleteMany()
await prisma.project.deleteMany()
await prisma.client.deleteMany()
await prisma.user.deleteMany()
```

Si **NO quieres borrar** los datos existentes:
1. Abre `prisma/seed.ts`
2. Comenta o elimina las líneas de `deleteMany()`
3. El seed intentará crear los datos (puede fallar si hay duplicados)

---

## 📊 Qué Podrás Ver Después del Seed

### **Dashboard**
- Gráficos con horas del mes
- Tareas pendientes
- Distribución por proyecto
- Registros recientes

### **Vista de Tareas**
- **Lista**: 12 tareas con diferentes estados y prioridades
- **Kanban**: Tareas organizadas en 3 columnas
- **Calendario**: Tareas distribuidas por fechas

### **Gestión de Horas**
- Registros de los últimos 30 días
- Resumen mensual con gráficos
- Distribución por proyecto

### **Proyectos**
- 6 proyectos activos
- Con clientes asignados
- Diferentes departamentos

### **Clientes**
- 5 clientes con información completa
- Proyectos asociados

---

## 🔄 Volver a Ejecutar el Seed

Puedes ejecutar el seed cuantas veces quieras:

```bash
npm run seed
```

Cada vez que lo ejecutes:
1. ✅ Borrará todos los datos
2. ✅ Creará datos frescos
3. ✅ Mantendrá las mismas credenciales

---

## 🎨 Personalizar los Datos

Si quieres modificar los datos de ejemplo:

1. Abre `prisma/seed.ts`
2. Modifica los arrays de datos:
   - `workers` - para cambiar usuarios
   - `clients` - para cambiar clientes
   - `projects` - para cambiar proyectos
   - `tasks` - para cambiar tareas
3. Guarda y ejecuta `npm run seed`

---

## 🐛 Solución de Problemas

### Error: "Cannot find module 'bcryptjs'"
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

### Error: "Prisma Client not generated"
```bash
npx prisma generate
npm run seed
```

### Error: "Database connection failed"
1. Verifica que PostgreSQL esté corriendo
2. Revisa las credenciales en `.env`
3. Ejecuta `npx prisma db push`

---

## ✨ Próximos Pasos

Después de ejecutar el seed:

1. **Inicia el servidor**:
   ```bash
   npm run dev
   ```

2. **Accede a la aplicación**:
   ```
   http://localhost:3000
   ```

3. **Inicia sesión** con cualquiera de las credenciales

4. **Explora**:
   - Dashboard con datos reales
   - Tareas en las 3 vistas
   - Registros de horas
   - Proyectos y clientes

---

**¡Disfruta explorando la plataforma con datos realistas!** 🎉
