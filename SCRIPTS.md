# 🚀 Scripts de Gestión del Proyecto

Este proyecto incluye varios scripts `.bat` para facilitar la gestión del código y el repositorio de GitHub.

## 📋 Scripts Disponibles

### 1️⃣ `setup-github.bat` - Configuración Inicial
**Usar SOLO la primera vez** para configurar el repositorio y subir el proyecto inicial a GitHub.

```bash
.\setup-github.bat
```

**¿Qué hace?**
- ✅ Inicializa el repositorio Git
- ✅ Configura el remote de GitHub
- ✅ Crea el commit inicial
- ✅ Sube todo el proyecto a GitHub

**⚠️ IMPORTANTE**: Solo ejecutar una vez al inicio.

---

### 2️⃣ `start.bat` - Iniciar Proyecto
Inicia el servidor de desarrollo con todas las verificaciones necesarias.

```bash
.\start.bat
```

**¿Qué hace?**
- ✅ Verifica e instala dependencias si faltan
- ✅ Crea `.env` desde `.env.example` si no existe
- ✅ Genera el cliente de Prisma si es necesario
- ✅ Inicia el servidor en `http://localhost:3000`

**Credenciales por defecto:**
- 📧 Email: `admin@mep-projects.com`
- 🔑 Password: `admin123`

---

### 3️⃣ `push-to-github.bat` - Subir Cambios
Sube tus cambios locales al repositorio de GitHub.

```bash
.\push-to-github.bat
```

**¿Qué hace?**
- ✅ Muestra el estado actual del repositorio
- ✅ Pide confirmación antes de continuar
- ✅ Solicita un mensaje de commit
- ✅ Agrega todos los archivos modificados
- ✅ Crea el commit
- ✅ Sube los cambios a GitHub

**Uso típico:**
1. Haces cambios en el código
2. Ejecutas `push-to-github.bat`
3. Escribes un mensaje descriptivo (ej: "Agregado sistema de tareas")
4. Confirmas el push

---

### 4️⃣ `pull-from-github.bat` - Rollback
Descarga la versión del repositorio y **sobrescribe** tus cambios locales.

```bash
.\pull-from-github.bat
```

**¿Qué hace?**
- ⚠️ Guarda tus cambios locales en stash (backup temporal)
- ⚠️ Descarga la última versión de GitHub
- ⚠️ Sobrescribe tu código local
- ✅ Limpia archivos no rastreados
- ✅ Opcionalmente ejecuta `npm install`

**⚠️ ADVERTENCIA**: Esta operación sobrescribirá tus cambios locales. Úsala solo si:
- Quieres descartar cambios locales
- Necesitas volver a una versión anterior
- Quieres sincronizar con el repositorio

**Recuperar cambios después del rollback:**
```bash
git stash list      # Ver backups
git stash pop       # Recuperar el último backup
```

---

### 5️⃣ `setup-tasks.bat` - Actualizar Base de Datos
Aplica los nuevos modelos de Tareas y Notificaciones a la base de datos.

```bash
.\setup-tasks.bat
```

**¿Qué hace?**
- ✅ Aplica el schema de Prisma (`prisma db push`)
- ✅ Genera el cliente de Prisma (`prisma generate`)
- ✅ Verifica que todo funcionó correctamente

**Cuándo usarlo:**
- Después de clonar el repositorio por primera vez
- Cuando hay cambios en `prisma/schema.prisma`
- Si ves errores de TypeScript relacionados con Prisma

---

## 🔄 Flujo de Trabajo Típico

### Desarrollo Diario

```bash
# 1. Iniciar el proyecto
.\start.bat

# 2. Hacer cambios en el código...

# 3. Subir cambios a GitHub
.\push-to-github.bat
```

### Trabajar en Equipo

```bash
# Antes de empezar a trabajar
.\pull-from-github.bat    # Descargar últimos cambios

# Hacer tus cambios...

# Subir tus cambios
.\push-to-github.bat
```

### Resolver Problemas

```bash
# Si algo salió mal y quieres volver atrás
.\pull-from-github.bat    # Rollback completo

# Si hay problemas con Prisma
.\setup-tasks.bat         # Regenerar BD
```

---

## 🆘 Solución de Problemas

### "Error: No se pudo hacer push"
**Solución:**
1. Verifica tu conexión a internet
2. Asegúrate de tener permisos en el repositorio
3. Ejecuta manualmente:
   ```bash
   git pull origin main --rebase
   git push origin main
   ```

### "Error: No se encontró .env"
**Solución:**
1. Ejecuta `start.bat` - creará `.env` automáticamente
2. O copia manualmente: `copy .env.example .env`
3. Edita `.env` con tus credenciales

### "Error de Prisma: Property 'task' does not exist"
**Solución:**
1. Cierra VS Code completamente
2. Ejecuta `setup-tasks.bat`
3. Abre VS Code de nuevo

### "Conflictos de Git"
**Solución:**
```bash
# Opción 1: Mantener cambios remotos
.\pull-from-github.bat

# Opción 2: Resolver manualmente
git status                    # Ver conflictos
# Editar archivos en conflicto
git add .
git commit -m "Resueltos conflictos"
git push origin main
```

---

## 📚 Comandos Git Útiles

```bash
# Ver estado
git status

# Ver historial
git log --oneline

# Ver diferencias
git diff

# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Ver ramas
git branch -a

# Cambiar de rama
git checkout nombre-rama

# Crear nueva rama
git checkout -b nueva-rama
```

---

## 🔐 Configuración de Credenciales

Si Git te pide credenciales constantemente:

```bash
# Guardar credenciales
git config --global credential.helper store

# Configurar usuario
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

---

## 📖 Más Información

- [README.md](./README.md) - Documentación del proyecto
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solución de problemas
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía de despliegue

---

**¿Necesitas ayuda?** Revisa la documentación o contacta al equipo de desarrollo.
