# 📋 Lista de Verificación - Deployment

## Pre-Deployment

### ✅ Código
- [ ] Todos los tests pasan
- [ ] No hay errores de TypeScript (`npm run type-check`)
- [ ] No hay warnings de ESLint (`npm run lint`)
- [ ] Build de producción exitoso (`npm run build`)

### ✅ Base de Datos
- [ ] Schema de Prisma actualizado
- [ ] Migraciones aplicadas
- [ ] Datos de seed funcionan correctamente
- [ ] Índices optimizados creados

### ✅ Variables de Entorno
- [ ] `DATABASE_URL` configurada (producción)
- [ ] `AUTH_SECRET` generado (seguro, 32+ caracteres)
- [ ] `AUTH_TRUST_HOST="true"`
- [ ] `NODE_ENV="production"`

### ✅ Seguridad
- [ ] Contraseñas por defecto cambiadas
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado (si aplica)
- [ ] Logs sensibles eliminados

### ✅ Performance
- [ ] Imágenes optimizadas
- [ ] Lazy loading implementado
- [ ] Caché configurado
- [ ] CDN configurado (si aplica)

---

## Deployment en Vercel

### 1. Preparar Repositorio

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <tu-repo>
git push -u origin main
```

### 2. Conectar a Vercel

1. Ir a [vercel.com](https://vercel.com)
2. "Import Project"
3. Seleccionar repositorio
4. Configurar:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`

### 3. Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://...
AUTH_SECRET=...
AUTH_TRUST_HOST=true
NODE_ENV=production
```

### 4. Deploy

```bash
# Automático con cada push a main
git push origin main

# O manual desde Vercel Dashboard
```

---

## Deployment en VPS (Ubuntu)

### 1. Preparar Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Instalar PM2 (process manager)
sudo npm install -g pm2
```

### 2. Configurar PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE mep_projects;
CREATE USER mep_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE mep_projects TO mep_user;
\q
```

### 3. Clonar y Configurar Proyecto

```bash
cd /var/www
git clone <tu-repo> mep-projects
cd mep-projects

# Instalar dependencias
npm ci --production

# Configurar .env
nano .env
# Pegar variables de entorno

# Aplicar schema
npx prisma db push
npx prisma db seed

# Build
npm run build
```

### 4. Configurar PM2

```bash
# Iniciar aplicación
pm2 start npm --name "mep-projects" -- start

# Guardar configuración
pm2 save

# Auto-start en reboot
pm2 startup
```

### 5. Configurar Nginx (Reverse Proxy)

```bash
sudo apt install nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/mep-projects
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/mep-projects /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## Post-Deployment

### ✅ Verificación
- [ ] Sitio accesible desde URL pública
- [ ] Login funciona correctamente
- [ ] Base de datos conectada
- [ ] Todas las rutas funcionan
- [ ] Formularios envían datos
- [ ] Búsqueda global operativa

### ✅ Monitoreo
- [ ] Logs configurados
- [ ] Alertas de errores activas
- [ ] Backup automático de BD configurado
- [ ] Métricas de performance monitoreadas

### ✅ Documentación
- [ ] README actualizado con URL de producción
- [ ] Credenciales de admin documentadas (seguras)
- [ ] Procedimientos de backup documentados
- [ ] Contactos de soporte actualizados

---

## Mantenimiento Continuo

### Backups Diarios

```bash
# Script de backup (guardar como backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U mep_user mep_projects > /backups/mep_$DATE.sql
find /backups -name "mep_*.sql" -mtime +7 -delete

# Agregar a crontab
crontab -e
# 0 2 * * * /path/to/backup.sh
```

### Actualizaciones

```bash
# Actualizar código
cd /var/www/mep-projects
git pull origin main
npm ci --production
npm run build
pm2 restart mep-projects
```

### Monitoreo de Logs

```bash
# Ver logs en tiempo real
pm2 logs mep-projects

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Rollback en Caso de Error

```bash
# Volver a commit anterior
git log --oneline  # Ver commits
git checkout <commit-hash>
npm ci --production
npm run build
pm2 restart mep-projects
```

---

**¡Listo para producción! 🚀**
