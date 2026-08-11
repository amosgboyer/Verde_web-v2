import { NextResponse } from "next/server";
import { getProductsRows } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  const isDev = process.env.NODE_ENV === "development";

  try {
    const rows = await getProductsRows();

    const products = rows.map((p) => ({
      productId: p.productId,
      name: p.name,
      finalPrice: p.finalPrice,
      depositAmount: p.depositAmount,
      pendingAmount: +(p.finalPrice - p.depositAmount).toFixed(2),
      pricesMatch: p.finalPrice === p.depositAmount,
      available: p.available,
      category: p.category,
      // Cómo queda el array de alérgenos tras parsear la celda. Importa que
      // sean elementos SUELTOS: si sale uno solo con todo dentro, el aviso de
      // alergias del checkout no puede casar nada.
      allergens: p.allergens,
      allergensCount: p.allergens.length,
      // rawRow only in development — never exposes credentials or customer data
      ...(isDev && {
        _raw: {
          finalPrice: String(p.finalPrice),
          depositAmount: String(p.depositAmount),
          category: p.category,
        },
      }),
    }));

    const allOk = products.every((p) => p.pricesMatch && p.finalPrice > 0);

    return NextResponse.json({
      ok: true,
      allPricesOk: allOk,
      count: products.length,
      env: process.env.NODE_ENV,
      note: "Solo muestra productos con available=TRUE. Para cobro completo: depositAmount debe ser igual a finalPrice y ambos > 0.",
      products,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        ...(isDev && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}
