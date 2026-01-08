import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAndCreateUsers() {
    console.log('🔍 Verificando usuarios existentes...\n');

    // Get all users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
        }
    });

    console.log(`📊 Total de usuarios: ${users.length}\n`);

    if (users.length > 0) {
        console.log('Usuarios existentes:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email}) - Rol: ${user.role}`);
        });
        console.log('\n');
    }

    // Create second user if needed
    if (users.length < 2) {
        console.log('⚠️  Solo hay 1 usuario. Creando segundo usuario para pruebas...\n');

        const password = await bcrypt.hash('password123', 10);

        const newUser = await prisma.user.create({
            data: {
                name: 'María García',
                email: 'maria@mep.com',
                passwordHash: password,
                role: 'WORKER',
                department: 'OTHER',
                isActive: true
            }
        });

        console.log('✅ Usuario creado exitosamente:');
        console.log(`   Nombre: ${newUser.name}`);
        console.log(`   Email: ${newUser.email}`);
        console.log(`   Password: password123`);
        console.log(`   Rol: ${newUser.role}\n`);
    } else {
        console.log('✅ Ya tienes 2 o más usuarios. Listo para probar el chat.\n');
    }

    // Check if there's a project
    const projects = await prisma.project.findMany({
        take: 1,
        select: {
            id: true,
            name: true,
            code: true
        }
    });

    if (projects.length === 0) {
        console.log('⚠️  No hay proyectos. Creando proyecto de prueba...\n');

        const project = await prisma.project.create({
            data: {
                code: 'TEST-001',
                name: 'Proyecto de Prueba - Chat',
                year: 2026,
                department: 'OTHER',
                isActive: true
            }
        });

        console.log('✅ Proyecto creado:');
        console.log(`   Código: ${project.code}`);
        console.log(`   Nombre: ${project.name}\n`);
    } else {
        console.log(`✅ Proyecto existente: ${projects[0].code} - ${projects[0].name}\n`);
    }

    console.log('📋 INSTRUCCIONES PARA PROBAR EL CHAT:\n');
    console.log('1. Abre Chrome: http://localhost:3000');
    console.log('   Login con el primer usuario\n');
    console.log('2. Abre Firefox o Ventana Incógnito: http://localhost:3000');
    console.log('   Login con el segundo usuario\n');
    console.log('3. En ambos navegadores:');
    console.log('   - Ve a "Proyectos" y selecciona el proyecto');
    console.log('   - Luego ve a "Chat" en el menú lateral\n');
    console.log('4. Envía mensajes desde ambas ventanas');
    console.log('   - Edita mensajes propios');
    console.log('   - Responde a mensajes (botón Reply)');
    console.log('   - Elimina mensajes\n');
    console.log('✨ Refresca la página para ver mensajes del otro usuario (polling automático pendiente)\n');
}

checkAndCreateUsers()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
