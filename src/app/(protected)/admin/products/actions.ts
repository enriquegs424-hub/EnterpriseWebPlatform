"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, getUserCompanyId } from "@/lib/auth-helpers";
import { checkPermission, auditCrud } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

// NOTE: After adding Product and TaxRate models to schema.prisma,
// run: npx prisma generate && npx prisma db push

// Type definitions for models not yet in Prisma client
interface ProductData {
    id?: string;
    name: string;
    description?: string | null;
    sku?: string | null;
    type: "PRODUCT" | "SERVICE";
    category?: string | null;
    price: number;
    cost?: number | null;
    taxRate: number;
    unit?: string;
    isActive?: boolean;
    companyId?: string;
}

// ============================================
// PRODUCTS CRUD
// ============================================

export async function getProducts(includeInactive = false) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("settings", "read");

    // Use type assertion since Product model may not be generated yet
    const products = await (prisma as any).product.findMany({
        where: {
            companyId: user.companyId,
            ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: [
            { type: "asc" },
            { name: "asc" },
        ],
    });

    return products;
}

export async function getProduct(id: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("settings", "read");

    const product = await (prisma as any).product.findUnique({
        where: { id },
    });

    if (!product || product.companyId !== user.companyId) {
        throw new Error("Producto no encontrado");
    }

    return product;
}

export async function createProduct(data: {
    name: string;
    description?: string;
    sku?: string;
    type: "PRODUCT" | "SERVICE";
    category?: string;
    price: number;
    cost?: number;
    taxRate: number;
    unit?: string;
}) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("settings", "create");

    // Check for duplicate SKU
    if (data.sku) {
        const existing = await (prisma as any).product.findFirst({
            where: {
                companyId: user.companyId,
                sku: data.sku,
            },
        });
        if (existing) {
            throw new Error("Ya existe un producto con ese código SKU");
        }
    }

    const product = await (prisma as any).product.create({
        data: {
            ...data,
            companyId: user.companyId,
            isActive: true,
        },
    });

    await auditCrud("CREATE", "Product", product.id, product);
    revalidatePath("/admin/products");

    return product;
}

export async function updateProduct(
    id: string,
    data: {
        name?: string;
        description?: string;
        sku?: string;
        type?: "PRODUCT" | "SERVICE";
        category?: string;
        price?: number;
        cost?: number;
        taxRate?: number;
        unit?: string;
        isActive?: boolean;
    }
) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("settings", "update");

    const product = await (prisma as any).product.findUnique({
        where: { id },
    });

    if (!product || product.companyId !== user.companyId) {
        throw new Error("Producto no encontrado");
    }

    // Check for duplicate SKU if changing
    if (data.sku && data.sku !== product.sku) {
        const existing = await (prisma as any).product.findFirst({
            where: {
                companyId: user.companyId,
                sku: data.sku,
                id: { not: id },
            },
        });
        if (existing) {
            throw new Error("Ya existe un producto con ese código SKU");
        }
    }

    const updated = await (prisma as any).product.update({
        where: { id },
        data,
    });

    await auditCrud("UPDATE", "Product", id, { before: product, after: updated });
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);

    return updated;
}

export async function deleteProduct(id: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("settings", "delete");

    const product = await (prisma as any).product.findUnique({
        where: { id },
    });

    if (!product || product.companyId !== user.companyId) {
        throw new Error("Producto no encontrado");
    }

    // Soft delete - mark as inactive
    await (prisma as any).product.update({
        where: { id },
        data: { isActive: false },
    });

    await auditCrud("DELETE", "Product", id, product);
    revalidatePath("/admin/products");

    return { success: true };
}

export async function getProductStats() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("settings", "read");

    const [total, products, services, inactive] = await Promise.all([
        (prisma as any).product.count({
            where: { companyId: user.companyId, isActive: true },
        }),
        (prisma as any).product.count({
            where: { companyId: user.companyId, type: "PRODUCT", isActive: true },
        }),
        (prisma as any).product.count({
            where: { companyId: user.companyId, type: "SERVICE", isActive: true },
        }),
        (prisma as any).product.count({
            where: { companyId: user.companyId, isActive: false },
        }),
    ]);

    return { total, products, services, inactive };
}

// ============================================
// TAX RATES CRUD
// ============================================

export async function getTaxRates() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("settings", "read");

    const taxRates = await (prisma as any).taxRate.findMany({
        where: {
            companyId: user.companyId,
            isActive: true,
        },
        orderBy: { rate: "desc" },
    });

    return taxRates;
}

export async function createTaxRate(data: {
    name: string;
    rate: number;
    description?: string;
    isDefault?: boolean;
}) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("settings", "create");

    // If setting as default, unset others
    if (data.isDefault) {
        await (prisma as any).taxRate.updateMany({
            where: { companyId: user.companyId, isDefault: true },
            data: { isDefault: false },
        });
    }

    const taxRate = await (prisma as any).taxRate.create({
        data: {
            ...data,
            companyId: user.companyId,
            isActive: true,
        },
    });

    await auditCrud("CREATE", "TaxRate", taxRate.id, taxRate);
    revalidatePath("/admin/taxes");

    return taxRate;
}

export async function updateTaxRate(
    id: string,
    data: {
        name?: string;
        rate?: number;
        description?: string;
        isDefault?: boolean;
        isActive?: boolean;
    }
) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("settings", "update");

    const taxRate = await (prisma as any).taxRate.findUnique({
        where: { id },
    });

    if (!taxRate || taxRate.companyId !== user.companyId) {
        throw new Error("Tipo de IVA no encontrado");
    }

    // If setting as default, unset others
    if (data.isDefault) {
        await (prisma as any).taxRate.updateMany({
            where: { companyId: user.companyId, isDefault: true, id: { not: id } },
            data: { isDefault: false },
        });
    }

    const updated = await (prisma as any).taxRate.update({
        where: { id },
        data,
    });

    await auditCrud("UPDATE", "TaxRate", id, { before: taxRate, after: updated });
    revalidatePath("/admin/taxes");

    return updated;
}

export async function deleteTaxRate(id: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("settings", "delete");

    const taxRate = await (prisma as any).taxRate.findUnique({
        where: { id },
    });

    if (!taxRate || taxRate.companyId !== user.companyId) {
        throw new Error("Tipo de IVA no encontrado");
    }

    // Soft delete
    await (prisma as any).taxRate.update({
        where: { id },
        data: { isActive: false },
    });

    await auditCrud("DELETE", "TaxRate", id, taxRate);
    revalidatePath("/admin/taxes");

    return { success: true };
}
