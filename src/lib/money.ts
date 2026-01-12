/**
 * Money Utilities - Operaciones deterministas con Decimal
 * 
 * REGLA: Nunca usar Float para dinero.
 * Todas las operaciones financieras deben usar estas funciones.
 */

import { Decimal } from "@prisma/client/runtime/library";

// Re-export Decimal for convenience
export { Decimal };

/**
 * Crear un Decimal desde string, number o Decimal
 * Siempre usa string para evitar errores de precisión
 */
export function toDecimal(value: string | number | Decimal): Decimal {
    if (value instanceof Decimal) {
        return value;
    }
    // Convertir a string primero para evitar errores de Float
    return new Decimal(String(value));
}

/**
 * Suma de valores decimales
 */
export function addDecimals(...values: (string | number | Decimal)[]): Decimal {
    return values.reduce(
        (acc, val) => toDecimal(acc).add(toDecimal(val)),
        new Decimal(0)
    ) as Decimal;
}

/**
 * Resta de valores decimales (a - b - c - ...)
 */
export function subtractDecimals(
    first: string | number | Decimal,
    ...rest: (string | number | Decimal)[]
): Decimal {
    return rest.reduce(
        (acc, val) => toDecimal(acc).sub(toDecimal(val)),
        toDecimal(first)
    ) as Decimal;
}

/**
 * Multiplicación decimal
 */
export function multiplyDecimals(
    a: string | number | Decimal,
    b: string | number | Decimal
): Decimal {
    return toDecimal(a).mul(toDecimal(b));
}

/**
 * División decimal con precisión
 */
export function divideDecimals(
    a: string | number | Decimal,
    b: string | number | Decimal,
    decimalPlaces: number = 2
): Decimal {
    return toDecimal(a).div(toDecimal(b)).toDecimalPlaces(decimalPlaces);
}

/**
 * Redondear a N decimales (HALF_UP por defecto en Prisma Decimal)
 */
export function roundDecimal(
    value: string | number | Decimal,
    decimalPlaces: number = 2
): Decimal {
    return toDecimal(value).toDecimalPlaces(decimalPlaces);
}

/**
 * Calcular impuesto sobre un importe
 * @param amount - Importe base
 * @param taxRate - Porcentaje de impuesto (ej: 21 para 21%)
 * @returns Importe del impuesto redondeado a 2 decimales
 */
export function calculateTax(
    amount: string | number | Decimal,
    taxRate: string | number | Decimal
): Decimal {
    const base = toDecimal(amount);
    const rate = toDecimal(taxRate);
    // tax = amount * (taxRate / 100)
    return base.mul(rate).div(100).toDecimalPlaces(2);
}

/**
 * Calcular subtotal de línea (cantidad × precio)
 */
export function calculateLineSubtotal(
    quantity: string | number | Decimal,
    unitPrice: string | number | Decimal
): Decimal {
    return multiplyDecimals(quantity, unitPrice).toDecimalPlaces(2);
}

/**
 * Calcular total de línea (subtotal + impuesto)
 */
export function calculateLineTotal(
    quantity: string | number | Decimal,
    unitPrice: string | number | Decimal,
    taxRate: string | number | Decimal
): { subtotal: Decimal; taxAmount: Decimal; total: Decimal } {
    const subtotal = calculateLineSubtotal(quantity, unitPrice);
    const taxAmount = calculateTax(subtotal, taxRate);
    const total = addDecimals(subtotal, taxAmount);

    return {
        subtotal: roundDecimal(subtotal, 2),
        taxAmount: roundDecimal(taxAmount, 2),
        total: roundDecimal(total, 2),
    };
}

/**
 * Calcular totales de documento (suma de líneas)
 */
export function calculateDocumentTotals(
    lines: Array<{
        quantity: string | number | Decimal;
        unitPrice: string | number | Decimal;
        taxRate: string | number | Decimal;
    }>
): { subtotal: Decimal; taxAmount: Decimal; total: Decimal } {
    let subtotal = new Decimal(0);
    let taxAmount = new Decimal(0);

    for (const line of lines) {
        const lineCalc = calculateLineTotal(line.quantity, line.unitPrice, line.taxRate);
        subtotal = subtotal.add(lineCalc.subtotal);
        taxAmount = taxAmount.add(lineCalc.taxAmount);
    }

    const total = subtotal.add(taxAmount);

    return {
        subtotal: roundDecimal(subtotal, 2),
        taxAmount: roundDecimal(taxAmount, 2),
        total: roundDecimal(total, 2),
    };
}

/**
 * Comparar decimales
 */
export function compareDecimals(
    a: string | number | Decimal,
    b: string | number | Decimal
): number {
    return toDecimal(a).cmp(toDecimal(b));
}

/**
 * Verificar si un decimal es cero
 */
export function isZero(value: string | number | Decimal): boolean {
    return toDecimal(value).isZero();
}

/**
 * Verificar si un decimal es positivo
 */
export function isPositive(value: string | number | Decimal): boolean {
    return toDecimal(value).greaterThan(0);
}

/**
 * Verificar si un decimal es negativo
 */
export function isNegative(value: string | number | Decimal): boolean {
    return toDecimal(value).lessThan(0);
}

/**
 * Convertir Decimal a number (solo para display, nunca para cálculos)
 */
export function toNumber(value: string | number | Decimal): number {
    return toDecimal(value).toNumber();
}

/**
 * Convertir Decimal a string (para forms y serialización)
 */
export function toString(value: string | number | Decimal): string {
    return toDecimal(value).toString();
}

/**
 * Calcular margen/beneficio
 * @param sellPrice - Precio de venta
 * @param costPrice - Precio de coste
 * @returns { margin: Decimal (%), profit: Decimal (absoluto) }
 */
export function calculateMargin(
    sellPrice: string | number | Decimal,
    costPrice: string | number | Decimal
): { margin: Decimal; profit: Decimal } {
    const sell = toDecimal(sellPrice);
    const cost = toDecimal(costPrice);
    const profit = sell.sub(cost);

    // margin = (profit / sellPrice) * 100
    const margin = sell.isZero()
        ? new Decimal(0)
        : profit.div(sell).mul(100).toDecimalPlaces(2);

    return {
        margin,
        profit: roundDecimal(profit, 2),
    };
}

/**
 * Calcular balance pendiente
 */
export function calculateBalance(
    total: string | number | Decimal,
    paidAmount: string | number | Decimal
): Decimal {
    return roundDecimal(subtractDecimals(total, paidAmount), 2);
}
