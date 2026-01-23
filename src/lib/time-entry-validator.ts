/**
 * Time Entry Validation Helper
 *
 * Validaciones de negocio para el sistema de registro horario:
 * - No overlaps (sin solapamientos de tiempo)
 * - Límites diarios (horas máximas por día)
 * - Validación de fechas
 * - Reglas de aprobación
 */

import { prisma } from "@/lib/prisma";

/**
 * Validates that a time entry does not overlap with existing entries
 */
export async function validateNoOverlap(params: {
    userId: string;
    date: Date;
    startTime: string;
    endTime: string;
    excludeEntryId?: string; // Para ediciones
}): Promise<{ valid: boolean; error?: string; conflictingEntry?: any }> {
    const { userId, date, startTime, endTime, excludeEntryId } = params;

    // Normalizar fecha al inicio del día
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Obtener todas las entradas del usuario para ese día
    const existingEntries = await prisma.timeEntry.findMany({
        where: {
            userId,
            date: {
                gte: dayStart,
                lte: dayEnd,
            },
            ...(excludeEntryId ? { NOT: { id: excludeEntryId } } : {}),
        },
        include: {
            project: {
                select: { code: true, name: true }
            }
        }
    });

    // Si no hay entradas existentes, no hay solapamiento
    if (existingEntries.length === 0) {
        return { valid: true };
    }

    // Convertir strings de tiempo a minutos desde medianoche
    const toMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    // Verificar solapamiento con cada entrada existente
    for (const entry of existingEntries) {
        // Si la entrada no tiene startTime/endTime (sistema antiguo), calcular desde hours
        const entryStart = entry.startTime ? toMinutes(entry.startTime) : 540; // 9:00 default
        const entryEnd = entry.endTime ? toMinutes(entry.endTime) : entryStart + (Number(entry.hours) * 60);

        // Detectar solapamiento: (newStart < entryEnd) && (newEnd > entryStart)
        if (newStart < entryEnd && newEnd > entryStart) {
            return {
                valid: false,
                error: `Solapamiento detectado con entrada de ${entry.project.code} (${entry.startTime || 'N/A'} - ${entry.endTime || 'N/A'})`,
                conflictingEntry: entry
            };
        }
    }

    return { valid: true };
}

/**
 * Validates that daily hours limit is not exceeded
 */
export async function validateDailyLimit(params: {
    userId: string;
    date: Date;
    hours: number;
    excludeEntryId?: string;
}): Promise<{ valid: boolean; error?: string; currentTotal?: number; limit?: number }> {
    const { userId, date, hours, excludeEntryId } = params;

    // Obtener límite diario del usuario
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { dailyWorkHours: true }
    });

    const dailyLimit = user?.dailyWorkHours || 8.0;
    const maxLimit = 24; // Un día no tiene más de 24 horas

    // Normalizar fecha
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Calcular total de horas ya registradas ese día
    const existingEntries = await prisma.timeEntry.findMany({
        where: {
            userId,
            date: {
                gte: dayStart,
                lte: dayEnd,
            },
            ...(excludeEntryId ? { NOT: { id: excludeEntryId } } : {}),
        },
        select: { hours: true }
    });

    const currentTotal = existingEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
    const newTotal = currentTotal + hours;

    // El límite absoluto es 24 horas (un día completo)
    if (newTotal > maxLimit) {
        return {
            valid: false,
            error: `Límite diario excedido: ${newTotal.toFixed(2)}h supera el máximo de 24h por día`,
            currentTotal,
            limit: maxLimit
        };
    }

    // Advertencia informativa si supera la jornada normal (pero sigue siendo válido)
    if (newTotal > dailyLimit) {
        return {
            valid: true,
            error: `Nota: Total de ${newTotal.toFixed(2)}h supera la jornada estándar de ${dailyLimit}h`,
            currentTotal,
            limit: maxLimit
        };
    }

    return { valid: true, currentTotal, limit: maxLimit };
}

/**
 * Validates date is within acceptable range
 */
