import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedChats() {
    console.log('💬 Adding chat data...\n');

    const company = await prisma.company.findFirst({ where: { slug: 'mep-projects' } });
    if (!company) throw new Error('Company not found');

    const users = await prisma.user.findMany({
        where: { companyId: company.id },
        take: 10
    });

    if (users.length < 2) {
        console.log('⚠️ Need at least 2 users for chats');
        return;
    }

    console.log(`Found ${users.length} users`);

    // Clean old chats
    await prisma.message.deleteMany();
    await prisma.chatMember.deleteMany();
    await prisma.chat.deleteMany();

    // Create some 1-on-1 chats
    const chats = [];

    for (let i = 0; i < Math.min(3, users.length - 1); i++) {
        const chat = await prisma.chat.create({
            data: {
                name: null, // Direct messages don't have names
                type: 'DIRECT',
                members: {
                    create: [
                        { userId: users[i].id },
                        { userId: users[i + 1].id }
                    ]
                }
            }
        });
        chats.push(chat);

        // Add some messages
        await prisma.message.createMany({
            data: [
                {
                    chatId: chat.id,
                    authorId: users[i].id,
                    content: `Hola ${users[i + 1].name}, ¿cómo va el proyecto?`
                },
                {
                    chatId: chat.id,
                    authorId: users[i + 1].id,
                    content: `Hola ${users[i].name}, todo bien. Estoy trabajando en los planos.`
                },
                {
                    chatId: chat.id,
                    authorId: users[i].id,
                    content: 'Perfecto, avísame si necesitas ayuda.'
                }
            ]
        });
    }

    // Create a group chat
    if (users.length >= 3) {
        const groupChat = await prisma.chat.create({
            data: {
                name: 'Equipo de Proyecto',
                type: 'GROUP',
                members: {
                    create: users.slice(0, 5).map(u => ({ userId: u.id }))
                }
            }
        });

        await prisma.message.createMany({
            data: [
                {
                    chatId: groupChat.id,
                    authorId: users[0].id,
                    content: 'Bienvenidos al chat del equipo!'
                },
                {
                    chatId: groupChat.id,
                    authorId: users[1].id,
                    content: 'Hola a todos 👋'
                },
                {
                    chatId: groupChat.id,
                    authorId: users[2].id,
                    content: 'Perfecto, aquí podemos coordinar el trabajo.'
                }
            ]
        });

        chats.push(groupChat);
    }

    console.log(`✅ ${chats.length} chats created with messages\n`);
}

seedChats()
    .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
