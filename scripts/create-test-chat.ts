import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Creando chat de proyecto de prueba...\n');

    // 1. Buscar o crear proyecto de prueba
    let project = await prisma.project.findFirst({
        where: { code: 'TEST-CHAT' }
    });

    if (!project) {
        project = await prisma.project.create({
            data: {
                code: 'TEST-CHAT',
                name: 'Proyecto de Prueba - Chat',
                year: 2026,
                department: 'ENGINEERING',
                isActive: true
            }
        });
        console.log('✅ Proyecto creado:', project.name);
    } else {
        console.log('✅ Proyecto existente:', project.name);
    }

    // 2. Buscar usuarios
    const enrique = await prisma.user.findUnique({
        where: { email: 'admin@mep-projects.com' }
    });

    const pruebas = await prisma.user.findUnique({
        where: { email: 'pruebas@mep.com' }
    });

    if (!enrique || !pruebas) {
        console.error('❌ Faltan usuarios. Ejecuta: npx tsx scripts/setup-test-chat.ts');
        process.exit(1);
    }

    // 3. Crear chat del proyecto
    let chat = await prisma.chat.findFirst({
        where: {
            type: 'PROJECT',
            projectId: project.id
        }
    });

    if (!chat) {
        chat = await prisma.chat.create({
            data: {
                type: 'PROJECT',
                name: `Chat: ${project.name}`,
                projectId: project.id,
                members: {
                    create: [
                        { userId: enrique.id },
                        { userId: pruebas.id }
                    ]
                }
            }
        });
        console.log('✅ Chat de proyecto creado');
    } else {
        console.log('✅ Chat de proyecto ya existe');

        // Asegurar que ambos usuarios son miembros
        const existingMembers = await prisma.chatMember.findMany({
            where: { chatId: chat.id }
        });

        const enriqueIsMember = existingMembers.some(m => m.userId === enrique.id);
        const pruebasIsMember = existingMembers.some(m => m.userId === pruebas.id);

        if (!enriqueIsMember) {
            await prisma.chatMember.create({
                data: { chatId: chat.id, userId: enrique.id }
            });
            console.log('✅ Enrique agregado como miembro');
        }

        if (!pruebasIsMember) {
            await prisma.chatMember.create({
                data: { chatId: chat.id, userId: pruebas.id }
            });
            console.log('✅ Pruebas agregado como miembro');
        }
    }

    // 4. Crear mensaje de bienvenida si no hay mensajes
    const messageCount = await prisma.message.count({
        where: { chatId: chat.id }
    });

    if (messageCount === 0) {
        await prisma.message.create({
            data: {
                content: '¡Hola! Este es el chat del proyecto de prueba. Envía un mensaje para probar la funcionalidad.',
                chatId: chat.id,
                authorId: enrique.id,
                mentions: []
            }
        });
        console.log('✅ Mensaje de bienvenida creado');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TODO LISTO PARA PROBAR');
    console.log('='.repeat(60));
    console.log('\n📋 Proyecto:', project.code, '-', project.name);
    console.log('👥 Miembros: Enrique, Pruebas');
    console.log('\n🚀 AHORA:');
    console.log('1. Refresca las páginas del chat (F5)');
    console.log('2. Verás el chat del proyecto en la lista');
    console.log('3. Click en el chat');
    console.log('4. ¡Envía mensajes!\n');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
