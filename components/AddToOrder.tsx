"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import type { AddOrderContext } from "@/lib/google-sheets";

function fmtPrice(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
}

const WHATSAPP = "https://wa.me/34605442809";

export default function AddToOrder({
  ctx,
  products,
  closed,
}: {
  ctx: AddOrderContext;
  products: Product[];
  closed: boolean;
}) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceOf = (p: Product) => p.depositAmount || p.finalPrice;
  const total = useMemo(
    () =>
      products.reduce((s, p) => s + priceOf(p) * (cart[p.id] ?? 0), 0),
    [cart, products]
  );
  const count = Object.values(cart).reduce((s, q) => s + q, 0);

  function add(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }
  function remove(id: string) {
    setCart((c) => {
      const q = (c[id] ?? 0) - 1;
      if (q <= 0) {
        const { [id]: _drop, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: q };
    });
  }

  async function pay() {
    const items = Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/add-to-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: ctx.sessionId, items }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "No se pudo procesar. Inténtalo de nuevo.");
        setLoading(false);
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  const first = ctx.customerName.trim().split(/\s+/)[0] || "";

  if (closed) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h1 className="font-sans font-bold text-2xl text-negro/85 mb-3">
          Este pedido ya no admite cambios
        </h1>
        <p className="text-sm text-negro/55 mb-6 leading-relaxed">
          {first ? `${first}, tu` : "Tu"} pedido es para hoy o ya pasó, así que
          la cocina ya está en marcha. Si necesitas añadir algo, escríbenos y lo
          vemos.
        </p>
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg py-3 px-6 text-[0.72rem] font-bold tracking-[0.2em] uppercase bg-verde-bosque text-crema hover:bg-verde-platano transition-colors"
        >
          📲 Escríbenos por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <div className="mb-8">
        <p className="font-mono text-[0.62rem] tracking-[0.3em] uppercase text-verde-bosque/70 mb-2">
          Añadir a tu pedido · {ctx.orderCode}
        </p>
        <h1 className="font-sans font-bold text-2xl text-negro/85 mb-2">
          {first ? `Hola, ${first}` : "Tu pedido"} 🌱
        </h1>
        <p className="text-sm text-negro/55 leading-relaxed">
          Añade lo que quieras a tu pedido del{" "}
          <b>{ctx.reservationDate}</b>
          {ctx.reservationTime ? (
            <>
              {" "}
              a las <b>{ctx.reservationTime}</b>
            </>
          ) : null}
          . Solo pagas lo nuevo — sin cobrarte el envío otra vez.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {products.map((p) => {
          const qty = cart[p.id] ?? 0;
          return (
            <div
              key={p.id}
              className="rounded-lg border p-4 flex flex-col"
              style={{
                borderColor: qty > 0 ? "#509234" : "rgba(0,0,0,0.10)",
                background: qty > 0 ? "rgba(80,146,52,0.04)" : "#fff",
              }}
            >
              <p className="font-semibold text-sm text-negro/85 leading-snug">
                {p.name}
              </p>
              {p.description && (
                <p className="text-[11px] text-negro/45 mt-1 leading-relaxed">
                  {p.description}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono font-bold text-verde-bosque text-sm">
                  {fmtPrice(priceOf(p))} €
                </span>
                {qty > 0 ? (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="w-7 h-7 rounded-full bg-negro/10 text-negro/60 leading-none"
                      aria-label={`Quitar ${p.name}`}
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold w-4 text-center">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => add(p.id)}
                      className="w-7 h-7 rounded-full bg-verde-bosque text-crema leading-none"
                      aria-label={`Añadir ${p.name}`}
                    >
                      +
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => add(p.id)}
                    className="w-8 h-8 rounded-full bg-verde-bosque text-crema leading-none text-base font-bold hover:bg-verde-platano transition-colors"
                    aria-label={`Añadir ${p.name}`}
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-sm text-center" style={{ color: "#b4491f" }}>
          {error}
        </p>
      )}

      {/* Barra de pago fija */}
      <div className="fixed inset-x-0 bottom-0 z-40 p-4">
        <div className="max-w-3xl mx-auto">
          <button
            type="button"
            disabled={count === 0 || loading}
            onClick={pay}
            className="w-full rounded-xl py-4 px-6 text-[0.8rem] font-bold tracking-[0.1em] uppercase text-crema shadow-lg transition-colors disabled:opacity-45"
            style={{ background: "#c85a2a" }}
          >
            {loading
              ? "Redirigiendo al pago…"
              : count > 0
              ? `Pagar y añadir · ${fmtPrice(total)} €`
              : "Elige algo para añadir"}
          </button>
        </div>
      </div>
    </div>
  );
}
