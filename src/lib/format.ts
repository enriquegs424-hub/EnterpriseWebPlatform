/**
 * Format Utilities - Formateo consistente para display
 * 
 * Estas funciones son SOLO para mostrar datos, nunca para cálculos.
 */

import { Decimal } from "@prisma/client/runtime/library";

/**
 * Formatear dinero para display
 * @param value - Valor a formatear (Decimal, number o string)
 * @param currency - Código de moneda (default: EUR)
 * @param locale - Locale para formato (default: es-ES)
 */
export function formatMoney(
    value: Decimal | number | string | null | undefined,
    currency: string = "EUR",
    locale: string = "es-ES"
): string {
    if (value === null || value === undefined) {
        return formatMoney(0, currency, locale);
    }

    const numValue = typeof value === "object" && value instanceof Decimal
        ? value.toNumber()
        : typeof value === "string"
            ? parseFloat(value)
            : value;

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numValue);
}

/**
 * Formatear porcentaje para display
 * @param value - Valor del porcentaje (ej: 21 para 21%)
 * @param decimals - Decimales a mostrar
 */
export function formatPercent(
    value: Decimal | number | string | null | undefined,
    decimals: number = 0
): string {
    if (value === null || value === undefined) {
        return "0%";
    }

    const numValue = typeof value === "object" && value instanceof Decimal
        ? value.toNumber()
        : typeof value === "string"
            ? parseFloat(value)
            : value;

    return `${numValue.toFixed(decimals)}%`;
}

/**
 * Formatear número para display
 */
export function formatNumber(
    value: Decimal | number | string | null | undefined,
    decimals: number = 2,
    locale: string = "es-ES"
): string {
    if (value === null || value === undefined) {
        return "0";
    }

    const numValue = typeof value === "object" && value instanceof Decimal
        ? value.toNumber()
        : typeof value === "string"
            ? parseFloat(value)
            : value;

    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(numValue);
}

/**
 * Parsear string de dinero a Decimal (para forms)
 * Acepta formatos: "1.234,56" (ES) o "1,234.56" (EN)
 */
export function parseMoney(value: string): Decimal {
    // Limpiar espacios
    let clean = value.trim();

    // Detectar formato español (punto como separador de miles, coma como decimal)
    if (clean.includes(",") && clean.indexOf(",") > clean.indexOf(".")) {
        // Formato español: 1.234,56
        clean = clean.replace(/\./g, "").replace(",", ".");
    } else if (clean.includes(",") && !clean.includes(".")) {
        // Solo coma, probablemente decimal: 1234,56
        clean = clean.replace(",", ".");
    } else {
        // Formato inglés o sin separadores: 1,234.56 o 1234.56
        clean = clean.replace(/,/g, "");
    }

    // Remover símbolos de moneda
    clean = clean.replace(/[€$£¥]/g, "").trim();

    const parsed = parseFloat(clean);
    if (isNaN(parsed)) {
        return new Decimal(0);
    }

    return new Decimal(parsed.toFixed(2));
}

/**
 * Parsear string de porcentaje a Decimal
 */
export function parsePercent(value: string): Decimal {
    const clean = value.replace("%", "").trim().replace(",", ".");
    const parsed = parseFloat(clean);

    if (isNaN(parsed)) {
        return new Decimal(0);
    }

    return new Decimal(parsed.toFixed(2));
}

/**
 * Parsear cantidad/quantity a Decimal
 */
export function parseQuantity(value: string): Decimal {
    const clean = value.trim().replace(",", ".");
    const parsed = parseFloat(clean);

    if (isNaN(parsed) || parsed < 0) {
        return new Decimal(0);
    }

    return new Decimal(parsed.toFixed(2));
}

/**
 * Formatear fecha para display
 */
export function formatDate(
    date: Date | string | null | undefined,
    options?: Intl.DateTimeFormatOptions
): string {
    if (!date) return "-";

    const dateObj = typeof date === "string" ? new Date(date) : date;

    return dateObj.toLocaleDateString("es-ES", options || {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

/**
 * Formatear fecha y hora
 */
export function formatDateTime(
    date: Date | string | null | undefined
): string {
    if (!date) return "-";

    const dateObj = typeof date === "string" ? new Date(date) : date;

    return dateObj.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Formatear tiempo relativo ("hace 2 horas")
 */
export function formatRelativeTime(
    date: Date | string | null | undefined
): string {
    if (!date) return "-";

    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "ahora mismo";
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays} días`;

    return formatDate(dateObj);
}

/**
 * Formatear número de documento (invoice, quote, etc.)
 */
export function formatDocumentNumber(
    prefix: string,
    year: number,
    sequence: number,
    padding: number = 4
): string {
    return `${prefix}-${year}-${String(sequence).padStart(padding, "0")}`;
}
