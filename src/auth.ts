import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "./lib/prisma"
import { authConfig } from "./auth.config"

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
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    console.log('--- Login Attempt ---');
                    console.log('Email:', email);
                    const user = await getUser(email);
                    if (!user) {
                        console.log('User NOT found in database');
                        return null;
                    }
                    console.log('User found. Comparing passwords...');
                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
                    console.log('Passwords match:', passwordsMatch);
                    if (passwordsMatch) return user;
                }
                return null;
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user }) {
            if (user && user.id) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        },
    }
})
