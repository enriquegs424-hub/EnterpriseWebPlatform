'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { checkPermission } from '@/lib/permissions';

// ============================================
// DOCUMENTS
// ============================================

export async function getAllDocuments(filters?: {
    projectId?: string;
    folderId?: string;
    fileType?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autenticado');

    // Check permission
    await checkPermission('documents', 'read');

    const where: any = {};

    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.folderId) where.folderId = filters.folderId;
    if (filters?.fileType) where.fileType = { contains: filters.fileType };

    return await prisma.document.findMany({
        where,
        include: {
            uploadedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            project: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
            folder: {
                select: {
                    id: true,
                    name: true,
                },
            },
            versions: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getDocument(id: string) {
    return await prisma.document.findUnique({
        where: { id },
        include: {
            uploadedBy: true,
            project: true,
            folder: true,
            versions: {
                include: {
                    uploadedBy: true,
                },
                orderBy: { createdAt: 'desc' },
            },
            shares: {
                include: {
                    sharedWith: true,
                },
            },
        },
    });
}

export async function createDocument(data: {
    name: string;
    description?: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    filePath: string;
    projectId?: string;
    folderId?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autenticado');

    // Check permission
    await checkPermission('documents', 'create');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error('Usuario no encontrado');

    const document = await prisma.document.create({
        data: {
            ...data,
            uploadedById: user.id,
        },
    });

    revalidatePath('/documents');
    return { success: true, document };
}

export async function uploadDocument(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { error: 'No autenticado' };

    // Check permission
    await checkPermission('documents', 'create');

    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string | null;
    const folderId = formData.get('folderId') as string | null;

    if (!file) {
        return { error: 'No se ha seleccionado ningún archivo' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) return { error: 'Usuario no encontrado' };

        // Generate unique filename to prevent collisions
        const uniqueId = crypto.randomUUID();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${uniqueId}-${safeFileName}`;
        const filePath = `/uploads/${fileName}`;

        // Convert File to Buffer and save to disk
        const fs = await import('fs/promises');
        const path = await import('path');

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

        // Ensure uploads directory exists
        try {
            await fs.access(uploadsDir);
        } catch {
            await fs.mkdir(uploadsDir, { recursive: true });
        }

        // Read file as ArrayBuffer and convert to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Write file to disk
        await fs.writeFile(path.join(uploadsDir, fileName), buffer);

        // Create document record in database
        const document = await prisma.document.create({
            data: {
                name: file.name,
                fileName: fileName,
                fileSize: file.size,
                fileType: file.type,
                filePath: filePath,
                uploadedById: user.id,
                projectId: projectId || undefined,
                folderId: folderId || undefined,
            },
        });

        revalidatePath('/documents');
        if (projectId) revalidatePath(`/projects/${projectId}`);

        return { success: true, document };
    } catch (error) {
        console.error('Upload error:', error);
        return { error: 'Error al subir el archivo' };
    }
}

export async function updateDocument(id: string, data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autenticado');

    // Check permission
    await checkPermission('documents', 'update');

    await prisma.document.update({
        where: { id },
        data,
    });

    revalidatePath('/documents');
    return { success: true };
}

export async function deleteDocument(id: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autenticado');

    // Check permission
    await checkPermission('documents', 'delete');

    await prisma.document.delete({
        where: { id },
    });

    revalidatePath('/documents');
    return { success: true };
}

// ============================================
// FOLDERS
// ============================================

export async function getAllFolders(projectId?: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autenticado');

    // Check permission
    await checkPermission('documents', 'read');

    const where: any = {};
    if (projectId) where.projectId = projectId;

    return await prisma.folder.findMany({
        where,
        include: {
            createdBy: {
                select: {
                    id: true,
                    name: true,
                },
            },
            project: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    documents: true,
                    children: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function createFolder(data: {
    name: string;
    description?: string;
    projectId?: string;
    parentId?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autenticado');

    // Check permission
    await checkPermission('documents', 'create');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error('Usuario no encontrado');

    const folder = await prisma.folder.create({
        data: {
            ...data,
            createdById: user.id,
        },
    });

    revalidatePath('/documents');
    return { success: true, folder };
}

export async function deleteFolder(id: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autenticado');

    // Check permission
    await checkPermission('documents', 'delete');

    await prisma.folder.delete({
        where: { id },
    });

    revalidatePath('/documents');
    return { success: true };
}

// ============================================
// DOCUMENT VERSIONS
// ============================================

export async function createDocumentVersion(data: {
    documentId: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    changes?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autenticado');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) throw new Error('Usuario no encontrado');

    // Get current document to increment version
    const document = await prisma.document.findUnique({
        where: { id: data.documentId },
    });

    if (!document) throw new Error('Documento no encontrado');

    const newVersion = document.version + 1;

    // Create new version
    const version = await prisma.documentVersion.create({
        data: {
            documentId: data.documentId,
            version: newVersion,
            fileName: data.fileName,
            filePath: data.filePath,
            fileSize: data.fileSize,
            uploadedById: user.id,
            changes: data.changes,
        },
    });

    // Update document version
    await prisma.document.update({
        where: { id: data.documentId },
        data: {
            version: newVersion,
            fileName: data.fileName,
            filePath: data.filePath,
            fileSize: data.fileSize,
        },
    });

    revalidatePath('/documents');
    return { success: true, version };
}

// ============================================
// DOCUMENT SHARES
// ============================================

export async function shareDocument(data: {
    documentId: string;
    sharedWithId?: string;
    sharedWithEmail?: string;
    accessLevel: 'VIEW' | 'DOWNLOAD' | 'EDIT';
    expiresAt?: Date;
}) {
    const share = await prisma.documentShare.create({
        data,
    });

    revalidatePath('/documents');
    return { success: true, share };
}

export async function revokeShare(id: string) {
    await prisma.documentShare.delete({
        where: { id },
    });

    revalidatePath('/documents');
    return { success: true };
}

// ============================================
// STATS
// ============================================

export async function getDocumentStats(projectId?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;

    const [total, byType, recent] = await Promise.all([
        prisma.document.count({ where }),
        prisma.document.groupBy({
            by: ['fileType'],
            where,
            _count: true,
        }),
        prisma.document.findMany({
            where,
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                uploadedBy: {
                    select: {
                        name: true,
                    },
                },
            },
        }),
    ]);

    return {
        total,
        byType,
        recent,
    };
}
