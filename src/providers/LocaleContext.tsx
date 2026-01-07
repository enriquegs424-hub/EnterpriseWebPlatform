'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { enUS, es, fr, de, it } from 'date-fns/locale';
import { Locale } from 'date-fns';

type LocaleContextType = {
    locale: Locale;
    localeCode: string;
    setLocaleCode: (code: string) => void;
    timeZone: string;
    setTimeZone: (tz: string) => void;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const locales: Record<string, Locale> = {
    'en': enUS,
    'es': es,
    'fr': fr,
    'de': de,
    'it': it
};

export function LocaleProvider({
    children,
    initialLocale = 'es',
    initialTimeZone = 'Europe/Madrid'
}: {
    children: React.ReactNode;
    initialLocale?: string;
    initialTimeZone?: string;
}) {
    const [localeCode, setLocaleCode] = useState(initialLocale);
    const [timeZone, setTimeZone] = useState(initialTimeZone);
    const [locale, setLocale] = useState<Locale>(locales[initialLocale] || es);

    useEffect(() => {
        setLocale(locales[localeCode] || es);
    }, [localeCode]);

    return (
        <LocaleContext.Provider value={{ locale, localeCode, setLocaleCode, timeZone, setTimeZone }}>
            {children}
        </LocaleContext.Provider>
    );
}

export function useAppLocale() {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error('useAppLocale must be used within a LocaleProvider');
    }
    return context;
}
