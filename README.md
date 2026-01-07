# 🚀 MEP PROJECTS - Plataforma TODO-EN-UNO

**Versión**: 1.0.0  
**Estado**: En Desarrollo Activo  
**Progreso**: 55%

Una plataforma centralizada de gestión empresarial que recoge TODAS las tareas de la empresa, independientemente del departamento, facilitando el trabajo y ahorrando tiempo.

---

## 🎯 VISIÓN

> "El trabajador solo necesita abrir UNA aplicación para trabajar"

MEP Projects es la solución TODO-EN-UNO para empresas de ingeniería MEP que centraliza:
- ✅ Todas las tareas
- ✅ Todas las horas
- ✅ Todos los documentos
- ✅ Todos los proyectos
- ✅ Toda la comunicación
- ✅ Todos los reportes

---

## ✨ CARACTERÍSTICAS PRINCIPALES

### **Gestión de Tareas** ✅
- 3 vistas (Lista, Kanban, Calendario)
- Asignación y prioridades
- Comentarios colaborativos
- Filtros avanzados
- Drag & drop

### **Gestión de Horas** ✅
- Temporizador en tiempo real
- Múltiples entradas por día
- Reportes automáticos
- Validaciones inteligentes

### **Gestión de Documentos** 🚧
- Upload drag & drop
- Organización por carpetas
- Búsqueda instantánea
- Visor integrado
- Versionado

### **Búsqueda Global** ✅
- Atajo Ctrl+K
- Búsqueda en tiempo real
- Navegación por teclado
- Resultados agrupados

### **Dashboard Interactivo** ✅
- Widgets personalizables
- Gráficos animados
- Acciones rápidas
- KPIs en tiempo real

---

## 🚀 INICIO RÁPIDO

### **Requisitos**
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### **Instalación**

```bash
# Clonar repositorio
git clone [url-del-repo]
cd MepTest-main

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Configurar base de datos
npx prisma db push
npx prisma db seed

# Iniciar servidor de desarrollo
npm run dev
```

### **Acceder a la Aplicación**

```
URL: http://localhost:3000

ADMIN:
📧 admin@mep-projects.com
🔑 admin123

TRABAJADORES (password: admin123):
📧 carlos.martinez@mep-projects.com
📧 ana.lopez@mep-projects.com
📧 miguel.sanchez@mep-projects.com
📧 laura.fernandez@mep-projects.com
📧 david.rodriguez@mep-projects.com
```

---

## 📊 MÓDULOS

| Módulo | Estado | Progreso | Descripción |
|--------|--------|----------|-------------|
| **Tareas** | ✅ Completado | 100% | Gestión completa de tareas |
| **Horas** | ✅ Completado | 100% | Registro y reportes de horas |
| **Documentos** | 🚧 En Progreso | 55% | Gestión documental |
| **Búsqueda** | ✅ Completado | 100% | Búsqueda global |
| **Dashboard** | ✅ Completado | 100% | Panel de control |
| **Proyectos** | 🔧 Básico | 40% | Gestión de proyectos |
| **Clientes** | 🔧 Básico | 40% | Gestión de clientes |
| **Comunicación** | ⏳ Planificado | 0% | Chat y notificaciones |
| **Calendario** | ⏳ Planificado | 0% | Calendario compartido |
| **Reportes** | ⏳ Planificado | 0% | Reportes avanzados |

---

## 🛠️ STACK TECNOLÓGICO

### **Frontend**
- **Framework**: Next.js 16.1.1 (App Router + Turbopack)
- **UI**: React 19
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4
- **Animaciones**: Framer Motion 12
- **Iconos**: Lucide React

### **Backend**
- **Autenticación**: NextAuth v5
- **ORM**: Prisma 5.22
- **Base de Datos**: PostgreSQL
- **API**: Server Actions + API Routes

### **Features**
- Server-Side Rendering (SSR)
- Client-Side Rendering (CSR)
- Búsqueda en tiempo real
- Drag & Drop nativo
- Atajos de teclado
- Responsive design
- Animaciones optimizadas

---

## 📁 ESTRUCTURA DEL PROYECTO

```
MepTest-main/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.ts                # Datos de ejemplo
├── src/
│   ├── app/
│   │   ├── (auth)/           # Rutas de autenticación
│   │   ├── (protected)/      # Rutas protegidas
│   │   │   ├── dashboard/    # Dashboard
│   │   │   ├── tasks/        # Tareas
│   │   │   ├── hours/        # Horas
│   │   │   ├── documents/    # Documentos
│   │   │   ├── projects/     # Proyectos
│   │   │   └── clients/      # Clientes
│   │   └── api/              # API Routes
│   ├── components/           # Componentes React
│   │   ├── dashboard/        # Widgets del dashboard
│   │   ├── hours/            # Componentes de horas
│   │   ├── documents/        # Componentes de documentos
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utilidades
│   └── auth.ts               # Configuración de auth
├── public/                   # Archivos estáticos
└── docs/                     # Documentación
```

