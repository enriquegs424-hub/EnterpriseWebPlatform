import { describe, it, expect } from "vitest";
import {
    toDecimal,
    addDecimals,
    subtractDecimals,
    multiplyDecimals,
    divideDecimals,
    roundDecimal,
    calculateTax,
    calculateLineTotal,
    calculateDocumentTotals,
    calculateBalance,
    calculateMargin,
    isZero,
    isPositive,
    isNegative,
    compareDecimals,
    Decimal,
} from "../src/lib/money";

describe("Money Utilities - Decimal Operations", () => {
    describe("toDecimal", () => {
        it("should convert string to Decimal", () => {
            const result = toDecimal("99.99");
            expect(result.toString()).toBe("99.99");
        });

        it("should convert number to Decimal", () => {
            const result = toDecimal(100);
            expect(result.toString()).toBe("100");
        });

        it("should return same Decimal if already Decimal", () => {
            const original = new Decimal("123.45");
            const result = toDecimal(original);
            expect(result.equals(original)).toBe(true);
        });
    });

    describe("addDecimals", () => {
        it("should add decimals correctly (99.99 + 0.01 = 100.00)", () => {
            const result = addDecimals("99.99", "0.01");
            expect(result.toString()).toBe("100");
        });

        it("should handle multiple values", () => {
            const result = addDecimals("10.00", "20.00", "30.00");
            expect(result.toString()).toBe("60");
        });

        it("should handle empty array", () => {
            const result = addDecimals();
            expect(result.toString()).toBe("0");
        });
    });

    describe("subtractDecimals", () => {
        it("should subtract correctly (100.00 - 0.01 = 99.99)", () => {
            const result = subtractDecimals("100.00", "0.01");
            expect(result.toString()).toBe("99.99");
        });

        it("should handle multiple subtractions", () => {
            const result = subtractDecimals("100", "20", "30");
            expect(result.toString()).toBe("50");
        });
    });

    describe("multiplyDecimals", () => {
        it("should multiply correctly (2.5 × 4 = 10)", () => {
            const result = multiplyDecimals("2.5", "4");
            expect(result.toString()).toBe("10");
        });

        it("should handle decimals (1.1 × 1.1 = 1.21)", () => {
            const result = multiplyDecimals("1.1", "1.1");
            expect(result.toString()).toBe("1.21");
        });
    });

    describe("divideDecimals", () => {
        it("should divide correctly (10 / 4 = 2.50)", () => {
            const result = divideDecimals("10", "4", 2);
            expect(result.toString()).toBe("2.5");
        });

        it("should round to specified decimals", () => {
            const result = divideDecimals("100", "3", 2);
            expect(result.toString()).toBe("33.33");
        });
    });

    describe("roundDecimal", () => {
        it("should round to 2 decimals by default", () => {
            const result = roundDecimal("99.999");
            expect(result.toString()).toBe("100");
        });

        it("should round 99.994 to 99.99", () => {
            const result = roundDecimal("99.994");
            expect(result.toString()).toBe("99.99");
        });
    });
});

