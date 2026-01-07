# 🛠️ Solución de Problemas Comunes

## ❌ Error: "EPERM: operation not permitted" (Prisma Generate)

### Causa
Windows tiene bloqueado el archivo `.node` de Prisma.

### Solución Rápida

**Opción 1: Cerrar VS Code y regenerar**
```bash
# 1. Cerrar completamente VS Code
# 2. Abrir PowerShell como Administrador
cd "C:\Users\MEP\Desktop\MEPJun-main\MepTest-main"
npx prisma generate
```

**Opción 2: Eliminar node_modules**
```bash
# Eliminar y reinstalar
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npx prisma generate
```

**Opción 3: Deshabilitar antivirus temporalmente**
- Algunos antivirus bloquean archivos `.node`
- Agregar excepción para la carpeta del proyecto

---

## ❌ Error: "Cannot connect to database"

### Verificar PostgreSQL está corriendo

**Windows:**
```powershell
# Abrir Servicios
services.msc
# Buscar "postgresql" y verificar que está "Iniciado"
```

### Verificar credenciales en .env

```env
# Formato correcto:
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nombre_bd"

# Ejemplo:
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/mep_projects"
```

### Crear base de datos manualmente

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear BD
CREATE DATABASE mep_projects;
\q

# Aplicar schema
npx prisma db push
```

---

## ❌ Error: "Auth secret not found"

```bash
# Generar nuevo secreto
openssl rand -base64 32

# Agregar al .env
AUTH_SECRET="el-secreto-generado-aqui"
AUTH_TRUST_HOST="true"
```

---

## ❌ Error: "Module not found" después de instalar

```bash
# Limpiar caché de Next.js
Remove-Item -Recurse -Force .next
npm run dev
```

---

## ❌ Página en blanco / Error 500

### Verificar logs del servidor

```bash
npm run dev
# Revisar la consola para errores específicos
```

### Verificar que Prisma está generado

```bash
npx prisma generate
```

### Resetear base de datos

```bash
npx prisma db push --force-reset
npx prisma db seed
```

---

## ❌ Estilos no se aplican

### Verificar Tailwind CSS

```bash
# Eliminar .next
Remove-Item -Recurse -Force .next

# Reiniciar dev server
npm run dev
```

---

## ❌ Error: "Cannot find module '@/...'

### Verificar tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Reiniciar TypeScript Server en VS Code

1. `Ctrl + Shift + P`
2. "TypeScript: Restart TS Server"

---

## ❌ Sesión no persiste / Login no funciona

### Verificar .env

```env
AUTH_SECRET="debe-estar-configurado"
AUTH_TRUST_HOST="true"
```

### Limpiar cookies del navegador

1. F12 → Application → Cookies
2. Eliminar todas las cookies de localhost:3000
3. Refrescar página

---

## 🔍 Debugging Avanzado

### Ver queries de Prisma

```typescript
// lib/prisma.ts
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
```

### Habilitar modo debug de Next.js

```json
// package.json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--inspect' next dev"
  }
}
```

### Verificar variables de entorno

```bash
# En PowerShell
Get-Content .env
```

---

## 📞 Obtener Ayuda

Si ninguna solución funciona:

1. **Revisar logs completos** en la consola
2. **Copiar el error exacto**
3. **Verificar versiones**:
   ```bash
   node --version    # Debe ser 18+
   npm --version
   npx prisma --version
   ```

4. **Contactar soporte** con:
   - Mensaje de error completo
   - Pasos que causaron el error
   - Sistema operativo y versiones

---

**Última actualización**: Enero 2026
