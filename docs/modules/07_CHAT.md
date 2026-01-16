# PRINCIPAL — Chat (Sistema Completo Implementado)

## Objetivo
Mensajería interna tipo Teams con soporte para chats 1:1, grupos y chats de proyecto. Incluye adjuntos, respuestas, menciones, favoritos, edición/borrado y búsqueda.

## Permisos
- Usuarios internos (WORKER+): acceso completo
- Invitado (GUEST): sin acceso por defecto
- Permisos específicos:
  - Crear grupos: MANAGER+
  - Eliminar grupos: creador del grupo o ADMIN+
  - Chat de proyecto: solo miembros del proyecto

## Navegación
### Rutas existentes
- `/chat` - Vista principal del chat
- `/chat/nuevo` - Crear nuevo chat (TBD si existe)

### Estructura actual
Chat modal/panel lateral integrado en dashboard

## Flujos exactos implementados

### 1. Crear conversación 1:1
**Server action:** `getOrCreateDirectChat(otherUserId)`
1. Busca chat directo existente entre ambos usuarios
2. Si no existe:
   - Crea Chat con `type: DIRECT`
   - Añade ChatMember para ambos usuarios
3. Retorna chatId
4. **No audita** (acción frecuente, nivel INFO)

###2. Crear chat de proyecto
**Server action:** `getOrCreateProjectChat(projectId)`
1. Verifica que usuario es miembro del proyecto
2. Busca chat con `type: PROJECT` y ese projectId
3. Si no existe:
   - Crea Chat con `type: PROJECT`, `name: nombreProyecto`
   - Añade todos los miembros del proyecto como ChatMember
4. Retorna chatId

### 3. Crear grupo personalizado
**Server action:** `createGroupChat(name, participantIds[])`
- **Permiso:** MANAGER+ (verificar en implementación)
- Crea Chat con `type: GROUP`
- Añade imagen opcional (`image` field)
- Añade participantes como ChatMember con `role: MEMBER`
- Creador tiene `role: ADMIN`
- Audita: `GROUP_CHAT_CREATED`

### 4. Enviar mensaje
**Server action:** `sendMessage(chatId, content, attachments?, replyToId?)`
1. Verifica que usuario es miembro del chat
2. Crea Message con:
   - `content` (texto)
   - `attachments` (JSON con IDs de documentos)
   - `mentions` (array de userIds extraídos de @usuario)
   - `replyToId` (para hilos)
3. Actualiza Chat.updatedAt
4. Crea notificaciones:
   - `MENTION_RECEIVED` para mencionados (prioridad alta)
   - `MESSAGE_RECEIVED` para otros miembros
5. **No audita** (volumen alto)

### 5. Editar mensaje
**Server action:** `editMessage(messageId, newContent)`
- Solo autor puede editar
- No permite editar si deletedAt existe
- Marca `isEdited: true`
- Actualiza `updatedAt`
- **No audita**

### 6. Eliminar mensaje
**Server action:** `deleteMessage(messageId)`
- Solo autor o ADMIN del chat
- Soft delete: marca `deletedAt`
- **No audita** (reversible)

### 7. Marcar como leído
**Server action:** `markAsRead(chatId)`
- Actualiza ChatMember.lastRead = now()
- Reduce contador de no leídos

### 8. Favoritos
**Server action:** `toggleChatFavorite(chatId)`
- Actualiza ChatMember.isFavorite
- Muestra chat en sección de favoritos en UI

### 9. Búsqueda
**Server action:** `searchMessagesInChat(chatId, query)`
- Busca en Message.content
- Solo mensajes no borrados
- Paginado

### 10. Typing indicator
**Server actions:**
- `setTypingStatus(chatId, isTyping)`
- `getTypingUsers(chatId)`
- Implementado con polling (cada 3s)

### 11. Gestionar grupo
**Server action:** `updateGroupChat(chatId, { name?, image?, addMembers?, removeMembers? })`
- Solo admin del grupo o ADMIN general
- Puede añadir/quitar miembros
- Cambiar nombre/imagen
- Audita: `GROUP_CHAT_UPDATED`

### 12. Eliminar grupo
**Server action:** `deleteGroupChat(chatId)`
- Solo creador o ADMIN
- Hard delete (CASCADE borra mensajes y memberships)
- Audita: `GROUP_CHAT_DELETED` (CRITICAL)

## Reglas de negocio

### Estados
- No hay estados de chat (siempre activo)
- lastRead por usuario (ChatMember.lastRead)
- Mensajes borrados: deletedAt (soft delete)

