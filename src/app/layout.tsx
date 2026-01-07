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
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans antialiased bg-neutral-50 text-neutral-900`}
      >
        <LocaleProvider initialLocale={language} initialTimeZone={timezone}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
