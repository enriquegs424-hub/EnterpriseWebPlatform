'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Get or create a project chat channel
 */
export async function getOrCreateProjectChat(projectId: string) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) throw new Error('Usuario no encontrado');

    // Check if project chat exists
    let chat = await prisma.chat.findFirst({
        where: {
            type: 'PROJECT',
            projectId
        },
        include: {
            members: true,
            messages: {
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    replyTo: {
                        select: {
                            id: true,
                            content: true,
                            author: {
                                select: { name: true }
                            }
                        }
                    }
                }
            }
        }
    });

    // Create if doesn't exist
    if (!chat) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { name: true }
        });

        chat = await prisma.chat.create({
            data: {
                type: 'PROJECT',
                name: `Chat: ${project?.name}`,
                projectId,
                members: {
                    create: {
                        userId: user.id
                    }
                }
            },
            include: {
                members: true,
                messages: {
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        replyTo: {
                            select: {
                                id: true,
                                content: true,
                                author: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                }
            }
        });
    } else {
        // Add user as member if not already
        const isMember = chat.members.some((m) => m.userId === user.id);
        if (!isMember) {
            await prisma.chatMember.create({
                data: {
                    chatId: chat.id,
                    userId: user.id
                }
            });
        }
    }

    return {
        ...chat,
        messages: chat.messages.reverse() // Oldest first for UI
    };
}

/**
 * Get or create a direct message chat between two users
 */
export async function getOrCreateDirectChat(otherUserId: string) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) throw new Error('Usuario no encontrado');

    // Find existing DM between these users
    let chat = await prisma.chat.findFirst({
        where: {
            type: 'DIRECT',
            AND: [
                { members: { some: { userId: user.id } } },
                { members: { some: { userId: otherUserId } } }
            ]
        },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            },
            messages: {
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    replyTo: {
                        select: {
                            id: true,
                            content: true,
                            author: {
                                select: { name: true }
                            }
                        }
                    }
                }
            }
        }
    });

    // Create if doesn't exist
    if (!chat) {
        chat = await prisma.chat.create({
            data: {
                type: 'DIRECT',
                members: {
                    create: [
                        { userId: user.id },
                        { userId: otherUserId }
                    ]
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                messages: {
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        replyTo: {
                            select: {
                                id: true,
                                content: true,
                                author: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    return {
        ...chat,
        messages: chat.messages.reverse()
    };
}

/**
 * Get all chats for current user
 */
export async function getUserChats() {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) throw new Error('Usuario no encontrado');

    const chatMemberships = await prisma.chatMember.findMany({
        where: { userId: user.id },
        include: {
            chat: {
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            content: true,
                            createdAt: true,
                            author: {
                                select: { name: true }
                            }
                        }
                    }
                }
            }
        }
    });

    // Process chats to add metadata and calculate unread counts
    const chatsWithMeta = await Promise.all(chatMemberships.map(async (cm) => {
        const chat = cm.chat;

        // Calculate real unread count
        const unreadCount = await prisma.message.count({
            where: {
                chatId: chat.id,
                createdAt: { gt: cm.lastRead },
                authorId: { not: user.id }
            }
        });

        return {
            ...chat,
            lastMessage: chat.messages[0] || null,
            unreadCount,
            membershipId: cm.id,
            lastRead: cm.lastRead,
            isFavorite: (cm as any).isFavorite,
            role: (cm as any).role
        };
    }));

    // Sort: Favorites first, then by last message/update
    return chatsWithMeta.sort((a, b) => {
        // 1. Favorites first
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;

        // 2. Sort by update time (desc)
        const dateA = a.lastMessage?.createdAt || a.updatedAt;
        const dateB = b.lastMessage?.createdAt || b.updatedAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
}

/**
 * Toggle favorite status for a chat
 */
export async function toggleChatFavorite(chatId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!user) throw new Error('Usuario no encontrado');

    const member = await prisma.chatMember.findUnique({
        where: {
            chatId_userId: {
                chatId,
                userId: user.id
            }
        }
    });

    if (!member) throw new Error('No eres miembro de este chat');

    await prisma.chatMember.update({
        where: { id: member.id },
        data: { isFavorite: !(member as any).isFavorite } as any
    });

    revalidatePath('/chat');
}

/**
 * Create a new group chat
 */
export async function createGroupChat(name: string, participantIds: string[]) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!user) throw new Error('Usuario no encontrado');

    // Create chat
    const chat = await prisma.chat.create({
        data: {
            type: 'GROUP' as any,
            name,
            members: {
                create: [
                    { userId: user.id, role: 'ADMIN' } as any,
                    ...participantIds.map(id => ({ userId: id, role: 'MEMBER' } as any))
                ]
            }
        },
        include: {
            members: {
                include: {
                    user: { select: { id: true, name: true, email: true } }
                }
            }
        }
    });

    revalidatePath('/chat');
    return chat;
}

/**
 * Send a message to a chat
 */
export async function sendMessage(
    chatId: string,
    content: string,
    attachments: any[] = [],
    replyToId?: string
) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) throw new Error('Usuario no encontrado');

    // Verify user is member of chat
    const member = await prisma.chatMember.findFirst({
        where: {
            chatId,
            userId: user.id
        }
    });

    if (!member) {
        throw new Error('No eres miembro de este chat');
    }

    // Extract mentions from content (simple regex for @Name)
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
        // This is a naive implementation. Ideally, we should resolve usernames to IDs
        // For now, we just store the matched text
        mentions.push(match[1]);
    }

    const message = await prisma.message.create({
        data: {
            content,
            chatId,
            authorId: user.id,
            attachments: attachments.length > 0 ? attachments : undefined,
            mentions: mentions,
            replyToId
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            replyTo: {
                select: {
                    id: true,
                    content: true,
                    author: {
                        select: { name: true }
                    }
                }
            }
        }
    });

    // Update chat updatedAt
    await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
    });

    revalidatePath('/chat');

    return message;
}

