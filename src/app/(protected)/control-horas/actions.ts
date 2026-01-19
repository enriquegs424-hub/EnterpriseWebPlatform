'use server';

/**
 * Control de Horas - Server Actions
 * 
 * Capa de agregación sobre el módulo Registro Horario existente.
 * Solo lectura de TimeEntry - NO modifica datos.
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/permissions";
import {
    getDiasDelMes,
    getDiasLaborablesMes,
    getDiasLaborablesHastaFecha,
    calcularHorasPrevistas,
    calcularDiferencia,
    calcularPorcentaje,
    getEstadoDia,
    DEPARTMENT_COLORS,
    DEPARTMENT_LABELS,
    MESES,
    type DiaConHoras,
    type ResumenMensual,
    type ResumenUsuarioEquipo,
    type ResumenProyecto,
    type ResumenAnualUsuario,
} from './utils';

// ============================================
// HELPERS
// ============================================

async function getAuthUser() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("No autenticado");
    }
    return session.user as {
        id: string;
        role: string;
        companyId?: string;
        department?: string;
        dailyWorkHours?: number;
    };
}

function canViewOtherUser(viewer: { role: string, id: string, department?: string }, targetUser: { id: string, department?: string | null }): boolean {
    if (targetUser.id === viewer.id) return true;
    if (['ADMIN', 'SUPERADMIN'].includes(viewer.role)) return true;
    if (viewer.role === 'MANAGER') {
        return viewer.department === targetUser.department;
    }
    return false;
}

function canAccessEquipo(role: string): boolean {
    return ['MANAGER', 'ADMIN', 'SUPERADMIN'].includes(role);
}

// Fetch holidays from database for a specific year
async function getHolidaysForYear(year: number, companyId?: string): Promise<Date[]> {
    const holidays = await prisma.holiday.findMany({
        where: {
            year,
            OR: [
                { companyId: null }, // Global holidays
                { companyId: companyId ?? undefined } // Company-specific
            ]
        },
        select: { date: true }
    });
    return holidays.map(h => new Date(h.date));
}

// ============================================
// MI HOJA - Vista personal mensual
// ============================================

export async function getMiHoja(
    año: number,
    mes: number,
    targetUserId?: string
): Promise<ResumenMensual> {
    const user = await getAuthUser();
    const userId = targetUserId || user.id;

    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, dailyWorkHours: true, department: true }
    });

    if (!targetUser) {
        throw new Error("Usuario no encontrado");
    }

    // Obtener datos frescos del usuario actual (para asegurar que el departamento es correcto)
    const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, role: true, department: true }
    });

    if (!currentUser) throw new Error("Usuario actual no encontrado");

    // Verificar permisos (Actualizado con Dept check)
    // Usamos currentUser en lugar de user (session) para garantizar consistencia
    if (!canViewOtherUser(currentUser, targetUser)) {
        console.log(`[PermissionDenied] Viewer: ${currentUser.name} (${currentUser.role}, Dept: ${currentUser.department}) -> Target: ${targetUser.id} (Dept: ${targetUser.department})`);
        throw new Error("No tienes permiso para ver esta hoja");
    }

    const jornadaDiaria = targetUser.dailyWorkHours || 8;

    // Obtener días del mes con info de laborabilidad
    const diasInfo = getDiasDelMes(año, mes, []);
    const diasLaborables = diasInfo.filter(d => d.esLaborable).length;

    // Fecha límite para el mes actual (hasta hoy) o fin de mes
    const hoy = new Date();
    const esActual = hoy.getFullYear() === año && hoy.getMonth() === mes;
    const fechaLimite = esActual ? hoy : new Date(año, mes + 1, 0);

    // Obtener TimeEntries del mes
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0, 23, 59, 59);

    const entries = await prisma.timeEntry.findMany({
        where: {
            userId,
            date: { gte: primerDia, lte: ultimoDia }
        },
        include: {
            project: {
                select: { id: true, code: true, name: true }
            }
        },
        orderBy: { date: 'asc' }
    });

    // Agrupar entries por día
    const entriesPorDia: Record<number, typeof entries> = {};
    entries.forEach(entry => {
        const dia = new Date(entry.date).getDate();
        if (!entriesPorDia[dia]) entriesPorDia[dia] = [];
        entriesPorDia[dia].push(entry);
    });

    // Construir días con horas
    const diasDelMes: DiaConHoras[] = diasInfo.map(diaInfo => {
        const entriesDelDia = entriesPorDia[diaInfo.dia] || [];

        // Agrupar por proyecto
        const horasPorProyecto: Record<string, { projectId: string; projectCode: string; projectName: string; hours: number }> = {};
        const notas: string[] = [];

        entriesDelDia.forEach(entry => {
            const pId = entry.projectId;
            if (!horasPorProyecto[pId]) {
                horasPorProyecto[pId] = {
                    projectId: pId,
                    projectCode: entry.project.code,
                    projectName: entry.project.name,
                    hours: 0
                };
            }
            horasPorProyecto[pId].hours += entry.hours;
            if (entry.notes) notas.push(entry.notes);
        });

        const totalHoras = entriesDelDia.reduce((sum, e) => sum + e.hours, 0);
        const estado = getEstadoDia(totalHoras, diaInfo.esLaborable, jornadaDiaria);

        return {
            ...diaInfo,
            horasPorProyecto: Object.values(horasPorProyecto),
            totalHoras,
            notas,
            estado
        };
    });

    // Calcular totales por proyecto
    const totalesPorProyecto: Record<string, { projectId: string; projectCode: string; projectName: string; hours: number }> = {};
    entries.forEach(entry => {
        const pId = entry.projectId;
        if (!totalesPorProyecto[pId]) {
            totalesPorProyecto[pId] = {
                projectId: pId,
                projectCode: entry.project.code,
                projectName: entry.project.name,
                hours: 0
            };
        }
        totalesPorProyecto[pId].hours += entry.hours;
    });

    // Calcular métricas
    const horasReales = entries.reduce((sum, e) => sum + e.hours, 0);

    // Días laborables hasta fecha límite
    const diasLaborablesHastaLimite = esActual
        ? getDiasLaborablesHastaFecha(año, mes, hoy, [])
        : diasLaborables;

    const horasPrevistas = calcularHorasPrevistas(diasLaborablesHastaLimite, jornadaDiaria);
    const diferencia = calcularDiferencia(horasReales, horasPrevistas);

    // Contar días con entradas (únicos)
    const diasConEntradas = new Set(entries.map(e => new Date(e.date).getDate())).size;

    // Días sin imputar y días incompletos
    const diasSinImputar = diasDelMes.filter(d =>
        d.esLaborable && d.estado === 'vacio' && d.fecha <= fechaLimite
    ).length;

    const diasIncompletos = diasDelMes.filter(d =>
        d.esLaborable && d.estado === 'incompleto' && d.fecha <= fechaLimite
    ).length;

    const porcentajeCumplimiento = calcularPorcentaje(horasReales, horasPrevistas);

    return {
        año,
        mes,
        mesLabel: MESES[mes],
        diasDelMes,
        horasReales: Math.round(horasReales * 10) / 10,
        horasPrevistas: Math.round(horasPrevistas * 10) / 10,
        diferencia: Math.round(diferencia * 10) / 10,
        diasLaborables,
        diasConEntradas,
        diasSinImputar,
        diasIncompletos,
        porcentajeCumplimiento,
        totalesPorProyecto: Object.values(totalesPorProyecto).sort((a, b) => b.hours - a.hours)
    };
}

// ============================================
// EQUIPO - Vista global de trabajadores
// ============================================

export async function getEquipoResumen(
    año: number,
    mes: number,
    departamentoFiltro?: string
): Promise<ResumenUsuarioEquipo[]> {
    const user = await getAuthUser();

    if (!canAccessEquipo(user.role)) {
        throw new Error("No tienes permiso para ver el resumen de equipo");
    }

    // Obtener usuarios según rol y filtros
    const whereClause: any = {
        isActive: true,
    };

    // Filtro por company
    if (user.companyId) {
        whereClause.companyId = user.companyId;
    }

    // MANAGER solo ve su departamento (a menos que sea ADMIN+)
    if (user.role === 'MANAGER' && user.department) {
        whereClause.department = user.department;
    } else if (departamentoFiltro) {
        whereClause.department = departamentoFiltro;
    }

    // Excluir GUEST
    whereClause.role = { not: 'GUEST' };

    const usuarios = await prisma.user.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            department: true,
            dailyWorkHours: true,
        },
        orderBy: { name: 'asc' }
    });

    // Fechas del mes
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0, 23, 59, 59);
    const hoy = new Date();
    const esActual = hoy.getFullYear() === año && hoy.getMonth() === mes;
    const fechaLimite = esActual ? hoy : ultimoDia;

    // Calcular días laborables
    const diasLaborables = getDiasLaborablesMes(año, mes, []);
    const diasLaborablesHastaLimite = esActual
        ? getDiasLaborablesHastaFecha(año, mes, hoy, [])
        : diasLaborables;

    // Obtener todas las entries del mes para todos los usuarios
    const userIds = usuarios.map(u => u.id);
    const todasEntries = await prisma.timeEntry.findMany({
        where: {
            userId: { in: userIds },
            date: { gte: primerDia, lte: ultimoDia }
        },
        select: {
            userId: true,
            date: true,
            hours: true
        }
    });

    // Agrupar por usuario
    const entriesPorUsuario: Record<string, { totalHoras: number; diasUnicos: Set<number>; ultimoDia: Date | null }> = {};

    todasEntries.forEach(entry => {
        if (!entriesPorUsuario[entry.userId]) {
            entriesPorUsuario[entry.userId] = {
                totalHoras: 0,
                diasUnicos: new Set(),
                ultimoDia: null
            };
        }
        entriesPorUsuario[entry.userId].totalHoras += entry.hours;
        entriesPorUsuario[entry.userId].diasUnicos.add(new Date(entry.date).getDate());

        const entryDate = new Date(entry.date);
        if (!entriesPorUsuario[entry.userId].ultimoDia || entryDate > entriesPorUsuario[entry.userId].ultimoDia!) {
            entriesPorUsuario[entry.userId].ultimoDia = entryDate;
        }
    });

    // Construir resumen por usuario
    const resumen: ResumenUsuarioEquipo[] = usuarios.map(usuario => {
        const datos = entriesPorUsuario[usuario.id] || {
            totalHoras: 0,
            diasUnicos: new Set(),
            ultimoDia: null
        };

        const jornadaDiaria = usuario.dailyWorkHours || 8;
        const horasPrevistas = calcularHorasPrevistas(diasLaborablesHastaLimite, jornadaDiaria);
        const horasReales = datos.totalHoras;
        const diferencia = calcularDiferencia(horasReales, horasPrevistas);
        const porcentajeCumplimiento = calcularPorcentaje(horasReales, horasPrevistas);

        // Días sin imputar = laborables hasta hoy - días con entradas
        const diasSinImputar = Math.max(0, diasLaborablesHastaLimite - datos.diasUnicos.size);

        const dept = usuario.department || 'OTHER';

        return {
            userId: usuario.id,
            userName: usuario.name,
            userEmail: usuario.email,
            userImage: usuario.image,
            department: dept,
            departmentLabel: DEPARTMENT_LABELS[dept] || dept,
            departmentColor: DEPARTMENT_COLORS[dept] || DEPARTMENT_COLORS.OTHER,
            jornadaDiaria,
            ultimoDiaImputado: datos.ultimoDia,
            diasSinImputar,
            horasPrevistas: Math.round(horasPrevistas * 10) / 10,
            horasReales: Math.round(horasReales * 10) / 10,
            diferencia: Math.round(diferencia * 10) / 10,
            porcentajeCumplimiento
        };
    });

    // Ordenar por días sin imputar (más problemáticos primero)
    return resumen.sort((a, b) => b.diasSinImputar - a.diasSinImputar);
}

// ============================================
// PROYECTOS - Resumen por proyecto
// ============================================

export async function getProyectosResumen(
    año: number,
    proyectosFiltro?: string[]
): Promise<{ proyectos: ResumenProyecto[]; totalHoras: number }> {
    const user = await getAuthUser();

    if (!canAccessEquipo(user.role)) {
        throw new Error("No tienes permiso para ver el resumen de proyectos");
    }

    // Fechas del año completo
    const primerDia = new Date(año, 0, 1);
    const ultimoDia = new Date(año, 11, 31, 23, 59, 59);

    // Construir where
    const whereClause: any = {
        date: { gte: primerDia, lte: ultimoDia }
    };

    if (user.companyId) {
        whereClause.user = { companyId: user.companyId };
    }

    if (proyectosFiltro && proyectosFiltro.length > 0) {
        whereClause.projectId = { in: proyectosFiltro };
    }

    // Obtener entries
    const entries = await prisma.timeEntry.findMany({
        where: whereClause,
        select: {
            projectId: true,
            userId: true,
            date: true,
            hours: true,
            project: {
                select: { id: true, code: true, name: true }
            },
            user: {
                select: { id: true, name: true }
            }
        }
    });

    // Agrupar por proyecto
    const proyectosMap: Record<string, {
        project: { id: string; code: string; name: string };
        horasPorMes: Record<number, number>;
        totalHoras: number;
        horasPorUsuario: Record<string, { userId: string; userName: string; hours: number }>;
    }> = {};

    let totalHorasGlobal = 0;

    entries.forEach(entry => {
        const pId = entry.projectId;
        const mes = new Date(entry.date).getMonth();

        if (!proyectosMap[pId]) {
            proyectosMap[pId] = {
                project: entry.project,
                horasPorMes: {},
                totalHoras: 0,
                horasPorUsuario: {}
            };
        }

        proyectosMap[pId].horasPorMes[mes] = (proyectosMap[pId].horasPorMes[mes] || 0) + entry.hours;
        proyectosMap[pId].totalHoras += entry.hours;
        totalHorasGlobal += entry.hours;

        // Desglose por usuario
        if (!proyectosMap[pId].horasPorUsuario[entry.userId]) {
            proyectosMap[pId].horasPorUsuario[entry.userId] = {
                userId: entry.userId,
                userName: entry.user.name,
                hours: 0
            };
        }
        proyectosMap[pId].horasPorUsuario[entry.userId].hours += entry.hours;
    });

    // Construir resultado
    const proyectos: ResumenProyecto[] = Object.values(proyectosMap)
        .map(p => ({
            projectId: p.project.id,
            projectCode: p.project.code,
            projectName: p.project.name,
            horasPorMes: p.horasPorMes,
            totalHoras: Math.round(p.totalHoras * 10) / 10,
            porcentaje: totalHorasGlobal > 0 ? Math.round((p.totalHoras / totalHorasGlobal) * 100) : 0,
            desglosePorUsuario: Object.values(p.horasPorUsuario)
                .map(u => ({ ...u, hours: Math.round(u.hours * 10) / 10 }))
                .sort((a, b) => b.hours - a.hours)
        }))
        .sort((a, b) => b.totalHoras - a.totalHoras);

    return {
        proyectos,
        totalHoras: Math.round(totalHorasGlobal * 10) / 10
    };
}

// ============================================
// ANUAL - Vista anual por persona
// ============================================

export async function getAnualResumen(
    año: number,
    departamentoFiltro?: string
): Promise<{ usuarios: ResumenAnualUsuario[]; totalesPorMes: number[]; totalGlobal: number }> {
    const user = await getAuthUser();

    if (!canAccessEquipo(user.role)) {
        throw new Error("No tienes permiso para ver el resumen anual");
    }

    // Obtener usuarios
    const whereUsuarios: any = {
        isActive: true,
        role: { not: 'GUEST' }
    };

    if (user.companyId) {
        whereUsuarios.companyId = user.companyId;
    }

    if (user.role === 'MANAGER' && user.department) {
        whereUsuarios.department = user.department;
    } else if (departamentoFiltro) {
        whereUsuarios.department = departamentoFiltro;
    }

    const usuarios = await prisma.user.findMany({
        where: whereUsuarios,
        select: {
            id: true,
            name: true,
            department: true,
            dailyWorkHours: true
        },
        orderBy: { name: 'asc' }
    });

    // Fechas del año
    const primerDia = new Date(año, 0, 1);
    const ultimoDia = new Date(año, 11, 31, 23, 59, 59);

    // Obtener entries del año
    const userIds = usuarios.map(u => u.id);
    const entries = await prisma.timeEntry.findMany({
        where: {
            userId: { in: userIds },
            date: { gte: primerDia, lte: ultimoDia }
        },
        select: {
            userId: true,
            date: true,
            hours: true
        }
    });

    // Agrupar por usuario y mes
    const horasPorUsuarioMes: Record<string, Record<number, number>> = {};
    entries.forEach(entry => {
        const mes = new Date(entry.date).getMonth();
        if (!horasPorUsuarioMes[entry.userId]) {
            horasPorUsuarioMes[entry.userId] = {};
        }
        horasPorUsuarioMes[entry.userId][mes] = (horasPorUsuarioMes[entry.userId][mes] || 0) + entry.hours;
    });

    // Calcular días laborables por mes para horas previstas anuales
    const diasLaborablesPorMes: number[] = [];
    for (let m = 0; m < 12; m++) {
        diasLaborablesPorMes.push(getDiasLaborablesMes(año, m, []));
    }

    // Construir resultado
    const totalesPorMes: number[] = Array(12).fill(0);
    let totalGlobal = 0;

    const resumenUsuarios: ResumenAnualUsuario[] = usuarios.map(usuario => {
        const horasPorMes: number[] = Array(12).fill(0);
        let totalUsuario = 0;

        const datosUsuario = horasPorUsuarioMes[usuario.id] || {};
        for (let m = 0; m < 12; m++) {
            const horas = datosUsuario[m] || 0;
            horasPorMes[m] = Math.round(horas * 10) / 10;
            totalUsuario += horas;
            totalesPorMes[m] += horas;
        }
        totalGlobal += totalUsuario;

        const jornadaDiaria = usuario.dailyWorkHours || 8;
        const horasPrevistsAnual = diasLaborablesPorMes.reduce((sum, dias) => sum + dias * jornadaDiaria, 0);
        const diferencia = totalUsuario - horasPrevistsAnual;

        const dept = usuario.department || 'OTHER';

        return {
            userId: usuario.id,
            userName: usuario.name,
            department: dept,
            departmentColor: DEPARTMENT_COLORS[dept] || DEPARTMENT_COLORS.OTHER,
            horasPorMes,
            totalHoras: Math.round(totalUsuario * 10) / 10,
            horasPrevistas: Math.round(horasPrevistsAnual * 10) / 10,
            diferencia: Math.round(diferencia * 10) / 10
        };
    });

    return {
        usuarios: resumenUsuarios,
        totalesPorMes: totalesPorMes.map(h => Math.round(h * 10) / 10),
        totalGlobal: Math.round(totalGlobal * 10) / 10
    };
}

// ============================================
// UTILIDADES AUXILIARES
// ============================================

export async function getProyectosActivos() {
    const user = await getAuthUser();

    const whereClause: any = { isActive: true };
    if (user.companyId) {
        whereClause.companyId = user.companyId;
    }

    return prisma.project.findMany({
        where: whereClause,
        select: {
            id: true,
            code: true,
            name: true
        },
        orderBy: { code: 'asc' }
    });
}

export async function getDepartamentosConUsuarios() {
    const user = await getAuthUser();

    if (!canAccessEquipo(user.role)) {
        return [];
    }

    const whereClause: any = { isActive: true };
    if (user.companyId) {
        whereClause.companyId = user.companyId;
    }

    const usuarios = await prisma.user.findMany({
        where: whereClause,
        select: { department: true },
        distinct: ['department']
    });

    return usuarios
        .map(u => u.department)
        .filter((d): d is NonNullable<typeof d> => d !== null)
        .map(d => ({
            id: d,
            label: DEPARTMENT_LABELS[d] || d,
            color: DEPARTMENT_COLORS[d] || DEPARTMENT_COLORS.OTHER
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
}

// ============================================
// USERS - Selector de usuarios
// ============================================
export async function getAccessibleUsers() {
    const user = await getAuthUser();

    // WORKER solo se ve a si mismo (o vacio si no debe usar selector)
    if (!['MANAGER', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
        return [];
    }

    const whereClause: any = {
        isActive: true,
        // No mostramos GUESTs
        role: { not: 'GUEST' }
    };

    if (user.companyId) {
        whereClause.companyId = user.companyId;
    }

    // MANAGER solo ve su departamento
    if (user.role === 'MANAGER' && user.department) {
        whereClause.department = user.department;
    }

    const users = await prisma.user.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            department: true,
            role: true
        },
        orderBy: { name: 'asc' }
    });

    return users;
}

export async function exportarMiHoja(año: number, mes: number, userId?: string) {
    const user = await getAuthUser();
    const targetUserId = userId || user.id;

    // Log export
    await logActivity(user.id, "EXPORT", "control-horas", targetUserId, `Exportar hoja ${MESES[mes]} ${año}`);

    const data = await getMiHoja(año, mes, userId);
    return data;
}

