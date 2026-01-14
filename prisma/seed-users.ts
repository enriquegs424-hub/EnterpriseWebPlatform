import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Creando usuarios de MEP Projects...\n');

    const passwordHash = await bcrypt.hash('Mep2026!', 12);

    // Definir usuarios con sus datos completos
    const users = [
        // CIVIL/DISEÑO (Imagen 1)
        { name: 'Andrea Ariza', email: 'andrea.ariza@mep-projects.com', department: 'CIVIL_DESIGN', role: 'WORKER' },
        { name: 'Antonio Calderón', email: 'antonio.calderon@mep-projects.com', department: 'CIVIL_DESIGN', role: 'WORKER' },
        { name: 'Edgar Chacón', email: 'edgar.chacon@mep-projects.com', department: 'CIVIL_DESIGN', role: 'WORKER' },
        { name: 'Helga Hernández', email: 'helga.hernandez@mep-projects.com', department: 'CIVIL_DESIGN', role: 'WORKER' },
        { name: 'José Manuel Canga', email: 'jose.canga@mep-projects.com', department: 'CIVIL_DESIGN', role: 'WORKER' },
        { name: 'Lorena Gallego', email: 'lore.gallego@mep-projects.com', department: 'CIVIL_DESIGN', role: 'WORKER' },
        { name: 'Mayte Ayala', email: 'mayte.ayala@mep-projects.com', department: 'CIVIL_DESIGN', role: 'WORKER' },

        // ELÉCTRICO (Imagen 2)
        { name: 'Alfonso Mateos', email: 'alfonso.mateos@mep-projects.com', department: 'ELECTRICAL', role: 'WORKER' },
        { name: 'José Antonio Gil', email: 'jose.gil@mep-projects.com', department: 'ELECTRICAL', role: 'WORKER' },
        { name: 'José Calurano', email: 'jose.calurano@mep-projects.com', department: 'ELECTRICAL', role: 'WORKER' },
        { name: 'José Manuel Bucarat', email: 'jm.bucarat@mep-projects.com', department: 'ELECTRICAL', role: 'WORKER' },
        { name: 'Juan Antonio Ibarra', email: 'juan.ibarra@mep-projects.com', department: 'ELECTRICAL', role: 'WORKER' },
        { name: 'Juan Luis Gavira', email: 'juanluis.gavira@mep-projects.com', department: 'ELECTRICAL', role: 'WORKER' },
        { name: 'Maica Sánchez', email: 'maica.sanchez@mep-projects.com', department: 'ELECTRICAL', role: 'WORKER' },
        { name: 'Miguel Chambilla', email: 'miguel.angel@mep-projects.com', department: 'ELECTRICAL', role: 'WORKER' },
        { name: 'Teresa Thiriet', email: 'teresa.thiriet@mep-projects.com', department: 'ELECTRICAL', role: 'WORKER' },
        { name: 'Vicente Benítez', email: 'vicente.benitez@mep-projects.com', department: 'ELECTRICAL', role: 'WORKER' },

        // INSTRUMENTACIÓN Y CONTROL (Imagen 3)
        { name: 'Ester Chinchilla', email: 'estercv@mep-projects.com', department: 'INSTRUMENTATION', role: 'WORKER' },
        { name: 'Javier Jiménez', email: 'javier.jimenez@mep-projects.com', department: 'INSTRUMENTATION', role: 'WORKER' },
        { name: 'Jessica Valiente', email: 'jessica.valiente@mep-projects.com', department: 'INSTRUMENTATION', role: 'WORKER' },
        { name: 'Juan Pablo Mula', email: 'juanpablo.mula@mep-projects.com', department: 'INSTRUMENTATION', role: 'WORKER' },
        { name: 'Marina Sánchez', email: 'juancarlos.gallego@mep-projects.com', department: 'INSTRUMENTATION', role: 'WORKER' },

        // ADMINISTRACIÓN
        { name: 'María Carmen Lay', email: 'carmen.lay@mep-projects.com', department: 'ADMINISTRATION', role: 'ADMIN' },
        { name: 'Eli Sánchez', email: 'eli.sanchez@mep-projects.com', department: 'ADMINISTRATION', role: 'WORKER' },
        { name: 'Beatriz Tudela', email: 'beatriz.tudela@mep-projects.com', department: 'ADMINISTRATION', role: 'WORKER' },
        { name: 'Marta Tudela', email: 'marta.tudela@mep-projects.com', department: 'ADMINISTRATION', role: 'WORKER' },
        { name: 'Cristina Tudela', email: 'cristina.tudela@mep-projects.com', department: 'ADMINISTRATION', role: 'WORKER' },

        // IT (SUPERADMIN)
        { name: 'Enrique Gallego', email: 'enrique.gallego@mep-projects.com', department: 'IT', role: 'SUPERADMIN' },

        // ECONÓMICO
        { name: 'Huberto', email: 'huberto@mep-projects.com', department: 'ECONOMIC', role: 'WORKER' },
        { name: 'Fran Martín', email: 'fran.martin@mep-projects.com', department: 'ECONOMIC', role: 'WORKER' },

        // MARKETING
        { name: 'F. Valiente', email: 'fvaliente@mep-projects.com', department: 'MARKETING', role: 'WORKER' },
    ];

    // Obtener o crear empresa
    let company = await prisma.company.findFirst({
        where: { slug: 'mep-projects' },
    });

    if (!company) {
        console.log('🏢 Creando empresa MEP Projects...');
        company = await prisma.company.create({
            data: {
                name: 'MEP Projects S.L.',
                slug: 'mep-projects',
                email: 'info@mep-projects.com',
                phone: '+34 912 345 678',
                address: 'Calle Ingeniería 1, 28001 Madrid',
                taxId: 'B12345678',
                currency: 'EUR',
                timezone: 'Europe/Madrid',
                isActive: true,
            },
        });
        console.log(`✅ Empresa creada: ${company.name}\n`);
    }

    // Crear usuarios
    console.log('👥 Creando usuarios...\n');
    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of users) {
        const existing = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (existing) {
            console.log(`⏭️  Ya existe: ${userData.email}`);
            skippedCount++;
            continue;
        }

        await prisma.user.create({
            data: {
                name: userData.name,
                email: userData.email,
                passwordHash,
                role: userData.role as any,
                department: userData.department as any,
                companyId: company.id,
                isActive: true,
                dailyWorkHours: 8.0,
            },
        });

        console.log(`✅ ${userData.name} - ${userData.department} (${userData.role})`);
        createdCount++;
    }

    console.log(`\n🎉 Proceso completado:`);
    console.log(`   • ${createdCount} usuarios creados`);
    console.log(`   • ${skippedCount} usuarios ya existían`);
    console.log(`\n🔐 Contraseña por defecto: Mep2026!`);
    console.log(`   (Los usuarios pueden cambiarla desde su perfil)\n`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
