# 📚 Arquitectura del Sistema MEP Projects

## 🏗️ Visión General

MEP Projects es una aplicación **full-stack** construida con el stack moderno de Next.js 16, utilizando el **App Router** y **Server Components** para máximo rendimiento.

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE (Browser)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  React 19  │  │ Framer     │  │ Tailwind   │            │
│  │  Components│  │ Motion     │  │ CSS 4      │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR (Next.js 16)                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ App Router │  │ Server     │  │ NextAuth   │            │
│  │ (RSC)      │  │ Actions    │  │ v5         │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            ↕ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                  BASE DE DATOS (PostgreSQL)                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Users    │  │  Projects  │  │ TimeEntries│            │
│  │  Clients   │  │            │  │            │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Estructura de Carpetas Detallada

### `/src/app` - Rutas y Páginas

```
app/
├── (auth)/                    # Grupo de rutas públicas
│   ├── login/
│   │   └── page.tsx          # Página de login
│   └── register/
│       └── page.tsx          # Registro de usuarios
│
├── (protected)/              # Grupo de rutas protegidas
│   ├── dashboard/
│   │   ├── page.tsx         # Dashboard personal
│   │   └── actions.ts       # Server actions del dashboard
│   │
│   ├── hours/
│   │   ├── daily/
│   │   │   ├── page.tsx     # Registro diario
│   │   │   ├── daily-form.tsx
│   │   │   ├── edit-button.tsx
│   │   │   └── delete-button.tsx
│   │   └── summary/
│   │       ├── page.tsx     # Resumen anual
│   │       └── actions.ts
│   │
│   ├── admin/
│   │   ├── hours/           # Monitor administrativo
│   │   ├── projects/        # Gestión de proyectos
│   │   ├── clients/         # Gestión de clientes
│   │   └── users/           # Gestión de usuarios
│   │
│   ├── search/
│   │   ├── page.tsx         # Búsqueda global
│   │   └── actions.ts
│   │
│   └── settings/
│       ├── page.tsx         # Configuración
│       └── actions.ts
│
├── admin/
│   └── actions.ts           # Server actions globales admin
│
├── hours/
│   └── actions.ts           # Server actions de horas
│
├── layout.tsx               # Layout raíz
├── globals.css              # Estilos globales + Tailwind
└── page.tsx                 # Landing page
```

### `/src/components` - Componentes Reutilizables

```
components/
└── layout/
    ├── Header.tsx           # Cabecera con búsqueda
    ├── Sidebar.tsx          # Menú lateral con navegación
    └── UserMenu.tsx         # Menú desplegable de usuario
```

### `/prisma` - Base de Datos

```
prisma/
├── schema.prisma            # Esquema de BD (modelos)
└── seed.ts                  # Datos iniciales
```

---

## 🔄 Flujo de Datos

### 1. Autenticación (NextAuth v5)

```typescript
// Flujo de login
Usuario → /login → auth.ts → Prisma → PostgreSQL
                      ↓
                   JWT Token
                      ↓
                   Session
```

**Archivos clave:**
- `src/auth.ts` - Configuración principal
- `src/auth.config.ts` - Opciones de autenticación
- `src/middleware.ts` - Protección de rutas

### 2. Server Actions (Patrón Principal)

```typescript
// Ejemplo: Registrar horas
// 1. Cliente (daily-form.tsx)
<form action={dispatch}>
  <input name="hours" />
</form>

// 2. Server Action (hours/actions.ts)
'use server';
export async function submitTimeEntry(formData) {
  const session = await auth();
  await prisma.timeEntry.create({...});
  revalidatePath('/hours/daily');
}

// 3. Base de datos actualizada
// 4. UI se revalida automáticamente
```

**Ventajas:**
- ✅ Sin necesidad de API routes
- ✅ Type-safe de extremo a extremo
- ✅ Revalidación automática
- ✅ Optimistic updates fáciles

### 3. Prisma ORM

```typescript
// Singleton pattern para evitar múltiples conexiones
// lib/prisma.ts
export const prisma = new PrismaClient();

// Uso en server actions
const users = await prisma.user.findMany({
  where: { isActive: true },
  include: { timeEntries: true }
});
```

---

## 🎨 Sistema de Diseño

### Paleta de Colores (Tailwind)

