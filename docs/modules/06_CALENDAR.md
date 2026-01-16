# PRINCIPAL — Calendario (System de Gestión de Eventos)

## Objetivo
Planificación personal y de equipo con eventos, privacidad, asistentes e integración con proyectos.

## Permisos (RBAC implementado)
- **WORKER**: CRUD propios + ver donde es attendee
- **MANAGER+**: CRUD global y vista equipo
- **GUEST**: Sin acceso

## Navegación
### Rutas existentes
- `/calendar` - Vista calendario principal
-TBD: `/calendar/new`, `/calendar/:id`

## Datos (schema completo)

### Event
```prisma
model Event {
  id          String    @id @default(cuid())
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime
  allDay      Boolean   @default(false)
  location    String?
  type        EventType @default(MEETING)
  
  userId    String      // Creador
  projectId String?    // Opcional
  
  user    User
  project Project?
  attendees EventAttendee[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### EventAttendee
```prisma
model EventAttendee {
  id      String         @id
  eventId String
  userId  String
  status  AttendeeStatus @default(PENDING)
  
  event Event
  user  User
  
  @@unique([eventId, userId])
}
```

## Tipos de evento (enum EventType)
```prisma
MEETING     // Reunión
DEADLINE    // Fecha límite
REMINDER    // Recordatorio
HOLIDAY     // Festivo
OTHER       //Otro
```

## Estados de asistencia (enum AttendeeStatus)
```prisma
PENDING    // Sin responder
ACCEPTED   // Aceptado
DECLINED   // Rechazado
TENTATIVE  // Tentativo
```

## Flujos principales
1. **Crear evento** → invitar asistentes → notificar
2. **Privacidad PRIVATE** → otros ven "Ocupado" sin detalles
3. **Editar/cancelar** → notificar a todos los asistentes
4. **Responder invitación** → actualizar status

## Notificaciones
- `EVENT_INVITED` - Invitado a evento
- `EVENT_UPDATED` - Evento modificado
- `EVENT_CANCELLED` - Evento cancelado
- `EVENT_REMINDER` - 24h antes

## Auditoría
- `EVENT_CREATE/UPDATE/DELETE`
- `ATTENDEE_ADD/REMOVE`

## Integración
- **Proyectos** (`14_PROJECTS`): Eventos vinculados a projectId
- **Tareas** (`08_TASKS`): Meeting type puede crear task