/**
 * Get messages for a chat with pagination
 */
export async function getMessages(
    chatId: string,
    limit: number = 50,
    before?: string // Message ID to fetch before
) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) throw new Error('Usuario no encontrado');

    // Verify membership
    const member = await prisma.chatMember.findFirst({
        where: {
            chatId,
            userId: user.id
        }
    });

    if (!member) {
        throw new Error('No eres miembro de este chat');
    }

    const messages = await prisma.message.findMany({
        where: {
            chatId,
            deletedAt: null,
            ...(before && {
                createdAt: {
                    lt: (await prisma.message.findUnique({
                        where: { id: before },
                        select: { createdAt: true }
                    }))?.createdAt
                }
            })
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            replyTo: {
                select: {
                    id: true,
                    content: true,
                    author: {
                        select: { name: true }
                    }
                }
            }
        }
    });

    return messages.reverse(); // Oldest first
}

/**
 * Mark chat as read
 */
export async function markAsRead(chatId: string) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) throw new Error('Usuario no encontrado');

    await prisma.chatMember.updateMany({
        where: {
            chatId,
            userId: user.id
        },
        data: {
            lastRead: new Date()
        }
    });

    revalidatePath('/chat');
}

/**
 * Edit a message
 */
export async function editMessage(messageId: string, newContent: string) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) throw new Error('Usuario no encontrado');

    const message = await prisma.message.findUnique({
        where: { id: messageId }
    });

    if (!message || message.authorId !== user.id) {
        throw new Error('No puedes editar este mensaje');
    }

    const updated = await prisma.message.update({
        where: { id: messageId },
        data: {
            content: newContent,
            isEdited: true
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    revalidatePath('/chat');

    return updated;
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(messageId: string) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) throw new Error('Usuario no encontrado');

    const message = await prisma.message.findUnique({
        where: { id: messageId }
    });

    if (!message || message.authorId !== user.id) {
        throw new Error('No puedes eliminar este mensaje');
    }

    await prisma.message.update({
        where: { id: messageId },
        data: {
            deletedAt: new Date(),
            content: '_Mensaje eliminado_'
        }
    });

    revalidatePath('/chat');
}

/**
 * Get total unread count for user
 */
export async function getUnreadCount() {
    const session = await auth();
    if (!session?.user?.email) {
        return 0;
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) return 0;

    // TODO: This is a simplified version
    // In production, calculate based on lastRead timestamp
    const memberships = await prisma.chatMember.findMany({
        where: { userId: user.id },
        include: {
            chat: {
                include: {
                    messages: {
                        where: {
                            authorId: { not: user.id },
                            deletedAt: null
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            }
        }
    });

    let unreadCount = 0;
    memberships.forEach((m) => {
        const lastMessage = m.chat.messages[0];
        if (lastMessage && lastMessage.createdAt > m.lastRead) {
            unreadCount++;
        }
    });

    return unreadCount;
}

/**
 * Search for users to start a new chat
 */
export async function searchUsers(query: string) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) throw new Error('Usuario no encontrado');

    // Search users excluding current user
    const users = await prisma.user.findMany({
        where: {
            AND: [
                { id: { not: user.id } },
                { isActive: true },
                {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } }
                    ]
                }
            ]
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true
        },
        take: 10
    });

    return users;
}

