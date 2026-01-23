<p align="center">
  <img src="public/logo.svg" alt="MEP Projects Logo" width="200" />
</p>

<h1 align="center">MEP Projects</h1>
<p align="center">
  <strong>🏗️ Plataforma ERP Empresarial para Servicios Profesionales</strong>
</p>
<p align="center">
  Gestión integral de proyectos, clientes, facturación, tareas y más — todo en una sola plataforma moderna.
</p>

<p align="center">
  <a href="#-inicio-rápido">Inicio Rápido</a> •
  <a href="#-características">Características</a> •
  <a href="#-para-desarrolladores">Para Developers</a> •
  <a href="#-roadmap-completo">Roadmap</a>
</p>

---

## 📋 ¿Qué es MEP Projects?

MEP Projects es una **plataforma ERP (Enterprise Resource Planning) moderna** diseñada para empresas de servicios profesionales como estudios de ingeniería, arquitectura, consultoría y similares.

### 🎯 Problema que Resuelve

| Sin MEP Projects | Con MEP Projects |
|------------------|------------------|
| Hojas de Excel dispersas | Base de datos centralizada |
| Emails para coordinar | Chat integrado + Notificaciones |
| Control de horas manual | Registro automático con aprobaciones |
| Facturas en Word | Generación automatizada con PDF |
| Seguimiento de clientes en papel | CRM con pipeline visual |
| Documentos en carpetas locales | Gestor documental con versiones |
| Múltiples herramientas desconectadas | Todo integrado en una plataforma |

### 🏆 ¿Por qué MEP Projects?

- **Todo en uno**: No más saltar entre 10 aplicaciones diferentes
- **Diseñado para ingeniería**: Funcionalidades específicas para estudios técnicos
- **Moderno y rápido**: Tecnología de última generación (Next.js 15, React 19)
- **Seguro**: Multi-tenant, RBAC, audit trail completo
- **Escalable**: Preparado para crecer con tu empresa

---

## ✨ Características Actuales

### 🗂️ Módulos Principales

#### 📊 Dashboard & Home
- KPIs en tiempo real: Proyectos activos, tareas pendientes, horas registradas
- Widget de clima integrado
- Actividad reciente del equipo
- Tareas urgentes y accesos directos

#### 📁 Gestión de Proyectos
- Vista de lista y detalle completo
- Fases, etapas y presupuesto
- Equipo asignado con roles
- Documentos y tareas asociadas
- Historial de actividad

#### ✅ Gestión de Tareas
- **Vista Kanban**: Drag & drop entre columnas
- **Vista Lista**: Tabla ordenable y filtrable
- **Vista Calendario**: Por fecha de vencimiento
- Prioridades, asignaciones, comentarios, subtareas, etiquetas

#### 📅 Calendario Avanzado
- Vistas: Mes, Semana, Día
- Eventos, Tareas, Festivos, Notas personales
- **Eventos recurrentes**: Diario, Semanal, Mensual, Anual
- **Drag & Drop**: Reorganizar arrastrando
- Quick Add para notas rápidas

#### 💬 Chat y Comunicación
- Mensajes directos y grupos
- Favoritos y notificaciones
- Búsqueda y archivos compartidos
- Preview de últimos mensajes

#### 📄 Gestor Documental
- Carpetas jerárquicas
- Versiones y preview (PDF, Word, Excel, imágenes)
- Compartir y asociar a proyectos

#### 🕐 Control de Horas
- Registro diario por proyecto
- Resúmenes y flujo de aprobación
- Exportación a Excel

#### 💰 Facturación y Presupuestos
- Facturas con numeración automática
- Estados: DRAFT → SENT → PAID → CANCELLED
- Generación PDF
- Presupuestos con conversión a factura

#### 🎯 CRM
- Pipeline visual: NEW → CONTACTED → QUALIFIED → PROPOSAL → NEGOTIATION → WON/LOST
- Actividades y conversión a cliente

#### 👥 Clientes
- Ficha completa con contactos
- Proyectos y facturas asociadas

#### 📈 Analytics
- Dashboards de productividad e ingresos
- Gráficos y exportación

#### 🔔 Notificaciones
- Alertas en tiempo real
- Centro de notificaciones
- Configuración por tipo

#### ⚙️ SuperAdmin
- Gestión de usuarios y roles
- Festivos y configuración de empresa
- Logs de auditoría

### 🔐 Seguridad

| Característica | Descripción |
|----------------|-------------|
| **Multi-tenant** | Datos aislados por empresa |
| **RBAC** | 4 roles × 11+ recursos |
| **Audit Trail** | Registro automático de acciones |
| **Rate Limiting** | Protección contra abusos |
| **Sesiones seguras** | JWT + HTTP-only cookies |

