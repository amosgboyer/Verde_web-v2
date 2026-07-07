import Image from "next/image";
import { findAddOrderContext, getProductsRows } from "@/lib/google-sheets";
import { getAvailableProducts } from "@/lib/products";
import type { Product } from "@/lib/products";
import OrderLookup from "@/components/OrderLookup";
import AddToOrder from "@/components/AddToOrder";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { codigo?: string; tel?: string; fecha?: string };
}

export default async function AnadirPage({ searchParams }: Props) {
  const { codigo, tel, fecha } = searchParams;
  const hasQuery = !!(codigo || tel);

  const ctx = hasQuery
    ? await findAddOrderContext({ code: codigo, phone: tel, date: fecha })
    : null;

  // Productos disponibles (sin packs)
  let products: Product[] = getAvailableProducts();
  try {
    const rows = await getProductsRows();
    if (rows.length > 0) {
      products = rows.map((p) => ({
        id: p.productId,
        name: p.name,
        description: p.description,
        finalPrice: p.finalPrice,
        depositAmount: p.depositAmount,
        available: p.available,
        allergens: p.allergens,
        image: p.imageUrl || undefined,
        category: p.category || undefined,
        isPack: (p.category || "").trim().toLowerCase() === "pack",
      }));
    }
  } catch {
    // respaldo estático
  }
  products = products.filter((p) => !p.isPack && p.available !== false);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-cream px-6 py-14">
      <div className="max-w-3xl mx-auto">
        <a
          href="/"
          className="inline-flex items-center gap-2 mb-12 opacity-80 hover:opacity-100 transition-opacity"
        >
          <Image src="/iconVerde.png" alt="Verde" width={32} height={32} />
          <span className="text-[0.68rem] tracking-[0.16em] uppercase text-gray">
            Verde · Madrid
          </span>
        </a>

        {!hasQuery && <OrderLookup />}
        {hasQuery && !ctx?.found && (
          <OrderLookup error="No encontramos ningún pedido con esos datos. Revísalos o escríbenos por WhatsApp." />
        )}
        {hasQuery && ctx?.found && (
          <AddToOrder
            ctx={ctx}
            products={products}
            closed={ctx.reservationDate <= today}
          />
        )}
      </div>
    </main>
  );
}
