import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    providers: [],
    callbacks: {
        authorized({ auth, request: { nextUrl } }: { auth: any, request: { nextUrl: any } }) {
            const isLoggedIn = !!auth?.user;
            const isOnProtected = nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/hours') ||
                nextUrl.pathname.startsWith('/admin');

            console.log(`[Proxy] Path: ${nextUrl.pathname}, LoggedIn: ${isLoggedIn}`);

            if (isOnProtected) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }
            return true;
        },
    },
} satisfies NextAuthConfig;
