
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDepartments() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true
        }
    });

    console.log('--- User Departments ---');
    users.forEach(u => {
        console.log(`[${u.role}] ${u.name} (${u.email}) - Dept: '${u.department}' (Type: ${typeof u.department})`);
    });
}

checkDepartments()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