```css
/* globals.css */
@theme {
  /* Oliva (Color corporativo) */
  --color-olive-50: #f7f8f4;
  --color-olive-600: #6b7c3f;  /* Principal */
  --color-olive-700: #5a6835;
  
  /* Neutros */
  --color-neutral-50: #fafafa;
  --color-neutral-900: #171717;
  
  /* Estados */
  --color-success-600: #16a34a;
  --color-error-600: #dc2626;
  --color-info-600: #2563eb;
}
```

### Componentes UI Estándar

```tsx
// Botón primario
<button className="bg-olive-600 hover:bg-olive-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-olive-600/20">
  Guardar
</button>

// Input
<input className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500" />

// Card
<div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
  {/* Contenido */}
</div>
```

---

## 🔐 Seguridad

### Niveles de Protección

1. **Middleware** (`middleware.ts`)
   - Protege rutas antes de renderizar
   - Redirige usuarios no autenticados

2. **Server Actions**
   ```typescript
   export async function adminAction() {
     const session = await auth();
     if (session?.user?.role !== 'ADMIN') {
       return { error: 'No autorizado' };
     }
     // Lógica admin
   }
   ```

3. **UI Condicional**
   ```tsx
   {session?.user?.role === 'ADMIN' && (
     <AdminPanel />
   )}
   ```

### Ventana de Edición 24h

```typescript
// hours/actions.ts
const canEdit = (entry: TimeEntry, userRole: string) => {
  if (userRole === 'ADMIN') return true;
  
  const hoursSinceCreation = 
    (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceCreation < 24;
};
```

---

## 📊 Modelos de Datos

### Relaciones

```
User ──┬─→ TimeEntry ←── Project ←── Client
       │
       └─→ role: ADMIN | WORKER | CLIENT
```

### Índices Optimizados

```prisma
model TimeEntry {
  @@index([userId, date])    // Búsquedas por usuario y fecha
  @@index([projectId])        // Filtros por proyecto
}

model Project {
  @@index([clientId])         // Relación con cliente
}
```

---

## 🚀 Optimizaciones de Rendimiento

### 1. Server Components por Defecto

```tsx
// ✅ Renderizado en servidor (gratis)
export default async function DashboardPage() {
  const stats = await getDashboardStats(); // Sin loading state
  return <Dashboard stats={stats} />;
}
```

### 2. Streaming con Suspense

```tsx
<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>
```

### 3. Revalidación Inteligente

```typescript
// Revalidar solo lo necesario
revalidatePath('/hours/daily');
revalidatePath('/dashboard');
```

---

## 🧪 Testing (Futuro)

### Estructura Recomendada

```
__tests__/
├── unit/
│   ├── actions/
│   └── components/
├── integration/
│   └── flows/
└── e2e/
    └── critical-paths/
```

---

## 📦 Despliegue

### Variables de Entorno Requeridas

```env
# Producción
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."           # openssl rand -base64 32
AUTH_TRUST_HOST="true"
NODE_ENV="production"
```

### Build Process

```bash
npm run build
# → Next.js compila
# → Prisma genera cliente
# → Optimiza assets
# → Genera .next/
```

---

## 🔧 Extensibilidad

### Agregar un Nuevo Módulo

1. **Crear modelo** en `schema.prisma`
2. **Aplicar migración**: `npx prisma db push`
3. **Crear server actions** en `app/[modulo]/actions.ts`
4. **Crear UI** en `app/(protected)/[modulo]/page.tsx`
5. **Agregar al menú** en `components/layout/Sidebar.tsx`

### Ejemplo: Módulo de Vacaciones

```typescript
// 1. prisma/schema.prisma
model Vacation {
  id        String   @id @default(cuid())
  userId    String
  startDate DateTime
  endDate   DateTime
  user      User     @relation(fields: [userId], references: [id])
}

// 2. app/vacations/actions.ts
'use server';
export async function requestVacation(data) {
  const session = await auth();
  return await prisma.vacation.create({
    data: { ...data, userId: session.user.id }
  });
}

// 3. app/(protected)/vacations/page.tsx
export default async function VacationsPage() {
  const vacations = await getMyVacations();
  return <VacationList vacations={vacations} />;
}
```

---

## 📖 Recursos Adicionales

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://authjs.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

**Última actualización**: Enero 2026