/**
 * Set typing status for a user in a chat
 */
export async function setTypingStatus(chatId: string, isTyping: boolean) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) throw new Error('Usuario no encontrado');

    // Verify user is member of chat
    const membership = await prisma.chatMember.findFirst({
        where: {
            chatId,
            userId: user.id
        }
    });

    if (!membership) throw new Error('No eres miembro de este chat');

    // Store typing status in memory (simple in-memory cache)
    // In production, use Redis for better performance
    if (!global.typingStatus) {
        global.typingStatus = new Map();
    }

    const key = `${chatId}:${user.id}`;

    if (isTyping) {
        global.typingStatus.set(key, {
            userId: user.id,
            userName: user.name,
            timestamp: Date.now()
        });
    } else {
        global.typingStatus.delete(key);
    }

    return { success: true };
}

/**
 * Get typing users for a chat (excluding current user)
 */
export async function getTypingUsers(chatId: string) {
    const session = await auth();
    if (!session?.user?.email) {
        return [];
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) return [];

    if (!global.typingStatus) {
        return [];
    }

    const typingUsers: { userId: string; userName: string }[] = [];
    const now = Date.now();
    const TYPING_TIMEOUT = 5000; // 5 seconds

    // Clean up old typing statuses and collect active ones
    for (const [key, status] of global.typingStatus.entries()) {
        if (key.startsWith(`${chatId}:`)) {
            if (now - status.timestamp > TYPING_TIMEOUT) {
                global.typingStatus.delete(key);
            } else if (status.userId !== user.id) {
                typingUsers.push({
                    userId: status.userId,
                    userName: status.userName
                });
            }
        }
    }

    return typingUsers;
}

/**
 * Get unread messages since a specific date for notifications
 */
export async function getUnreadMessages(since: Date) {
    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!user) return [];

    const messages = await prisma.message.findMany({
        where: {
            createdAt: { gt: since },
            authorId: { not: user.id },
            chat: {
                members: {
                    some: { userId: user.id }
                }
            }
        },
        include: {
            author: { select: { name: true } },
            chat: { select: { id: true, name: true, type: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return messages;
}

/**
 * Update a group chat (name, members)
 * ADMIN and MANAGER of the chat can update
 */
export async function updateGroupChat(chatId: string, data: {
    name?: string;
    image?: string;
    addMemberIds?: string[];
    removeMemberIds?: string[];
}) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.email) throw new Error('No autorizado');

    const dbUser = await prisma.user.findUnique({
        where: { email: user.email }
    });
    if (!dbUser) throw new Error('Usuario no encontrado');

    // Get chat and check permissions
    const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { members: true }
    });

    if (!chat) throw new Error('Chat no encontrado');
    if (chat.type !== 'GROUP') throw new Error('Solo puedes editar chats de grupo');

    // Check if user is ADMIN or MANAGER of the chat, or system ADMIN
    const membership = chat.members.find(m => m.userId === dbUser.id);
    const isSystemAdmin = dbUser.role === 'SUPERADMIN' || dbUser.role === 'ADMIN';
    const isChatAdminOrManager = (membership as any)?.role === 'ADMIN' || (membership as any)?.role === 'MANAGER';

    if (!isSystemAdmin && !isChatAdminOrManager) {
        throw new Error('No tienes permisos para editar este grupo');
    }

    // Update name/image if provided
    if (data.name || data.image) {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.image) updateData.image = data.image;

        await prisma.chat.update({
            where: { id: chatId },
            data: updateData
        });
    }

    // Add new members
    if (data.addMemberIds && data.addMemberIds.length > 0) {
        const existingIds = chat.members.map(m => m.userId);
        const newIds = data.addMemberIds.filter(id => !existingIds.includes(id));

        for (const userId of newIds) {
            await prisma.chatMember.create({
                data: { chatId, userId, role: 'MEMBER' } as any
            });
        }
    }

    // Remove members (cannot remove self if ADMIN)
    if (data.removeMemberIds && data.removeMemberIds.length > 0) {
        for (const userId of data.removeMemberIds) {
            const memberToRemove = chat.members.find(m => m.userId === userId);
            if (memberToRemove && (memberToRemove as any).role !== 'ADMIN') {
                await prisma.chatMember.delete({
                    where: { id: memberToRemove.id }
                });
            }
        }
    }

    revalidatePath('/chat');
    return { success: true };
}

