// Utility functions for local file storage (development only)

import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
export async function ensureUploadDir() {
    try {
        await fs.access(UPLOAD_DIR);
    } catch {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
}

// Save file to local storage
export async function saveFile(file: File, fileName: string): Promise<string> {
    await ensureUploadDir();

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(UPLOAD_DIR, fileName);

    await fs.writeFile(filePath, buffer);

    return `/uploads/${fileName}`;
}

// Delete file from local storage
export async function deleteFile(filePath: string): Promise<void> {
    try {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        await fs.unlink(fullPath);
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}

// Generate unique filename
export function generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();

    return `${name}-${timestamp}-${random}${ext}`;
}

// Get file size
export async function getFileSize(filePath: string): Promise<number> {
    try {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        const stats = await fs.stat(fullPath);
        return stats.size;
    } catch {
        return 0;
    }
}

// Check if file exists
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        await fs.access(fullPath);
        return true;
    } catch {
        return false;
    }
}
