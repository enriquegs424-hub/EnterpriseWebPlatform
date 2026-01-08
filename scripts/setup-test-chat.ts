import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Preparando usuarios para la prueba del chat...\n');

    const saltRounds = 10;
    const commonPassword = 'password123';
    const pruebasPassword = 'pruebas123';
    const enriquePassword = 'password123'; // Mantendremos password123 para Enrique

    const hashedCommon = await bcrypt.hash(commonPassword, saltRounds);
    const hashedPruebas = await bcrypt.hash(pruebasPassword, saltRounds);

    // 1. Asegurar que Enrique existe y tiene el password correcto
    const enrique = await prisma.user.upsert({
        where: { email: 'admin@mep-projects.com' },
        update: {
            passwordHash: hashedCommon,
            isActive: true
        },
        create: {
            name: 'Enrique',
            email: 'admin@mep-projects.com',
            passwordHash: hashedCommon,
            role: 'ADMIN',
            department: 'ADMINISTRATION',
            isActive: true
        }
    });

    console.log('✅ Usuario Enrique actualizado/verificado');

    // 2. Crear usuario "Pruebas"
    const pruebas = await prisma.user.upsert({
        where: { email: 'pruebas@mep.com' },
        update: {
            passwordHash: hashedPruebas,
            isActive: true
        },
        create: {
            name: 'Pruebas',
            email: 'pruebas@mep.com',
            passwordHash: hashedPruebas,
            role: 'WORKER',
            department: 'ENGINEERING',
            isActive: true
        }
    });

    console.log('✅ Usuario "Pruebas" creado/actualizado');

    console.log('\n' + '='.repeat(60));
    console.log('CREDENCIALES PARA LA PRUEBA');
    console.log('='.repeat(60));
    console.log('\n👤 USUARIO 1 (Enrique):');
    console.log(`   Email:    admin@mep-projects.com`);
    console.log(`   Password: ${commonPassword}`);
    console.log('\n👤 USUARIO 2 (Pruebas):');
    console.log(`   Email:    pruebas@mep.com`);
    console.log(`   Password: ${pruebasPassword}`);
    console.log('\n' + '='.repeat(60));
    console.log('\n🚀 INSTRUCCIONES:');
    console.log('1. Navegador Normal: Login con Enrique');
    console.log('2. Incógnito: Login con Pruebas');
    console.log('3. ¡A chatear! (Recuerda refrescar con F5 para ver mensajes nuevos)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