---

## ⌨️ ATAJOS DE TECLADO

```
Ctrl+K      → Búsqueda global
↑↓          → Navegar resultados
Enter       → Abrir resultado
Esc         → Cerrar modal
```

**Próximamente**:
```
Ctrl+H      → Nueva entrada de horas
Ctrl+T      → Nueva tarea
Ctrl+D      → Nuevo documento
Ctrl+P      → Nuevo proyecto
```

---

## 💰 ROI - RETORNO DE INVERSIÓN

### **Ahorro de Tiempo**

**Antes** (múltiples herramientas):
- 130 min/día por usuario

**Después** (MEP Projects):
- 40 min/día por usuario

**Ahorro**: 90 min/día (1.5 horas)

### **Impacto Económico (10 usuarios)**
- **€7,500/mes** ahorrados
- **€90,000/año** ahorrados

### **Beneficios Adicionales**
- ✅ Menos errores
- ✅ Mejor comunicación
- ✅ Decisiones más rápidas
- ✅ Mayor satisfacción del equipo

---

## 📚 DOCUMENTACIÓN

### **Para Usuarios**
- [Guía de Uso](./GUIA_DE_USO.md) - Cómo usar la plataforma
- [Guía de Seed](./SEED_GUIDE.md) - Datos de ejemplo

### **Para Desarrolladores**
- [Visión TODO-EN-UNO](./VISION_TODO_EN_UNO.md) - Visión completa
- [Plan de Profesionalización](./PLAN_PROFESIONALIZACION.md) - Automatizaciones
- [Sistema de Horas](./SISTEMA_HORAS_PROFESIONAL.md) - Especificaciones

### **Gestión del Proyecto**
- [Progreso](./PROGRESO.md) - Estado actual
- [Resumen Ejecutivo](./RESUMEN_EJECUTIVO.md) - Resumen completo
- [Roadmap](./ROADMAP.md) - Plan de desarrollo

---

## 🚀 SCRIPTS DISPONIBLES

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo (Turbopack)
npm run build            # Construir para producción
npm run start            # Iniciar servidor de producción

# Base de Datos
npx prisma studio        # Abrir Prisma Studio
npx prisma db push       # Sincronizar schema con BD
npx prisma db seed       # Poblar con datos de ejemplo
npx prisma generate      # Generar Prisma Client

# Calidad de Código
npm run lint             # Ejecutar ESLint
npm run type-check       # Verificar tipos TypeScript
```

---

## 🔄 ROADMAP

### **Fase 1: Consolidación** (Semana 4)
- [ ] Completar módulo de documentos
- [ ] Mejorar vista de horas
- [ ] Sistema de notificaciones

### **Fase 2: Comunicación** (Semana 5-6)
- [ ] Chat interno
- [ ] Calendario compartido
- [ ] Notificaciones en tiempo real

### **Fase 3: Gestión** (Semana 7-8)
- [ ] CRM avanzado
- [ ] Gestión de gastos
- [ ] Inventario

### **Fase 4: Analytics** (Semana 9-10)
- [ ] Dashboard ejecutivo
- [ ] Reportes avanzados
- [ ] IA y predicciones

---

## 🤝 CONTRIBUIR

### **Reportar Bugs**
1. Verifica que el bug no esté reportado
2. Crea un issue con descripción detallada
3. Incluye pasos para reproducir
4. Adjunta capturas de pantalla si es posible

### **Sugerir Funcionalidades**
1. Revisa el roadmap
2. Crea un issue con la propuesta
3. Explica el caso de uso
4. Discute con el equipo

### **Desarrollo**
1. Fork del repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 LICENCIA

Este proyecto es privado y propietario de MEP Projects.

---

## 👥 EQUIPO

**Desarrollado con ❤️ por el equipo de MEP Projects**

---

## 📞 SOPORTE

### **Problemas Técnicos**
- Revisa la [Guía de Uso](./GUIA_DE_USO.md)
- Consulta la documentación
- Contacta al administrador del sistema

### **Sugerencias**
- Crea un issue en el repositorio
- Contacta al equipo de desarrollo

---

## 🎯 ESTADO DEL PROYECTO

**Progreso**: 55% ███████████████████████████░░░░░░░░░░░░░

**Última Actualización**: 7 de Enero de 2026

**Próxima Release**: Febrero 2026 (v1.1.0)

---

**¡Gracias por usar MEP Projects!** 🚀
