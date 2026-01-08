import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('='.repeat(60));
    console.log('USUARIOS EN LA BASE DE DATOS');
    console.log('='.repeat(60));
    console.log('');

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            isActive: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    if (users.length === 0) {
        console.log('❌ NO HAY USUARIOS EN LA BASE DE DATOS');
        console.log('');
        console.log('Creando usuarios de prueba...');
        console.log('');

        await createTestUsers();
        return;
    }

    console.log(`Total: ${users.length} usuario(s)\n`);

    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Rol: ${user.role}`);
        console.log(`   🏢 Departamento: ${user.department}`);
        console.log(`   ✅ Activo: ${user.isActive ? 'Sí' : 'No'}`);
        console.log('');
    });

    if (users.length === 1) {
        console.log('⚠️  Solo tienes 1 usuario. Creando segundo usuario...\n');
        await createSecondUser();
    } else {
        console.log('✅ Tienes suficientes usuarios para probar el chat\n');
        printTestInstructions(users);
    }
}

async function createTestUsers() {
    const password = await bcrypt.hash('password123', 10);

    const user1 = await prisma.user.create({
        data: {
            name: 'Admin MEP',
            email: 'admin@mep.com',
            passwordHash: password,
            role: 'ADMIN',
            department: 'OTHER',
            isActive: true
        }
    });

    const user2 = await prisma.user.create({
        data: {
            name: 'María García',
            email: 'maria@mep.com',
            passwordHash: password,
            role: 'WORKER',
            department: 'OTHER',
            isActive: true
        }
    });

    console.log('✅ Usuarios creados:');
    console.log('');
    console.log('1. Admin MEP');
    console.log('   Email: admin@mep.com');
    console.log('   Password: password123');
    console.log('   Rol: ADMIN');
    console.log('');
    console.log('2. María García');
    console.log('   Email: maria@mep.com');
    console.log('   Password: password123');
    console.log('   Rol: WORKER');
    console.log('');

    printTestInstructions([user1, user2]);
}

async function createSecondUser() {
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

    console.log('✅ Segundo usuario creado:');
    console.log('');
    console.log('   Nombre: María García');
    console.log('   Email: maria@mep.com');
    console.log('   Password: password123');
    console.log('   Rol: WORKER');
    console.log('');

    const allUsers = await prisma.user.findMany();
    printTestInstructions(allUsers);
}

function printTestInstructions(users: any[]) {
    console.log('='.repeat(60));
    console.log('INSTRUCCIONES PARA PROBAR EL CHAT');
    console.log('='.repeat(60));
    console.log('');
    console.log('PASO 1: Abre Chrome (ventana normal)');
    console.log('        URL: http://localhost:3000');
    console.log(`        Login: ${users[0].email}`);
    console.log('        Password: password123');
    console.log('');
    console.log('PASO 2: Abre Firefox O Ventana Incógnito (Ctrl+Shift+N)');
    console.log('        URL: http://localhost:3000');
    console.log(`        Login: ${users[1]?.email || 'usuario2@mep.com'}`);
    console.log('        Password: password123');
    console.log('');
    console.log('PASO 3: En AMBAS ventanas');
    console.log('        - Ve al menú lateral');
    console.log('        - Click en "Chat" 💬');
    console.log('');
    console.log('PASO 4: Prueba el chat');
    console.log('        - Envía mensajes desde ambas ventanas');
    console.log('        - Usa Ctrl+Enter para enviar rápido');
    console.log('        - Responde mensajes (botón Reply)');
    console.log('        - Edita tus mensajes (botón Edit)');
    console.log('        - Elimina mensajes (botón Delete)');
    console.log('');
    console.log('⚠️  IMPORTANTE: Refresca (F5) para ver mensajes nuevos');
    console.log('    El polling automático se agregará después');
    console.log('');
    console.log('='.repeat(60));
}

main()
    .catch((e) => {
        console.error('');
        console.error('❌ ERROR:', e.message);
        console.error('');
        if (e.message.includes('Unique constraint')) {
            console.error('El usuario ya existe. Usa Prisma Studio para ver usuarios:');
            console.error('npx prisma studio');
        }
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
