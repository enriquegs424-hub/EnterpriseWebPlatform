import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        // Use type assertion since TaxRate model may not be generated yet
        let taxRates: any[] = [];
        try {
            taxRates = await (prisma as any).taxRate.findMany({
                where: {
                    companyId: user.companyId,
                    isActive: true,
                },
                orderBy: { rate: "desc" },
                select: {
                    id: true,
                    name: true,
                    rate: true,
                    isDefault: true,
                },
            });
        } catch {
            // TaxRate model doesn't exist yet, will use defaults
        }

        // If no custom tax rates, return defaults
        if (taxRates.length === 0) {
            return NextResponse.json([
                { id: "default-21", name: "IVA General", rate: 21, isDefault: true },
                { id: "default-10", name: "IVA Reducido", rate: 10, isDefault: false },
                { id: "default-4", name: "IVA Superreducido", rate: 4, isDefault: false },
                { id: "default-0", name: "Exento", rate: 0, isDefault: false },
            ]);
        }

        return NextResponse.json(taxRates);
    } catch (error: any) {
        // Return defaults on any error
        return NextResponse.json([
            { id: "default-21", name: "IVA General", rate: 21, isDefault: true },
            { id: "default-10", name: "IVA Reducido", rate: 10, isDefault: false },
            { id: "default-4", name: "IVA Superreducido", rate: 4, isDefault: false },
            { id: "default-0", name: "Exento", rate: 0, isDefault: false },
        ]);
    }
}
