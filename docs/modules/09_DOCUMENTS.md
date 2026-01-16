# PRINCIPAL — Documentos (Sistema de Gestión Documental Completo)

## Objetivo
Sistema centralizado de gestión documental con carpetas jerárquicas, versionado automático, permisos granulares, carpeta PUBLIC para invitados, y vinculación automática con proyectos.

## Permisos (RBAC implementado)
- **GUEST (Invitado)**: Solo lectura en carpeta PUBLIC
- **WORKER**: Ver documentos según permisos + subir en carpetas permitidas
- **MANAGER**: Gestionar carpetas y permisos de su equipo/proyectos
- **ADMIN/SUPERADMIN**: Acceso total

## Navegación
### Rutas existentes
- `/documents` - Vista principal de documentos
- TBD: `/documents/upload`, `/documents/:id`

## Flujos exactos implement ados

### 1. Listar documentos
**Server action:** `getAllDocuments(filters?)`
```typescript
{
  folderId?: string
  projectId?: string
  isPublic?: boolean
  uploadedById?: string
}
```

**RBAC:**
- GUEST: solo `isPublic: true`
- WORKER: documentos compartidos + propios + de proyectos donde es miembro
- MANAGER+: todos de su companyId
- Filtrado automático por companyId

### 2. Subir documento
**Server action:** `uploadDocument(formData)`
1. Extrae archivo del FormData
2. Validaciones:
   - Tamaño máximo (configurable)
   - Tipo permitido (whitelist)
3. Guarda archivo en filesystem/storage
4. Busca documento con mismo nombre en carpeta:
   - **Si existe**: crea DocumentVersion (versionado automático)
   - **Si no**: crea Document
5. Si projectId: vincula automáticamente
6. Audita: `DOCUMENT_UPLOADED`
7. Retorna document con URL de acceso

### 3. Crear documento (metadata)
**Server action:** `createDocument(data)`
```typescript
{
  name: string
  description?: string
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
  projectId?: string
  folderId?: string
  isPublic?: boolean
}
```
- Usado internamente por uploadDocument
- Puede usarse para documentos externos (solo referencia)

### 4. Obtener documento
**Server action:** `getDocument(id)`
- Verifica permisos (shared, miembro proyecto, o public)
- Retorna document con versions y shares
- **No audita** lectura (volumen alto)

### 5. Actualizar documento
**Server action:** `updateDocument(id, data)`
```typescript
{
  name?: string
  description?: string
  isPublic?: boolean
  folderId?: string  // Mover a otra carpeta
}
```
- Solo owner o ADMIN+
- Audita: `DOCUMENT_UPDATED`

### 6. Eliminar documento
**Server action:** `deleteDocument(id)`
- Solo owner o ADMIN+
- Hard delete (borra versiones en CASCADE)
- Audita: `DOCUMENT_DELETED` (CRITICAL)

### 7. Gestionar carpetas
**Server actions:**
- `getAllFolders(projectId?)` - Lista carpetas
- `createFolder(data)` - Crear carpeta
- `deleteFolder(id)` - Eliminar (solo si vacía)

**Estructura jerárquica:**
```typescript
{
  name: string
  description?: string
  projectId?: string  // Carpeta de proyecto
  parentId?: string   // Subcarpeta
}
```

**Carpeta especial PUBLIC:**
- Debe existir siempre (seed)
- `isPublic: true` en todos sus documentos
- GUEST puede ver/descargar
- No se puede eliminar

### 8. Versionado automático
**Server action:** `createDocumentVersion(data)`
```typescript
{
  documentId: string
  fileName: string
  filePath: string
  fileSize: number
  changes?: string  // Descripción de cambios
}
```
- Incrementa Document.version
- Audita: `DOCUMENT_VERSION_CREATED`

**Flujo automático:**
1. Usuario sube archivo "contrato.pdf"
2. Si ya existe "contrato.pdf" en esa carpeta:
   - Guarda nuevo archivo como `contrato-v2.pdf`
   - Crea DocumentVersion con version = 2
   - Actualiza Document.version = 2
3. Historial completo en DocumentVersion[]

### 9. Compartir documento
**Server action:** `shareDocument(data)`
```typescript
{
  documentId: string
  sharedWithId?: string     // Usuario específico
  sharedWithEmail?: string  // Email externo (futuro)
  accessLevel: "VIEW" | "DOWNLOAD" | "EDIT"
 expiresAt?: Date
}
```
- Crea DocumentShare
- Notifica: `DOCUMENT_SHARED`
- Audita: `DOCUMENT_SHARED`

### 10. Revocar compartición
**Server action:** `revokeShare(id)`
- Elimina DocumentShare
- Audita: `DOCUMENT_SHARE_REVOKED`

### 11. Estadísticas
**Server action:** `getDocumentStats(projectId?)`
```typescript
{
  totalDocuments: number
  totalSize: number  // En bytes
  byType: { [type]: count }
  recentUploads: Document[]
}
```

## Reglas de negocio

### Versionado
- Automático al subir archivo con nombre duplicado en misma carpeta
- Versiones incrementales: v1, v2, v3...
- Versión actual siempre en Document.version
- Historial completo en DocumentVersion[]

### Niveles de acceso (enum AccessLevel)
```prisma
VIEW      // Solo ver metadata
DOWNLOAD  // Ver + descargar
EDIT      // Ver + descargar + editar metadata
```

