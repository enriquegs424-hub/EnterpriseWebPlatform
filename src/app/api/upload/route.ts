
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uniqueSuffix = `${randomUUID()}-${file.name.replace(/\s/g, '_')}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        const filePath = join(uploadDir, uniqueSuffix);

        try {
            await mkdir(uploadDir, { recursive: true });
            await writeFile(filePath, buffer);
        } catch (error) {
            console.error('Error saving file:', error);
            // Ensure directory exists - simplified for now assuming public/uploads exists
            return NextResponse.json(
                { error: 'Error saving file to disk' },
                { status: 500 }
            );
        }

        const url = `/uploads/${uniqueSuffix}`;

        return NextResponse.json({
            url,
            name: file.name,
            type: file.type,
            size: file.size
        });
    } catch (error) {
        console.error('Upload handler error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
