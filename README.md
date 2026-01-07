# 🏗️ MEP Projects - Sistema de Gestión de Horas

Sistema profesional de control de tiempos y gestión de proyectos para empresas de ingeniería y arquitectura. Desarrollado con Next.js 16, Prisma y PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=flat-square&logo=tailwind-css)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Desarrollo](#-desarrollo)
- [Despliegue](#-despliegue)
- [Personalización](#-personalización)

---

## ✨ Características

### 🎯 Funcionalidades Principales

- **Dashboard Personalizado**: Visualización de objetivos mensuales, heatmap de actividad y desglose por proyecto
- **Registro de Horas**: Sistema intuitivo para registrar múltiples entradas diarias en diferentes proyectos
- **Búsqueda Global**: Motor de búsqueda transversal para localizar proyectos, usuarios y clientes
- **Informes Visuales**: Gráficos interactivos de productividad mensual y anual
- **Gestión de Proyectos**: CRUD completo con asociación a clientes
- **Control de Usuarios**: Administración de roles (Admin, Worker, Client) y departamentos
- **Exportación CSV**: Descarga de datos filtrados para análisis externo

### 🔐 Seguridad

- Autenticación con NextAuth v5
- Ventana de edición de 24h para trabajadores
- Anulación administrativa sin restricciones
- Hash de contraseñas con bcrypt
- Sesiones JWT

### 🎨 Diseño

- Interfaz moderna con Tailwind CSS 4
- Animaciones fluidas con Framer Motion
- Paleta corporativa (oliva y neutros)
- Diseño responsive y accesible

---

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18.x o superior
- **PostgreSQL** 14.x o superior
- **npm** o **pnpm**

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd MepTest-main
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/mep_projects"

# NextAuth
AUTH_SECRET="tu-secreto-super-seguro-aqui"
AUTH_TRUST_HOST="true"
```

**Generar AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Inicializar la base de datos

```bash
# Crear las tablas
npx prisma db push

# Poblar con datos de ejemplo
npx prisma db seed
```

Esto creará:
- ✅ Usuario admin: `admin@mep-projects.com` / `admin123`
- ✅ 3 proyectos de ejemplo

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura del Proyecto

```
MepTest-main/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.ts                # Datos iniciales
├── src/
│   ├── app/
│   │   ├── (auth)/            # Rutas de autenticación
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (protected)/       # Rutas protegidas
│   │   │   ├── dashboard/     # Dashboard personal
│   │   │   ├── hours/         # Gestión de horas
│   │   │   │   ├── daily/     # Registro diario
│   │   │   │   └── summary/   # Resumen anual
│   │   │   ├── admin/         # Panel administrativo
│   │   │   │   ├── hours/     # Monitor de horas
│   │   │   │   ├── projects/  # Gestión de proyectos
│   │   │   │   ├── clients/   # Gestión de clientes
│   │   │   │   └── users/     # Gestión de usuarios
│   │   │   ├── search/        # Búsqueda global
│   │   │   └── settings/      # Configuración de usuario
│   │   ├── admin/
│   │   │   └── actions.ts     # Server actions admin
│   │   ├── hours/
│   │   │   └── actions.ts     # Server actions horas
│   │   ├── layout.tsx         # Layout raíz
│   │   └── globals.css        # Estilos globales
│   ├── components/
│   │   └── layout/
│   │       ├── Header.tsx     # Cabecera con búsqueda
│   │       ├── Sidebar.tsx    # Menú lateral
│   │       └── UserMenu.tsx   # Menú de usuario
│   ├── lib/
│   │   └── prisma.ts          # Cliente Prisma singleton
│   ├── auth.ts                # Configuración NextAuth
│   └── auth.config.ts         # Opciones de autenticación
├── .env                       # Variables de entorno (no subir a git)
├── package.json
├── tailwind.config.ts         # Configuración Tailwind
└── tsconfig.json              # Configuración TypeScript
```

---

## ⚙️ Configuración

### Modelos de Base de Datos

El sistema utiliza 4 modelos principales:

#### 1. **User** (Usuario)
```prisma
- id: String (cuid)
- name: String
- email: String (único)
- passwordHash: String
- role: Role (ADMIN | WORKER | CLIENT)
- department: Department
- dailyWorkHours: Float (default: 8.0)
- isActive: Boolean
```

#### 2. **Project** (Proyecto)
```prisma
- id: String (cuid)
- code: String (único, ej: "P-25-001")
- name: String
- year: Int
- department: Department
- clientId: String? (opcional)
- isActive: Boolean
```

#### 3. **Client** (Cliente)
```prisma
- id: String (cuid)
- name: String
- email: String?
- phone: String?
- company: String?
- address: String?
- isActive: Boolean
```

#### 4. **TimeEntry** (Registro de Horas)
```prisma
- id: String (cuid)
- userId: String
- projectId: String
- date: DateTime
- hours: Float
- notes: String?
- createdAt: DateTime
```

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Acceso total, gestión de usuarios, proyectos y clientes |
| **WORKER** | Registro de horas, edición 24h, visualización de dashboard |
| **CLIENT** | Solo visualización de proyectos asignados |

---

## 💻 Uso

### Primer Inicio de Sesión

1. Accede a `http://localhost:3000/login`
2. Usa las credenciales del admin:
   - Email: `admin@mep-projects.com`
   - Password: `admin123`

### Flujo de Trabajo Típico

#### Como Trabajador:
1. **Dashboard** → Ver progreso mensual y objetivos
2. **Horas → Diario** → Registrar horas del día
3. **Horas → Resumen** → Consultar informe anual
4. **Configuración** → Ajustar preferencias personales

#### Como Administrador:
1. **Admin → Monitor** → Supervisar productividad del equipo
2. **Admin → Proyectos** → Crear/editar códigos de proyecto
3. **Admin → Clientes** → Gestionar cartera de clientes
4. **Admin → Usuarios** → Administrar permisos y roles

---

## 🛠️ Desarrollo

### Comandos Útiles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo

# Base de datos
npx prisma studio        # Interfaz visual de BD
npx prisma db push       # Aplicar cambios de schema
npx prisma db seed       # Reiniciar datos de ejemplo
npx prisma generate      # Regenerar cliente Prisma

# Producción
npm run build            # Compilar para producción
npm run start            # Ejecutar build de producción

# Linting
npm run lint             # Verificar código
npx tsc --noEmit         # Verificar tipos TypeScript
```

### Agregar un Nuevo Modelo

1. **Editar `prisma/schema.prisma`**:
```prisma
model NuevoModelo {
  id        String   @id @default(cuid())
  nombre    String
  createdAt DateTime @default(now())
}
```

2. **Aplicar cambios**:
```bash
npx prisma db push
npx prisma generate
```

3. **Crear Server Actions** en `src/app/[ruta]/actions.ts`:
```typescript
'use server';
import { prisma } from "@/lib/prisma";

export async function getNuevoModelo() {
  return await prisma.nuevoModelo.findMany();
}
```

### Crear una Nueva Página

1. **Crear archivo** en `src/app/(protected)/nueva-pagina/page.tsx`:
```tsx
export default async function NuevaPagina() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">
        Nueva Página
      </h1>
      {/* Tu contenido */}
    </div>
  );
}
```

2. **Agregar al menú** en `src/components/layout/Sidebar.tsx`:
```tsx
{
  name: 'Nueva Página',
  href: '/nueva-pagina',
  icon: IconoLucide,
  adminOnly: false
}
```

---

## 🚢 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard
3. Despliega automáticamente con cada push

### Docker

```dockerfile
# Dockerfile de ejemplo
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
CMD ["npm", "start"]
```

### Variables de Entorno en Producción

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
AUTH_TRUST_HOST="true"
NODE_ENV="production"
```

---

## 🎨 Personalización

### Cambiar Colores Corporativos

Edita `src/app/globals.css`:

```css
@theme {
  --color-olive-50: #f7f8f4;
  --color-olive-600: #6b7c3f;  /* Tu color principal */
  /* ... más tonos */
}
```

### Modificar Logo

Reemplaza los archivos en `public/`:
- `favicon.ico`
- `logo.svg` (si lo usas)

### Ajustar Horas Objetivo

En `src/app/(protected)/dashboard/actions.ts`:

```typescript
const targetHours = user.dailyWorkHours * daysInMonth; // Personalizable
```

---

## 📚 Tecnologías Utilizadas

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript 5
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Autenticación**: NextAuth v5
- **Estilos**: Tailwind CSS 4
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React
- **Validación**: Zod + React Hook Form

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado y propietario de MEP Projects.

---

## 🆘 Soporte

Para dudas o problemas:
- 📧 Email: soporte@mep-projects.com
- 📖 Documentación: [Wiki del proyecto]

---

## 🔄 Changelog

### v1.0.0 (Enero 2026)
- ✅ Sistema de autenticación completo
- ✅ Dashboard personal con visualizaciones
- ✅ Gestión de proyectos y clientes
- ✅ Monitor administrativo en tiempo real
- ✅ Búsqueda global transversal
- ✅ Informes anuales con gráficos
- ✅ Exportación CSV
- ✅ Next.js 16 compatible

---

**Desarrollado con ❤️ para MEP Projects**