### Tipos de chat (enum ChatType)
```prisma
enum ChatType {
  PROJECT   // Vinculado a un proyecto
  DIRECT    // 1-a-1
  GROUP     // Grupo personalizado
}
```

### Reglas
- Chat DIRECT: exactamente 2 miembros, no modificable
- Chat PROJECT: auto-sync con miembros del proyecto
- Chat GROUP: admin puede gestionar miembros
- Adjuntos: referencias a Document.id (JSON array)
- Menciones: detectadas automáticamente (@username)
- No leídos: contados por lastRead < Message.createdAt

## Datos (schema completo)

### Chat
```prisma
model Chat {
  id        String   @id @default(cuid())
  type      ChatType @default(PROJECT)
  name      String?  // Null para DIRECT
  image     String?  // URL imagen (grupos)
  projectId String?
  project   Project? @relation(...)
  
  messages  Message[]
  members   ChatMember[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### ChatMember
```prisma
model ChatMember {
  id         String   @id
  chatId     String
  userId     String
  isFavorite Boolean  @default(false)
  role       String   @default("MEMBER") // "ADMIN" | "MEMBER"
  lastRead   DateTime @default(now())
  joinedAt   DateTime @default(now())
  
  @@unique([chatId, userId])
}
```

### Message
```prisma
model Message {
  id          String    @id
  content     String    @db.Text
  chatId      String
  authorId    String
  replyToId   String?   // Para hilos
  attachments Json?     // Array de document IDs
  mentions    String[]  // User IDs mencionados
  isEdited    Boolean   @default(false)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

## Notificaciones

### Tipos implementados
- `MESSAGE_RECEIVED` - Nuevo mensaje en chat
- `MENTION_RECEIVED` - Usuario mencionado con @
- `GROUP_CHAT_CREATED` - Añadido a grupo nuevo
- `GROUP_CHAT_UPDATED` - Cambios en grupo

### Destinatarios
- Mensaje normal: todos los miembros except author
- Mención: usuario mencionado (prioridad)
- Grupo creado: todos los participantes

## Auditoría
### Eventos registrados
- `GROUP_CHAT_CREATED` (INFO)
- `GROUP_CHAT_UPDATED` (INFO)
- `GROUP_CHAT_DELETED` (CRITICAL)

### NO se audita (volumen)
- Envío/edición/eliminación de mensajes individuales
- Marcar como leído
- Typing status

## Criterios de aceptación
- Given WORKER, When abre chat 1:1 con otro usuario, Then se crea chat DIRECT automáticamente
- Given chat PROJECT, When se añade miembro al proyecto, Then se añade a chat automáticamente
- Given mensaje con @usuario, When se envía, Then usuario recibe notificación MENTION_RECEIVED
- Given mensaje con attachments, When se abre, Then muestra documentos vinculados
- Given chat GROUP, When admin añade miembro, Then nuevo miembro ve historial completo
- Given mensaje borrado, When otro usuario lo ve, Then aparece como "Mensaje eliminado"

## Edge cases
- Chat PROJECT sin miembros: debería tener al menos PM
- Mención a usuario no miembro: se ignora
- Adjunto de documento eliminado: mostrar "Archivo no disponible"
- Último admin de grupo se sale: promover siguiente miembro a admin
- Chat DIRECT entre usuarios de diferentes companies: impedir (multi-tenancy)

## Tests mínimos
```typescript
// RBAC
- guest_cannot_access_chats
- user_cannot_see_chats_not_member

// Funcionalidad
- send_message_creates_notification
- mention_creates_priority_notification
- edit_message_marks_as_edited
- delete_message_soft_deletes
- mark_read_updates_lastread
- favorite_toggle_persists

// Grupos
- create_group_requires_manager
- add_member_sends_notification
- delete_group_cascades_messages
- non_admin_cannot_modify_group

// Proyecto
- project_chat_auto_syncs_members
- removed_from_project_loses_chat_access
```

## Integraciones con otros módulos
- **Proyectos** (`14_PROJECTS`): Chat auto-created con miembros
- **Documentos** (`09_DOCUMENTS`): Adjuntos referenciados
- **Notificaciones** (`11_NOTIFICATIONS`): Todos los eventos de chat
- **Usuarios** (`17_USERS`): Búsqueda para añadir a grupos
- **Presencia** (nuevo): Mostrar estado en lista de chats

## Mejoras pendientes (Roadmap)
- WebSocket para mensajes en tiempo real
- Reacciones a mensajes (emojis)
- Mensajes de voz
- Compartir pantalla/videollamada (ya implementado con Jitsi)
- Mensajes programados
- Cifrado end-to-end para chats sensibles
