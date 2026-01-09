# 📋 SPRINT 2: MÓDULO DE DOCUMENTOS

**Duración**: Semanas 3-4
**Objetivo**: Sistema completo de gestión documental con upload, versionado y compartición

---

## 🎯 OBJETIVOS DEL SPRINT

### **Funcionalidades Core**
1. Upload de archivos (PDF, DWG, Excel, Word, imágenes)
2. Organización por proyectos y carpetas
3. Versionado de documentos
4. Compartir documentos con clientes
5. Previsualización de archivos
6. Búsqueda y filtros avanzados

---

## 📁 ESTRUCTURA DE ARCHIVOS

### **Modelos de Base de Datos** (Prisma)

```prisma
model Document {
  id          String   @id @default(cuid())
  name        String
  description String?
  fileName    String
  fileSize    Int
  fileType    String
  filePath    String
  version     Int      @default(1)
  projectId   String?
  folderId    String?
  uploadedById String
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  project     Project?  @relation(fields: [projectId], references: [id])
  folder      Folder?   @relation(fields: [folderId], references: [id])
  uploadedBy  User      @relation(fields: [uploadedById], references: [id])
  versions    DocumentVersion[]
  shares      DocumentShare[]
  
  @@index([projectId])
  @@index([folderId])
  @@index([uploadedById])
}

model DocumentVersion {
  id          String   @id @default(cuid())
  documentId  String
  version     Int
  fileName    String
  filePath    String
  fileSize    Int
  uploadedById String
  changes     String?
  createdAt   DateTime @default(now())
  
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  uploadedBy  User     @relation(fields: [uploadedById], references: [id])
  
  @@index([documentId])
}

model Folder {
  id          String   @id @default(cuid())
  name        String
  description String?
  projectId   String?
  parentId    String?
  createdById String
  createdAt   DateTime @default(now())
  
  project     Project?  @relation(fields: [projectId], references: [id])
  parent      Folder?   @relation("FolderHierarchy", fields: [parentId], references: [id])
  children    Folder[]  @relation("FolderHierarchy")
  createdBy   User      @relation(fields: [createdById], references: [id])
  documents   Document[]
  
  @@index([projectId])
  @@index([parentId])
}

model DocumentShare {
  id          String   @id @default(cuid())
  documentId  String
  sharedWithId String?
  sharedWithEmail String?
  accessLevel String   @default("VIEW") // VIEW, DOWNLOAD, EDIT
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  sharedWith  User?    @relation(fields: [sharedWithId], references: [id])
  
  @@index([documentId])
  @@index([sharedWithId])
}
```

---

## 🗂️ COMPONENTES A CREAR

### **1. Vista Principal de Documentos**
**Archivo**: `src/app/(protected)/documents/page.tsx`

**Características**:
- Lista de documentos con grid/list view
- Filtros por proyecto, tipo, fecha
- Búsqueda en tiempo real
- Botón de upload
- Acciones rápidas (descargar, compartir, eliminar)

### **2. Upload de Archivos**
**Archivo**: `src/components/documents/UploadModal.tsx`

**Características**:
- Drag & drop
- Múltiples archivos
- Barra de progreso
- Validación de tipos y tamaño
- Asociar a proyecto/carpeta
- Agregar descripción

### **3. Visor de Documentos**
**Archivo**: `src/components/documents/DocumentViewer.tsx`

**Características**:
- Preview de PDFs
- Preview de imágenes
- Información del documento
- Historial de versiones
- Botón de descarga
- Compartir

### **4. Gestor de Carpetas**
**Archivo**: `src/components/documents/FolderTree.tsx`

**Características**:
- Árbol de carpetas
- Crear/editar/eliminar carpetas
- Drag & drop de documentos
- Breadcrumbs de navegación

### **5. Compartir Documentos**
**Archivo**: `src/components/documents/ShareModal.tsx`

**Características**:
- Compartir con usuarios internos
- Compartir con clientes (email)
- Niveles de acceso (ver, descargar, editar)
- Fecha de expiración
- Link público temporal

