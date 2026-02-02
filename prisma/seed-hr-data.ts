import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed HR-specific data for existing users
 * Run with: npx ts-node prisma/seed-hr-data.ts
 */
async function main() {
    console.log('🏢 Seeding HR data for employees...\n');

    // Get all users
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'asc' }
    });

    if (users.length === 0) {
        console.log('❌ No users found. Run seed-users.ts first.');
        return;
    }

    // Contract types distribution
    const contractTypes = ['INDEFINIDO', 'INDEFINIDO', 'INDEFINIDO', 'TEMPORAL', 'TEMPORAL', 'OBRA_SERVICIO', 'PRACTICAS'];

    // Generate employee codes and HR data
    let updatedCount = 0;
    let inactiveCount = 0;

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const empNumber = String(i + 1).padStart(3, '0');
        const employeeCode = `EMP-${empNumber}`;

        // Random hire date between 2020-2024
        const hireYear = 2020 + Math.floor(Math.random() * 5);
        const hireMonth = Math.floor(Math.random() * 12);
        const hireDay = 1 + Math.floor(Math.random() * 28);
        const hireDate = new Date(hireYear, hireMonth, hireDay);

        // Random contract type
        const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)] as any;

        // For TEMPORAL contracts, set end date
        let contractEndDate = null;
        if (contractType === 'TEMPORAL' || contractType === 'OBRA_SERVICIO') {
            // Set end date somewhere in the next 6 months to 2 years
            const endDays = 180 + Math.floor(Math.random() * 545);
            contractEndDate = new Date(Date.now() + endDays * 24 * 60 * 60 * 1000);
        }

        // Random salary between 1800 and 4500
        const baseSalary = 1800 + Math.floor(Math.random() * 2700);
        const salary = Math.round(baseSalary / 100) * 100; // Round to nearest 100

        // Random vacation days (22-30)
        const vacationDays = 22 + Math.floor(Math.random() * 9);

        // Make some users inactive (about 15%)
        const isActive = Math.random() > 0.15;
        if (!isActive) inactiveCount++;

        // Update user with HR data
        await prisma.user.update({
            where: { id: user.id },
            data: {
                employeeCode,
                hireDate,
                contractType,
                contractEndDate,
                salary,
                vacationDays,
                isActive,
                ssNumber: `28/${String(Math.floor(Math.random() * 99999999)).padStart(8, '0')}/00`,
                bankAccount: `ES${String(10 + Math.floor(Math.random() * 90))} ${String(1000 + Math.floor(Math.random() * 9000))} ${String(1000 + Math.floor(Math.random() * 9000))} ${String(10 + Math.floor(Math.random() * 90))} ${String(1000000000 + Math.floor(Math.random() * 9000000000)).slice(0, 10)}`,
            }
        });

        console.log(`✅ ${user.name} → ${employeeCode} | ${contractType} | ${salary}€ | ${isActive ? '🟢 Activo' : '🔴 Inactivo'}`);
        updatedCount++;
    }

    console.log(`\n🎉 HR data seeded for ${updatedCount} employees`);
    console.log(`   ${inactiveCount} employees marked as inactive`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
