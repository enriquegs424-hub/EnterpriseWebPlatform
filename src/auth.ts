import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "./lib/prisma"
import { authConfig } from "./auth.config"
import { authLimiter, logRateLimitBlock } from "./lib/rate-limit"

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    providers: [
        Credentials({
            async authorize(credentials, request) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (!parsedCredentials.success) {
                    return null;
                }

                const { email, password } = parsedCredentials.data;

                // Rate limit check by email
                const rateLimitResult = authLimiter.check(`auth:${email}`);
                if (!rateLimitResult.allowed) {
                    logRateLimitBlock(`auth:${email}`, 'authLimiter');
                    console.warn(`[AUTH] Login blocked for ${email} - rate limit exceeded`);
                    // Return null to fail auth without revealing rate limit to attacker
                    return null;
                }

                console.log('--- Login Attempt ---');
                console.log('Email:', email);
                console.log('Rate limit remaining:', rateLimitResult.remaining);

                const user = await getUser(email);
                if (!user) {
                    console.log('User NOT found in database');
                    return null;
                }

                console.log('User found. Comparing passwords...');
                const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
                console.log('Passwords match:', passwordsMatch);

                if (passwordsMatch) {
                    // Reset rate limit on successful auth
                    authLimiter.reset(`auth:${email}`);

                    // Log login activity for online status tracking (fire and forget)
                    prisma.activityLog.create({
                        data: {
                            userId: user.id,
                            action: 'LOGIN',
                            details: JSON.stringify({ timestamp: new Date().toISOString() })
                        }
                    }).then(() => {
                        console.log(`[AUTH] Login activity logged for ${email}`);
                    }).catch(err => {
                        console.error('[AUTH] Failed to log login activity:', err);
                    });

                    return user;
                }

                // Failed password - rate limit will increment on next attempt
                return null;
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger, session }) {
            if (user && user.id) {
                token.id = user.id;
                token.role = user.role;
                token.companyId = (user as any).companyId;
                token.preferences = (user as any).preferences;
                token.image = user.image; // Pass image
            }
            if (trigger === "update") {
                const freshUser = await prisma.user.findUnique({
                    where: { id: token.sub || (token.id as string) }
                });
                if (freshUser) {
                    token.name = freshUser.name;
                    token.email = freshUser.email;
                    token.image = freshUser.image;
                    token.role = freshUser.role;
                    token.companyId = freshUser.companyId;
                    token.preferences = freshUser.preferences;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.image = token.image as string;
                (session.user as any).companyId = token.companyId;
                (session.user as any).preferences = token.preferences;
            }
            return session;
        },
    }
})