describe("Money Utilities - Tax Calculations", () => {
    describe("calculateTax", () => {
        it("should calculate 21% IVA correctly", () => {
            const result = calculateTax("100", "21");
            expect(result.toString()).toBe("21");
        });

        it("should calculate 10% IVA correctly", () => {
            const result = calculateTax("100", "10");
            expect(result.toString()).toBe("10");
        });

        it("should calculate 4% IVA correctly", () => {
            const result = calculateTax("100", "4");
            expect(result.toString()).toBe("4");
        });

        it("should handle 0% IVA", () => {
            const result = calculateTax("100", "0");
            expect(result.toString()).toBe("0");
        });

        it("should round tax to 2 decimals", () => {
            // 99.99 * 21% = 20.9979 → 21.00
            const result = calculateTax("99.99", "21");
            expect(result.toString()).toBe("21");
        });
    });

    describe("calculateLineTotal", () => {
        it("should calculate line total correctly", () => {
            const result = calculateLineTotal("2", "50.00", "21");
            // subtotal: 2 × 50 = 100
            // tax: 100 × 21% = 21
            // total: 121
            expect(result.subtotal.toString()).toBe("100");
            expect(result.taxAmount.toString()).toBe("21");
            expect(result.total.toString()).toBe("121");
        });

        it("should handle fractional quantities", () => {
            const result = calculateLineTotal("1.5", "100.00", "21");
            // subtotal: 1.5 × 100 = 150
            // tax: 150 × 21% = 31.5
            // total: 181.5
            expect(result.subtotal.toString()).toBe("150");
            expect(result.taxAmount.toString()).toBe("31.5");
            expect(result.total.toString()).toBe("181.5");
        });
    });

    describe("calculateDocumentTotals", () => {
        it("should calculate document totals from multiple lines", () => {
            const lines = [
                { quantity: "2", unitPrice: "50.00", taxRate: "21" },
                { quantity: "1", unitPrice: "100.00", taxRate: "10" },
            ];
            const result = calculateDocumentTotals(lines);
            // Line 1: subtotal 100, tax 21
            // Line 2: subtotal 100, tax 10
            // Total: subtotal 200, tax 31, total 231
            expect(result.subtotal.toString()).toBe("200");
            expect(result.taxAmount.toString()).toBe("31");
            expect(result.total.toString()).toBe("231");
        });

        it("should handle empty array", () => {
            const result = calculateDocumentTotals([]);
            expect(result.subtotal.toString()).toBe("0");
            expect(result.taxAmount.toString()).toBe("0");
            expect(result.total.toString()).toBe("0");
        });
    });
});

describe("Money Utilities - Balance & Comparisons", () => {
    describe("calculateBalance", () => {
        it("should calculate balance correctly", () => {
            const result = calculateBalance("1000.00", "250.00");
            expect(result.toString()).toBe("750");
        });

        it("should return 0 when fully paid", () => {
            const result = calculateBalance("1000.00", "1000.00");
            expect(result.toString()).toBe("0");
        });
    });

    describe("calculateMargin", () => {
        it("should calculate margin correctly", () => {
            const result = calculateMargin("100", "60");
            // profit: 100 - 60 = 40
            // margin: (40 / 100) × 100 = 40%
            expect(result.profit.toString()).toBe("40");
            expect(result.margin.toString()).toBe("40");
        });

        it("should handle zero sell price", () => {
            const result = calculateMargin("0", "50");
            expect(result.margin.toString()).toBe("0");
        });
    });

    describe("comparison functions", () => {
        it("isZero should detect zero values", () => {
            expect(isZero("0")).toBe(true);
            expect(isZero("0.00")).toBe(true);
            expect(isZero("0.01")).toBe(false);
        });

        it("isPositive should detect positive values", () => {
            expect(isPositive("100")).toBe(true);
            expect(isPositive("0")).toBe(false);
            expect(isPositive("-1")).toBe(false);
        });

        it("isNegative should detect negative values", () => {
            expect(isNegative("-100")).toBe(true);
            expect(isNegative("0")).toBe(false);
            expect(isNegative("1")).toBe(false);
        });

        it("compareDecimals should compare values", () => {
            expect(compareDecimals("100", "50")).toBe(1); // 100 > 50
            expect(compareDecimals("50", "100")).toBe(-1); // 50 < 100
            expect(compareDecimals("100", "100")).toBe(0); // 100 == 100
        });
    });
});

describe("Money Utilities - Precision Edge Cases", () => {
    it("should handle the classic 0.1 + 0.2 case", () => {
        // In JavaScript: 0.1 + 0.2 = 0.30000000000000004
        // With Decimal: 0.1 + 0.2 = 0.3
        const result = addDecimals("0.1", "0.2");
        expect(result.toString()).toBe("0.3");
    });

    it("should maintain precision through multiple operations", () => {
        // Simulate invoice calculation
        const line1 = calculateLineTotal("3", "33.33", "21");
        const line2 = calculateLineTotal("2", "25.00", "21");

        const lines = [
            { quantity: "3", unitPrice: "33.33", taxRate: "21" },
            { quantity: "2", unitPrice: "25.00", taxRate: "21" },
        ];
        const totals = calculateDocumentTotals(lines);

        // Verify deterministic results
        expect(totals.subtotal.toString()).toBe("149.99");
    });

    it("should handle very small amounts", () => {
        const result = addDecimals("0.01", "0.01");
        expect(result.toString()).toBe("0.02");
    });

    it("should handle large amounts", () => {
        const result = addDecimals("999999999.99", "0.01");
        expect(result.toString()).toBe("1000000000");
    });
});
