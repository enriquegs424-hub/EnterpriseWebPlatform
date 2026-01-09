# Enterprise Web Platform

Sistema profesional de gestión de horas, proyectos y tareas para empresas de ingeniería y arquitectura.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat-square&logo=postgresql)

## 🚀 Inicio Rápido

### Opción 1: Scripts Automáticos (Recomendado)

```bash
# Iniciar el proyecto
.\start.bat

# Actualizar repositorio con cambios locales
.\push-to-github.bat

# Descargar cambios del repositorio (rollback)
.\pull-from-github.bat
```

### Opción 2: Manual

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Aplicar schema de base de datos
npx prisma db push
npx prisma db seed

# Iniciar servidor de desarrollo
npm run dev
```

## 📋 Características

- ✅ **Gestión de Horas**: Registro diario con múltiples proyectos
- ✅ **Gestión de Tareas**: Asignación, prioridades y seguimiento
- ✅ **Sistema de Notificaciones**: Alertas en tiempo real
- ✅ **Búsqueda Global**: Encuentra proyectos, usuarios y clientes
- ✅ **Informes Visuales**: Gráficos de productividad mensual y anual
- ✅ **Gestión de Proyectos y Clientes**: CRUD completo
- ✅ **Control de Usuarios**: Roles y permisos
- ✅ **Exportación CSV**: Descarga de datos filtrados

## 🔧 Requisitos

- Node.js 18.x o superior
- PostgreSQL 14.x o superior
- npm o pnpm

## 📖 Documentación

- [README.md](./README.md) - Documentación completa
- [QUICKSTART.md](./QUICKSTART.md) - Guía de inicio rápido
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura del sistema
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solución de problemas
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía de despliegue

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Compilar para producción
npm run start        # Ejecutar build de producción
npm run lint         # Verificar código
npm run db:push      # Aplicar cambios de schema
npm run db:seed      # Poblar con datos de ejemplo
npm run db:studio    # Interfaz visual de BD
npm run db:reset     # Resetear base de datos
npm run type-check   # Verificar tipos TypeScript
```

## 🔐 Variables de Entorno

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/mep_projects"
AUTH_SECRET="tu-secreto-super-seguro-aqui"
AUTH_TRUST_HOST="true"
```

## 🎨 Tecnologías

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript 5
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Autenticación**: NextAuth v5
- **Estilos**: Tailwind CSS 4
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React

## 📄 Licencia

Proyecto privado y propietario.

## 👥 Autor

Desarrollado por MEP Projects

---

**¿Necesitas ayuda?** Consulta [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) o contacta al equipo de desarrollo.
