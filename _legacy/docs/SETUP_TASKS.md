# 🚨 INSTRUCCIONES IMPORTANTES - LEER ANTES DE CONTINUAR

## Problema Actual
Los archivos de código están listos, pero la base de datos necesita actualizarse con los nuevos modelos de Tareas y Notificaciones.

## ⚠️ IMPORTANTE: Cerrar VS Code Primero

**Windows tiene un problema conocido con Prisma**: El archivo `.node` queda bloqueado cuando VS Code está abierto.

### Pasos Obligatorios (EN ORDEN):

#### 1️⃣ **CERRAR VS CODE COMPLETAMENTE**
   - Guardar todos los archivos abiertos
   - Cerrar todas las ventanas de VS Code
   - Verificar en el administrador de tareas que no quede ningún proceso `Code.exe`

#### 2️⃣ **Abrir PowerShell como Administrador**
   - Click derecho en el menú Inicio → "Windows PowerShell (Administrador)"
   - O buscar "PowerShell" → Click derecho → "Ejecutar como administrador"

#### 3️⃣ **Navegar al Proyecto**
```powershell
cd "C:\Users\MEP\Desktop\MEPJun-main\MepTest-main"
```

#### 4️⃣ **Aplicar el Nuevo Schema**
```powershell
npx prisma db push
```
**Esto creará las nuevas tablas**: `Task`, `TaskComment`, `Notification`

#### 5️⃣ **Generar el Cliente de Prisma**
```powershell
npx prisma generate
```
**Esto actualizará los tipos de TypeScript** para que reconozca `prisma.task`, `prisma.notification`, etc.

#### 6️⃣ **Verificar que Funcionó**
```powershell
# Deberías ver un mensaje de éxito sin errores
# Si hay errores, revisar TROUBLESHOOTING.md
```

#### 7️⃣ **Abrir VS Code de Nuevo**
```powershell
code .
```

#### 8️⃣ **Iniciar el Servidor de Desarrollo**
```powershell
npm run dev
```

---

## 🎯 Después de Completar los Pasos

Una vez que hayas ejecutado los comandos anteriormente, **todos los errores de TypeScript desaparecerán** porque:

✅ La base de datos tendrá las nuevas tablas  
✅ El cliente de Prisma reconocerá `prisma.task` y `prisma.notification`  
✅ TypeScript reconocerá la propiedad `role` en el modelo `User`  
✅ La aplicación podrá crear y gestionar tareas  

---

## 🆘 Si Encuentras Errores

### Error: "EPERM: operation not permitted"
**Solución**: VS Code está abierto. Ciérralo completamente y vuelve a intentar.

### Error: "Cannot connect to database"
**Solución**: 
1. Verificar que PostgreSQL esté corriendo: `services.msc` → Buscar "postgresql"
2. Verificar el `DATABASE_URL` en el archivo `.env`

### Error: "Auth secret not found"
**Solución**: Verificar que `.env` tenga `AUTH_SECRET` configurado

---

## 📊 Nuevas Funcionalidades Disponibles Después

Una vez completados los pasos, tendrás acceso a:

✅ **Gestión de Tareas** (`/tasks`)
- Crear tareas y asignarlas a usuarios
- Establecer prioridades (Baja, Media, Alta, Urgente)
- Definir tipos (General, Proyecto, Reunión, Revisión, Mantenimiento)
- Agregar fechas límite
- Asociar con proyectos
- Comentar en tareas

✅ **Sistema de Notificaciones** (Header)
- Notificaciones en tiempo real
- Contador de no leídas
- Notificaciones automáticas al:
  - Asignar una tarea
  - Completar una tarea
  - Comentar en una tarea

✅ **Estadísticas de Tareas**
- Total de tareas
- Pendientes
- En progreso
- Completadas
- Vencidas

---

## 🎨 Nuevas Rutas Disponibles

- `/tasks` - Gestión de tareas
- `/notifications` - Centro de notificaciones (próximamente)

---

**¡Sigue estos pasos y todo funcionará perfectamente!** 🚀