export function validateDateRange(date: Date): { valid: boolean; error?: string } {
    const now = new Date();
    const targetDate = new Date(date);

    // No permitir fechas futuras
    if (targetDate > now) {
        return {
            valid: false,
            error: "No se pueden registrar horas en fechas futuras"
        };
    }

    // No permitir fechas más antiguas de 90 días (configurable)
    const maxPastDays = 90;
    const oldestAllowed = new Date();
    oldestAllowed.setDate(oldestAllowed.getDate() - maxPastDays);

    if (targetDate < oldestAllowed) {
        return {
            valid: false,
            error: `No se pueden registrar horas de más de ${maxPastDays} días atrás`
        };
    }

    return { valid: true };
}

/**
 * Validates time entry can be edited based on status and user role
 */
export async function validateCanEdit(params: {
    entryId: string;
    userId: string;
    userRole: string;
}): Promise<{ valid: boolean; error?: string }> {
    const { entryId, userId, userRole } = params;

    const entry = await prisma.timeEntry.findUnique({
        where: { id: entryId },
    });

    if (!entry) {
        return { valid: false, error: "Entrada no encontrada" };
    }

    // ADMIN puede editar cualquier entrada
    if (userRole === 'ADMIN') {
        return { valid: true };
    }

    // No es el propietario
    if (entry.userId !== userId) {
        return { valid: false, error: "No puedes editar entradas de otros usuarios" };
    }

    // Verificar si ya fue aprobada
    if (entry.status === 'APPROVED') {
        return { valid: false, error: "No se pueden editar entradas ya aprobadas" };
    }

    // Verificar límite de 24h para edición
    const createdAt = new Date(entry.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24 && userRole !== 'MANAGER') {
        return {
            valid: false,
            error: "Solo se pueden editar entradas dentro de las primeras 24 horas"
        };
    }

    return { valid: true };
}

/**
 * Validates time entry can be deleted
 */
export async function validateCanDelete(params: {
    entryId: string;
    userId: string;
    userRole: string;
}): Promise<{ valid: boolean; error?: string }> {
    const { entryId, userId, userRole } = params;

    const entry = await prisma.timeEntry.findUnique({
        where: { id: entryId },
    });

    if (!entry) {
        return { valid: false, error: "Entrada no encontrada" };
    }

    // ADMIN puede eliminar cualquier entrada
    if (userRole === 'ADMIN') {
        return { valid: true };
    }

    // No es el propietario
    if (entry.userId !== userId) {
        return { valid: false, error: "No puedes eliminar entradas de otros usuarios" };
    }

    // No se pueden eliminar entradas aprobadas
    if (entry.status === 'APPROVED') {
        return { valid: false, error: "No se pueden eliminar entradas aprobadas" };
    }

    // Verificar límite de 24h para eliminación
    const createdAt = new Date(entry.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24 && userRole !== 'MANAGER') {
        return {
            valid: false,
            error: "Solo se pueden eliminar entradas dentro de las primeras 24 horas"
        };
    }

    return { valid: true };
}

/**
 * Validates time entry can be submitted for approval
 */
export async function validateCanSubmit(params: {
    entryId: string;
    userId: string;
}): Promise<{ valid: boolean; error?: string }> {
    const entry = await prisma.timeEntry.findUnique({
        where: { id: params.entryId },
    });

    if (!entry) {
        return { valid: false, error: "Entrada no encontrada" };
    }

    if (entry.userId !== params.userId) {
        return { valid: false, error: "No puedes enviar entradas de otros usuarios" };
    }

    if (entry.status === 'SUBMITTED') {
        return { valid: false, error: "La entrada ya fue enviada para aprobación" };
    }

    if (entry.status === 'APPROVED') {
        return { valid: false, error: "La entrada ya está aprobada" };
    }

    return { valid: true };
}

/**
 * Validates user can approve/reject time entries
 */
