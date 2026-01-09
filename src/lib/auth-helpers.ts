import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Helper para obtener información completa del usuario autenticado
 * Incluye companyId que no está en el tipo de sesión por defecto
 */
export async function getAuthenticatedUser() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("No autenticado");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id as string },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            companyId: true,
        },
    });

    if (!user) {
        throw new Error("Usuario no encontrado");
    }

    return user;
}

/**
 * Helper para obtener solo el companyId del usuario
 */
export async function getUserCompanyId(): Promise<string> {
    const user = await getAuthenticatedUser();
    if (!user.companyId) {
        throw new Error("Usuario sin empresa asignada");
    }
    return user.companyId;
}
