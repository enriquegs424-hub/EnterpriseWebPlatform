import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MEP Projects - Gestión de Horas",
  description: "Sistema avanzado de control de tiempos y gestión de proyectos",
};

import { auth } from "@/auth";
import { LocaleProvider } from "@/providers/LocaleContext";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";

// Script to prevent flash of unstyled content
const themeInitScript = `
  (function() {
    try {
      const theme = localStorage.getItem('vite-ui-theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const preferences = (session?.user as any)?.preferences as any;
  const language = preferences?.language || 'es';
  const timezone = preferences?.timezone || 'Europe/Madrid';

  return (
    <html lang={language} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans antialiased bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50`}
      >
        <LocaleProvider initialLocale={language} initialTimeZone={timezone}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