/**
 * Delete a group chat (SUPERADMIN/ADMIN only)
 */
export async function deleteGroupChat(chatId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!user) throw new Error('Usuario no encontrado');

    // Only SUPERADMIN or ADMIN can delete
    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') {
        throw new Error('Solo los administradores pueden eliminar grupos');
    }

    const chat = await prisma.chat.findUnique({
        where: { id: chatId }
    });

    if (!chat) throw new Error('Chat no encontrado');
    if (chat.type !== 'GROUP') throw new Error('Solo puedes eliminar chats de grupo');

    // Delete all messages, members, then chat
    await prisma.message.deleteMany({ where: { chatId } });
    await prisma.chatMember.deleteMany({ where: { chatId } });
    await prisma.chat.delete({ where: { id: chatId } });

    revalidatePath('/chat');
    return { success: true };
}

/**
 * Search messages within a chat
 */
export async function searchMessagesInChat(chatId: string, query: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!user) throw new Error('Usuario no encontrado');

    // Verify membership
    const membership = await prisma.chatMember.findFirst({
        where: { chatId, userId: user.id }
    });
    if (!membership) throw new Error('No eres miembro de este chat');

    const messages = await prisma.message.findMany({
        where: {
            chatId,
            deletedAt: null,
            content: { contains: query, mode: 'insensitive' }
        },
        include: {
            author: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    return messages;
}

/**
 * Get all attachments/files from a chat
 */
export async function getChatAttachments(chatId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!user) throw new Error('Usuario no encontrado');

    // Verify membership
    const membership = await prisma.chatMember.findFirst({
        where: { chatId, userId: user.id }
    });
    if (!membership) throw new Error('No eres miembro de este chat');

    // Get messages with attachments
    const messages = await prisma.message.findMany({
        where: {
            chatId,
            deletedAt: null,
            attachments: { not: { equals: null } }
        },
        include: {
            author: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Flatten attachments from all messages
    const attachments: any[] = [];
    messages.forEach(msg => {
        if (msg.attachments && Array.isArray(msg.attachments)) {
            (msg.attachments as any[]).forEach(att => {
                attachments.push({
                    ...att,
                    messageId: msg.id,
                    uploadedAt: msg.createdAt,
                    uploadedBy: msg.author.name
                });
            });
        }
    });

    return attachments;
}

/**
 * Get chat info for management (including user's role)
 */
export async function getChatInfo(chatId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!user) throw new Error('Usuario no encontrado');

    const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
            members: {
                include: { user: { select: { id: true, name: true, email: true, role: true } } }
            }
        }
    });

    if (!chat) throw new Error('Chat no encontrado');

    const membership = chat.members.find(m => m.userId === user.id);
    if (!membership) throw new Error('No eres miembro de este chat');

    return {
        ...chat,
        userRole: (membership as any).role,
        userSystemRole: user.role,
        canEdit: user.role === 'SUPERADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER' || (membership as any).role === 'ADMIN',
        canDelete: user.role === 'SUPERADMIN' || user.role === 'ADMIN'
    };
}