export async function validateCanApprove(params: {
    entryId: string;
    approverRole: string;
    approverId: string;
}): Promise<{ valid: boolean; error?: string; entry?: any }> {
    const { entryId, approverRole, approverId } = params;

    // Solo MANAGER y ADMIN pueden aprobar
    if (!['MANAGER', 'ADMIN'].includes(approverRole)) {
        return { valid: false, error: "Solo managers y admins pueden aprobar horas" };
    }

    const entry = await prisma.timeEntry.findUnique({
        where: { id: entryId },
        include: {
            user: true,
            project: true
        }
    });

    if (!entry) {
        return { valid: false, error: "Entrada no encontrada" };
    }

    if (entry.status !== 'SUBMITTED') {
        return { valid: false, error: "Solo se pueden aprobar entradas en estado SUBMITTED" };
    }

    // No puedes aprobar tus propias horas
    if (entry.userId === approverId) {
        return { valid: false, error: "No puedes aprobar tus propias horas" };
    }

    return { valid: true, entry };
}

/**
 * Calculate hours from start and end time
 */
export function calculateHoursFromTime(startTime: string, endTime: string): number {
    const toMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);

    // Manejar caso de pasada de medianoche
    let totalMinutes = endMinutes - startMinutes;
    if (totalMinutes < 0) {
        totalMinutes += 24 * 60; // Agregar 24 horas
    }

    return totalMinutes / 60; // Convertir a horas decimales
}

/**
 * Comprehensive validation for creating a new time entry
 */
export async function validateCreateTimeEntry(params: {
    userId: string;
    projectId: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    hours: number;
}): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar fecha
    const dateValidation = validateDateRange(params.date);
    if (!dateValidation.valid) {
        errors.push(dateValidation.error!);
    }

    // Validar proyecto existe y está activo
    const project = await prisma.project.findUnique({
        where: { id: params.projectId },
    });

    if (!project) {
        errors.push("El proyecto no existe");
    } else if (!project.isActive) {
        errors.push("El proyecto no está activo");
    }

    // Validar límite diario
    const limitValidation = await validateDailyLimit({
        userId: params.userId,
        date: params.date,
        hours: params.hours,
    });

    if (!limitValidation.valid) {
        errors.push(limitValidation.error!);
    } else if (limitValidation.error) {
        warnings.push(limitValidation.error);
    }

    // Validar solapamiento si hay startTime y endTime
    if (params.startTime && params.endTime) {
        const overlapValidation = await validateNoOverlap({
            userId: params.userId,
            date: params.date,
            startTime: params.startTime,
            endTime: params.endTime,
        });

        if (!overlapValidation.valid) {
            errors.push(overlapValidation.error!);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Comprehensive validation for updating a time entry
 */
export async function validateUpdateTimeEntry(params: {
    entryId: string;
    userId: string;
    userRole: string;
    projectId: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    hours: number;
}): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar permisos de edición
    const editValidation = await validateCanEdit({
        entryId: params.entryId,
        userId: params.userId,
        userRole: params.userRole,
    });

    if (!editValidation.valid) {
        errors.push(editValidation.error!);
        return { valid: false, errors, warnings }; // Stop here if can't edit
    }

    // Validar fecha
    const dateValidation = validateDateRange(params.date);
    if (!dateValidation.valid) {
        errors.push(dateValidation.error!);
    }

    // Validar proyecto
    const project = await prisma.project.findUnique({
        where: { id: params.projectId },
    });

    if (!project) {
        errors.push("El proyecto no existe");
    } else if (!project.isActive) {
        errors.push("El proyecto no está activo");
    }

    // Validar límite diario
    const limitValidation = await validateDailyLimit({
        userId: params.userId,
        date: params.date,
        hours: params.hours,
        excludeEntryId: params.entryId,
    });

    if (!limitValidation.valid) {
        errors.push(limitValidation.error!);
    } else if (limitValidation.error) {
        warnings.push(limitValidation.error);
    }

    // Validar solapamiento
    if (params.startTime && params.endTime) {
        const overlapValidation = await validateNoOverlap({
            userId: params.userId,
            date: params.date,
            startTime: params.startTime,
            endTime: params.endTime,
            excludeEntryId: params.entryId,
        });

        if (!overlapValidation.valid) {
            errors.push(overlapValidation.error!);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
