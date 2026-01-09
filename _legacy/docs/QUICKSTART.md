# 🚀 Guía Rápida de Inicio

## Primeros Pasos

### 1. Instalación Express (5 minutos)

```bash
# Clonar e instalar
git clone <tu-repo>
cd MepTest-main
npm install

# Configurar base de datos
echo 'DATABASE_URL="postgresql://usuario:pass@localhost:5432/mep"' > .env
echo 'AUTH_SECRET="'$(openssl rand -base64 32)'"' >> .env
echo 'AUTH_TRUST_HOST="true"' >> .env

# Inicializar
npx prisma db push
npx prisma db seed
npm run dev
```

### 2. Acceso Inicial

🌐 **URL**: http://localhost:3000/login  
📧 **Email**: admin@mep-projects.com  
🔑 **Password**: admin123

---

## 📖 Casos de Uso Comunes

### Registrar Horas Diarias

1. **Dashboard** → Ver resumen del mes
2. **Registro Diario** → Completar formulario:
   - Fecha (hoy por defecto)
   - Horas trabajadas
   - Proyecto (dropdown)
   - Notas opcionales
3. **Guardar** → Confirmación automática

### Crear un Nuevo Proyecto

1. **Admin → Proyectos** → Botón "Nuevo Proyecto"
2. Completar:
   - Código (ej: P-26-001)
   - Nombre descriptivo
   - Año fiscal
   - Departamento
   - Cliente (opcional)
3. **Guardar** → Disponible inmediatamente

### Exportar Informe Mensual

1. **Admin → Monitor** → Filtrar por mes
2. **Exportar CSV** → Descarga automática
3. Abrir en Excel/Google Sheets

---

## 🎨 Personalización Rápida

### Cambiar Color Corporativo

**Archivo**: `src/app/globals.css`

```css
@theme {
  --color-olive-600: #TU_COLOR_HEX;
}
```

### Modificar Logo

Reemplazar: `public/M_max.png` con tu logo (formato PNG, 256x256px recomendado)

### Ajustar Horas Objetivo

**Archivo**: `prisma/schema.prisma`

```prisma
model User {
  dailyWorkHours Float @default(8.0)  // Cambiar aquí
}
```

Luego: `npx prisma db push`

---

## 🔧 Solución de Problemas

### Error: "Cannot connect to database"

```bash
# Verificar PostgreSQL está corriendo
# Windows:
services.msc  # Buscar PostgreSQL

# Verificar .env
cat .env  # Revisar DATABASE_URL
```

### Error: "Auth secret not found"

```bash
# Regenerar secreto
openssl rand -base64 32
# Copiar al .env como AUTH_SECRET
```

### Resetear Base de Datos

```bash
npx prisma db push --force-reset
npx prisma db seed
```

---

## 📞 Soporte

- 📖 **Documentación completa**: Ver `README.md`
- 🐛 **Reportar bugs**: [Issues del repositorio]
- 💬 **Preguntas**: soporte@mep-projects.com

---

**¡Listo para empezar! 🎉**