### Carpeta PUBLIC
- Nombre reservado: "PUBLIC"
- Accesible para GUEST
- Todos sus documentos tienen `isPublic: true`
- No se puede eliminar
- ADMIN+ puede subir

### Integración con proyectos
- Al crear proyecto → crear carpeta automática
- Documentos de proyecto tienen `projectId`
- Permisos heredados de ProjectMember

## Datos (schema completo)

### Document
```prisma
model Document {
  id           String   @id @default(cuid())
  name         String
  description  String?
  fileName     String   // Nombre original
  fileSize     Int      // Bytes
  fileType     String   // MIME type
  filePath     String   // Ruta en filesystem/S3
  version      Int      @default(1)
  projectId    String?
  folderId     String?
  uploadedById String
  isPublic     Boolean  @default(false)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  project    Project?
  folder     Folder?
  uploadedBy User
  versions   DocumentVersion[]
  shares     DocumentShare[]
}
```

### DocumentVersion
```prisma
model DocumentVersion {
  id           String   @id
  documentId   String
  version      Int
  fileName     String
  filePath     String
  fileSize     Int
  uploadedById String
  changes      String?
  createdAt    DateTime @default(now())
  
  document   Document @relation(onDelete: Cascade)
  uploadedBy User
}
```

### Folder
```prisma
model Folder {
  id          String   @id
  name        String
  description String?
  projectId   String?
  parentId    String?     // Para jerarquía
  createdById String
  createdAt   DateTime @default(now())
  
  project   Project?
  parent    Folder? ("FolderHierarchy")
  children  Folder[] ("FolderHierarchy")
  createdBy User
  documents Document[]
}
```

### DocumentShare
```prisma
model DocumentShare {
  id              String      @id
  documentId      String
  sharedWithId    String?
  sharedWithEmail String?     // Futuro: compartir con externos
  accessLevel     AccessLevel @default(VIEW)
  expiresAt       DateTime?
  createdAt       DateTime    @default(now())
  
  document   Document @relation(onDelete: Cascade)
  sharedWith User?
}
```

## Notificaciones
- `DOCUMENT_SHARED` - Documento compartido con usuario
- `DOCUMENT_UPDATED` - Documento modificado (si compartido)
- `DOCUMENT_VERSION_CREATED` - Nueva versión disponible

## Auditoría
### Eventos registrados
- `DOCUMENT_UPLOADED` (INFO)
- `DOCUMENT_UPDATED` (INFO)
- `DOCUMENT_DELETED` (CRITICAL)
- `DOCUMENT_MOVED` (INFO - cambio de carpeta)
- `DOCUMENT_VERSION_CREATED` (INFO)
- `DOCUMENT_SHARED` (WARNING)
- `DOCUMENT_SHARE_REVOKED` (INFO)
- `DOCUMENT_DOWNLOADED` (opcional, si se requiere tracking estricto)

## Criterios de aceptación
- Given GUEST, When accede a /documents, Then ve solo carpeta PUBLIC
- Given documento en carpeta proyecto, When usuario no es miembro proyecto, Then no puede acceder
- Given archivo duplicado, When se sube, Then crea versión automática
- Given documento compartido con expiresAt, When fecha pasa, Then share se invalida
- Given carpeta con documentos, When se intenta eliminar, Then error "carpeta no vacía"
- Given proyecto nuevo, When se crea, Then carpeta del proyecto se crea automáticamente

## Edge cases
- Archivo muy grande: validar antes de subir (client-side + server-side)
- Carpeta PUBLIC eliminada: seed la recrea
- Documento sin carpeta: permitido, raíz virtual
- Share expirado: validar en cada acceso
- Versiones antiguas: mostrar en timeline, permitir descargar

## Tests mínimos
```typescript
// RBAC
- guest_only_sees_public_folder
- worker_cannot_access_project_docs_not_member
- admin_can_access_all_company_docs

// Versionado
- duplicate_upload_creates_version
- version_increments_correctly
- can_download_old_versions

// Compartición
- share_with_user_grants_access
- expired_share_denies_access
- revoke_share_removes_access

// Carpetas
- cannot_delete_folder_with_documents
- PUBLIC_folder_always_exists
- project_creation_creates_folder

// Integración
- project_docs_filtered_correctly
- chat_can_attach_documents
```

## Integraciones con otros módulos
- **Proyectos** (`14_PROJECTS`): Carpeta auto-created, tab documentos
- **Chat** (`07_CHAT`): Adjuntar documentos en mensajes
- **Facturas/Presupuestos** (`15_QUOTES`, `16_INVOICES`): PDF generados se guardan como documentos
- **Gastos** (Expenses): Recibos como documentos

## Almacenamiento
### Actual (filesystem local)
```
/uploads/documents/
  /{companyId}/
    /{year}/{month}/
      {filename}
```

### Futuro (recomendado)
- AWS S3 / Azure Blob / Google Cloud Storage
- CDN para descargas rápidas
- Signed URLs para acceso temporal

## Mejoras pendientes (Roadmap)
- Búsqueda full-text en contenido (OCR, PDF parsing)
- Vista previa en navegador (PDF, imágenes, Office)
- Editor colaborativo (Google Docs-like)
- Cifrado en reposo para documentos sensibles
- Papelera de reciclaje (soft delete + restore)
- Bulk upload (multiple files)
- Arrastrar y soltar para organizar
- Plantillas de documentos
- Firma digital / workflow de aprobación
