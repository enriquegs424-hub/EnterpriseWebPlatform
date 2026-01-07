import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { saveFile, generateFileName } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const projectId = formData.get('projectId') as string | null;
        const folderId = formData.get('folderId') as string | null;
        const description = formData.get('description') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
        }

        // Generate unique filename
        const fileName = generateFileName(file.name);

        // Save file to local storage
        const filePath = await saveFile(file, fileName);

        // Create document in database
        const document = await prisma.document.create({
            data: {
                name: file.name,
                description: description || null,
                fileName: fileName,
                fileSize: file.size,
                fileType: file.type,
                filePath: filePath,
                projectId: projectId || null,
                folderId: folderId || null,
                uploadedById: user.id,
                version: 1,
            },
            include: {
                project: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
                folder: {
                    select: {
                        name: true,
                    },
                },
                uploadedBy: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({ document });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
