import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const passwordHash = await bcrypt.hash('admin123', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@mep-projects.com' },
        update: {
            passwordHash,
            name: 'Enrique Admin',
            role: 'ADMIN',
            isActive: true,
        },
        create: {
            email: 'admin@mep-projects.com',
            name: 'Enrique Admin',
            passwordHash,
            role: 'ADMIN',
            department: 'ADMINISTRATION',
            isActive: true,
        },
    })
    console.log('✅ Admin creado:', admin.email)

    const projects = [
        { code: 'P-25-001', name: 'Rehabilitación Edificio A', year: 2025, department: 'ENGINEERING' },
        { code: 'P-25-002', name: 'Diseño Residencial MEP', year: 2025, department: 'ARCHITECTURE' },
        { code: 'P-24-088', name: 'Mantenimiento Industrial', year: 2024, department: 'ENGINEERING' },
    ]

    for (const p of projects) {
        await prisma.project.upsert({
            where: { code: p.code },
            update: {
                name: p.name,
                isActive: true,
            },
            create: {
                ...p,
                isActive: true,
            } as any,
        })
    }
    console.log('✅ Proyectos de ejemplo creados')
    console.log('\n🎉 Base de datos inicializada correctamente')
    console.log('📧 Email: admin@mep-projects.com')
    console.log('🔑 Password: admin123\n')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