### 🎨 UX/UI

- Diseño moderno con animaciones fluidas
- Modo oscuro completo
- Responsive (desktop, tablet, móvil)
- Internacionalización (ES, EN)

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+, PostgreSQL 14+, npm

### Instalación

```bash
git clone https://github.com/tu-org/mep-projects.git
cd mep-projects
npm install
cp .env.example .env
npm run db:push && npm run db:seed
npm run dev
```

### Acceso: `http://localhost:3000`

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@mep-projects.com | admin123 |
| Worker | alfonso.mateos@mep-projects.com | admin123 |

---

## 🛠️ Tech Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, Framer Motion |
| Backend | Next.js Server Actions, Prisma ORM 5 |
| Database | PostgreSQL |
| Auth | NextAuth.js 5 |
| Testing | Vitest 4 |

### Arquitectura

```
Browser (React 19 + Tailwind)
        ↕ HTTP
Server (Next.js 15 App Router + Server Actions)
        ↕ Prisma ORM
PostgreSQL (25+ models)
```

### Scripts

```bash
npm run dev          # Desarrollo
npm run db:push      # Aplicar schema
npm run db:seed      # Datos iniciales
npm run db:studio    # GUI de BD
npm test             # Tests
```

---

## 🗺️ Roadmap Completo

### ✅ Fase 1: Core Platform (COMPLETADA)
- ✅ Autenticación, Multi-tenant, RBAC
- ✅ Dashboard, Proyectos, Tareas
- ✅ Control de horas, Calendario, Chat
- ✅ Documentos, CRM, Facturación
- ✅ Notificaciones, Modo oscuro, Audit trail

### ✅ Fase 2: Interactividad (COMPLETADA)
- ✅ Drag & Drop (tareas y calendario)
- ✅ Eventos recurrentes
- ✅ Chat con grupos y favoritos
- ✅ Preview de documentos mejorado

### 🚧 Fase 3: Integraciones
| Feature | Prioridad |
|---------|-----------|
| Exportación iCal | P0 |
| Emails automáticos | P0 |
| PDF templates personalizables | P1 |
| Firma digital | P1 |
| Importación de datos | P2 |

### 📋 Fase 4: Automatización
| Feature | Prioridad |
|---------|-----------|
| Motor de reglas (if X then Y) | P0 |
| Workflows automáticos | P0 |
| Recordatorios inteligentes | P1 |
| Templates de proyecto | P1 |
| Tareas recurrentes | P1 |

### 📋 Fase 5: Finanzas Avanzadas
| Feature | Prioridad |
|---------|-----------|
| Contabilidad básica | P0 |
| Informes financieros (P&L, Balance) | P0 |
| Conciliación bancaria | P1 |
| Gastos de empleados | P1 |
| Multi-moneda | P2 |

### 📋 Fase 6: RRHH
| Feature | Prioridad |
|---------|-----------|
| Vacaciones y ausencias | P0 |
| Nóminas básicas | P1 |
| Objetivos (OKR) | P2 |
| Evaluaciones de desempeño | P2 |

### 📋 Fase 7: Colaboración Avanzada
| Feature | Prioridad |
|---------|-----------|
| Portal de cliente | P0 |
| Menciones (@usuario) | P0 |
| Comentarios en documentos | P1 |
| Videoconferencia | P2 |

### 📋 Fase 8: Analytics Avanzado
| Feature | Prioridad |
|---------|-----------|
| Dashboards customizables | P0 |
| Informes personalizados | P0 |
| Alertas inteligentes | P1 |
| Predicciones ML | P2 |

### 📋 Fase 9: Plataforma
| Feature | Prioridad |
|---------|-----------|
| API REST pública | P0 |
| Webhooks | P0 |
| SDK/CLI | P2 |
| Marketplace | P2 |

### 📋 Fase 10: Móvil
| Feature | Prioridad |
|---------|-----------|
| App iOS | P0 |
| App Android | P0 |
| Push notifications | P0 |
| Modo offline | P1 |

### 📋 Fase 11: Enterprise
| Feature | Prioridad |
|---------|-----------|
| SSO/SAML | P0 |
| Permisos granulares (ABAC) | P0 |
| Multi-región | P1 |
| Cumplimiento (GDPR, SOC2) | P1 |

---

## 📊 Métricas

| Métrica | Valor |
|---------|-------|
| Líneas de código | ~50,000 |
| Modelos de BD | 25+ |
| Componentes React | 80+ |
| Server Actions | 100+ |
| Tests | 30+ |

---

## 📖 Documentación

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [docs/modules/](./docs/modules/)

---

## 📄 Licencia

Propietario - MEP Projects S.L.

---

<p align="center">
  <sub>Versión: 1.0.0</sub>
</p>
