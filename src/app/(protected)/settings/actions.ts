'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from 'bcryptjs';

export async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.id) return null;

    return await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            dailyWorkHours: true,
            isActive: true,
            preferences: true,
            image: true,
        }
    });
}

export async function updateUserProfile(data: {
    name: string;
    department: string;
    dailyWorkHours: number;
    image?: string;
    phone?: string;
    jobTitle?: string;
    bio?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: data.name,
                department: data.department as any,
                dailyWorkHours: parseFloat(data.dailyWorkHours.toString()),
                image: data.image,
                // Store phone, jobTitle, bio in preferences JSON
                preferences: {
                    ...(await prisma.user.findUnique({ where: { id: session.user.id }, select: { preferences: true } }))?.preferences as any || {},
                    phone: data.phone,
                    jobTitle: data.jobTitle,
                    bio: data.bio
                }
            }
        });
        // Revalidate all paths where user info is displayed
        revalidatePath('/settings');
        revalidatePath('/');
        revalidatePath('/dashboard');
        revalidatePath('/chat');
        return { success: true, message: 'Perfil actualizado correctamente' };
    } catch (error) {
        return { error: 'Error al actualizar el perfil' };
    }
}

// Get available departments from enum
export async function getDepartments() {
    return [
        { value: 'CIVIL_DESIGN', label: 'Diseño y Civil' },
        { value: 'ELECTRICAL', label: 'Eléctrico' },
        { value: 'INSTRUMENTATION', label: 'Instrumentación y Control' },
        { value: 'ADMINISTRATION', label: 'Administración' },
        { value: 'IT', label: 'Informática' },
        { value: 'ECONOMIC', label: 'Económico' },
        { value: 'MARKETING', label: 'Marketing' },
        { value: 'OTHER', label: 'Otros' }
    ];
}

// Get available timezones
export async function getTimezones() {
    return [
        { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
        { value: 'Europe/London', label: 'Londres (GMT/BST)' },
        { value: 'Europe/Paris', label: 'París (CET/CEST)' },
        { value: 'Europe/Berlin', label: 'Berlín (CET/CEST)' },
        { value: 'America/New_York', label: 'Nueva York (EST/EDT)' },
        { value: 'America/Los_Angeles', label: 'Los Ángeles (PST/PDT)' },
        { value: 'America/Mexico_City', label: 'Ciudad de México (CST/CDT)' },
        { value: 'America/Bogota', label: 'Bogotá (COT)' },
        { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)' },
        { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
        { value: 'Asia/Tokyo', label: 'Tokio (JST)' },
        { value: 'Asia/Shanghai', label: 'Shanghái (CST)' },
        { value: 'UTC', label: 'UTC' }
    ];
}

export async function updateUserPreferences(preferences: any) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        // First get current preferences to merge
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { preferences: true }
        });

        const currentPrefs = (user?.preferences as any) || {};
        const newPrefs = { ...currentPrefs, ...preferences };

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                preferences: newPrefs
            }
        });
        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        return { error: 'Error al guardar preferencias' };
    }
}

export async function changePassword(data: {
    currentPassword: string;
    newPassword: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) return { error: 'Usuario no encontrado' };

        // Verify current password
        const passwordsMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
        if (!passwordsMatch) {
            return { error: 'La contraseña actual es incorrecta' };
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

        await prisma.user.update({
            where: { id: session.user.id },
            data: { passwordHash: newPasswordHash }
        });

        return { success: true, message: 'Contraseña actualizada correctamente' };
    } catch (error) {
        return { error: 'Error al cambiar la contraseña' };
    }
}