### **6. Versionado**
**Archivo**: `src/components/documents/VersionHistory.tsx`

**Características**:
- Lista de versiones
- Comparar versiones
- Restaurar versión anterior
- Notas de cambios

---

## 🔧 SERVER ACTIONS

**Archivo**: `src/app/(protected)/documents/actions.ts`

```typescript
// Upload
export async function uploadDocument(formData: FormData)
export async function uploadNewVersion(documentId: string, formData: FormData)

// CRUD
export async function getDocuments(filters?: DocumentFilters)
export async function getDocument(id: string)
export async function updateDocument(id: string, data: UpdateDocumentData)
export async function deleteDocument(id: string)

// Folders
export async function createFolder(data: CreateFolderData)
export async function getFolders(projectId?: string)
export async function moveDocument(documentId: string, folderId: string)

// Sharing
export async function shareDocument(documentId: string, shareData: ShareData)
export async function getDocumentShares(documentId: string)
export async function revokeShare(shareId: string)

// Versions
export async function getDocumentVersions(documentId: string)
export async function restoreVersion(documentId: string, versionId: string)
```

---

## 📦 DEPENDENCIAS NECESARIAS

```bash
# Upload de archivos
npm install uploadthing @uploadthing/react

# O alternativa con AWS S3
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Preview de PDFs
npm install react-pdf pdfjs-dist

# Iconos de tipos de archivo
npm install react-file-icon
```

---

## 🎨 DISEÑO UI/UX

### **Colores por Tipo de Archivo**
- PDF: `bg-error-50 text-error-700`
- Word: `bg-info-50 text-info-700`
- Excel: `bg-success-50 text-success-700`
- DWG/CAD: `bg-orange-50 text-orange-700`
- Imagen: `bg-purple-50 text-purple-700`
- Otros: `bg-neutral-50 text-neutral-700`

### **Layout**
```
┌─────────────────────────────────────────────────┐
│ Header: Documentos | Upload | Búsqueda          │
├─────────────┬───────────────────────────────────┤
│             │                                   │
│  Carpetas   │  Grid de Documentos              │
│  (Sidebar)  │  ┌───┬───┬───┬───┐              │
│             │  │📄 │📊 │🖼️ │📐 │              │
│  📁 Todos   │  └───┴───┴───┴───┘              │
│  📁 P-26-001│                                   │
│  📁 P-26-002│  Filtros: Tipo | Fecha | Proyecto│
│             │                                   │
└─────────────┴───────────────────────────────────┘
```

---

## ⚡ OPTIMIZACIONES

### **Performance**
- Lazy loading de documentos
- Paginación (20 documentos por página)
- Thumbnails en caché
- Compresión de imágenes

### **Seguridad**
- Validación de tipos de archivo
- Límite de tamaño (50MB por archivo)
- Sanitización de nombres
- Permisos por usuario/rol
- Tokens de acceso temporal

---

## 📊 MÉTRICAS DE ÉXITO

- ✅ Upload de archivos < 5 segundos
- ✅ Preview de documentos < 2 segundos
- ✅ Búsqueda en tiempo real < 500ms
- ✅ 100% de archivos con versionado
- ✅ Compartir documentos en 3 clicks

---

## 🗓️ CRONOGRAMA

### **Semana 3 (Días 1-5)**
- Día 1-2: Modelos de BD y migraciones
- Día 3-4: Upload básico y listado
- Día 5: Sistema de carpetas

### **Semana 4 (Días 6-10)**
- Día 6-7: Versionado de documentos
- Día 8: Compartir documentos
- Día 9: Preview y visor
- Día 10: Testing y pulido

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Actualizar schema.prisma** con los nuevos modelos
2. **Ejecutar migración**: `npx prisma db push`
3. **Crear estructura de carpetas** para componentes
4. **Implementar upload básico** con UploadThing
5. **Crear vista principal** de documentos

---

**¿Listo para empezar con el Sprint 2?** 🚀
