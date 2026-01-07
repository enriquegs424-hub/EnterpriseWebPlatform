const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const passwordHash = await bcrypt.hash('admin123', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@mep-projects.com' },
        update: {},
        create: {
            email: 'admin@mep-projects.com',
            name: 'Enrique Admin',
            passwordHash,
            role: 'ADMIN',
            department: 'ADMINISTRATION',
        },
    })
    console.log('Admin user seeded:', admin)

    // Projects
    const p1 = await prisma.project.upsert({
        where: { code: 'P-25-001' },
        update: {},
        create: {
            code: 'P-25-001',
            name: 'Proyecto Alpha',
            year: 2025,
            department: 'ENGINEERING',
            isActive: true,
        }
    });
    console.log('Project 1 seeded:', p1)

    const p2 = await prisma.project.upsert({
        where: { code: 'P-25-002' },
        update: {},
        create: {
            code: 'P-25-002',
            name: 'Proyecto Beta (Arquitectura)',
            year: 2025,
            department: 'ARCHITECTURE',
            isActive: true,
        }
    });
    console.log('Project 2 seeded:', p2)
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
