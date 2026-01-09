import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        // Use type assertion since Product model may not be generated yet
        const products = await (prisma as any).product.findMany({
            where: {
                companyId: user.companyId,
                isActive: true,
            },
            orderBy: [{ type: "asc" }, { name: "asc" }],
            select: {
                id: true,
                name: true,
                description: true,
                sku: true,
                type: true,
                category: true,
                price: true,
                taxRate: true,
                unit: true,
            },
        });

        return NextResponse.json(products);
    } catch (error: any) {
        // If Product model doesn't exist yet, return empty array
        if (error.message?.includes("product") || error.code === "P2021") {
            return NextResponse.json([]);
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
