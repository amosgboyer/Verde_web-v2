"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/lib/products";

// Precio en formato español: entero "10", decimal "2,20".
function fmtPrice(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
}

interface DrinkUpsellModalProps {
  drinks: Product[];
  cart: Record<string, number>;
  onAdd: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  /** Cierra el popup y avanza al siguiente paso (marca como visto). */
  onContinue: () => void;
}

/**
 * Popup de venta de bebidas que aparece al terminar de elegir la comida.
 * Aparece una sola vez por sesión y solo si el cliente aún no lleva bebida.
 * Se renderiza en un portal para no verse afectado por los transform de GSAP.
 */
export default function DrinkUpsellModal({
  drinks,
  cart,
  onAdd,
  onIncrement,
  onDecrement,
  onContinue,
}: DrinkUpsellModalProps) {
  // Cerrar con Escape + bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onContinue();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onContinue]);

  const drinksInCart = drinks.reduce((s, d) => s + (cart[d.id] ?? 0), 0);

  const modal = (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-negro/55 backdrop-blur-sm px-4 py-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drink-upsell-title"
      onClick={onContinue}
    >
      <div
        className="w-full max-w-md bg-crema rounded-t-[28px] sm:rounded-[28px] shadow-verde-lg overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Cabecera apetitosa ── */}
        <div
          className="relative px-6 pt-8 pb-7 text-center"
          style={{ background: "linear-gradient(135deg, #2E4F20 0%, #509234 100%)" }}
        >
          <button
            type="button"
            onClick={onContinue}
            aria-label="Cerrar"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-crema/15 text-crema/80 hover:bg-crema/25 transition-colors leading-none text-lg"
          >
            ×
          </button>
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-crema/15 flex items-center justify-center text-3xl">
            🧊
          </div>
          <h3
            id="drink-upsell-title"
            className="font-display text-crema text-2xl sm:text-[26px] leading-tight"
          >
            ¿Le ponemos algo de beber?
          </h3>
          <p className="text-crema/75 text-sm mt-2 leading-relaxed">
            Acompaña tu pedido con una bebida bien fría. Se añade en un toque.
          </p>
        </div>

        {/* ── Bebidas ── */}
        <div className="px-4 py-4 space-y-2.5 max-h-[42vh] overflow-y-auto">
          {drinks.map((d) => {
            const qty = cart[d.id] ?? 0;
            const price = d.depositAmount || d.finalPrice;
            const active = qty > 0;
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-2xl border bg-white p-2.5 pr-3 transition-colors"
                style={{ borderColor: active ? "#509234" : "rgba(0,0,0,0.10)" }}
              >
                {d.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.image}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-verde-bosque/8 flex items-center justify-center text-xl shrink-0">
                    🥤
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-negro/80 leading-snug truncate">
                    {d.name}
                  </p>
                  <p className="text-sm font-semibold text-verde-bosque">
                    {fmtPrice(price)} €
                  </p>
                </div>

                {active ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDecrement(d.id)}
                      className="w-8 h-8 rounded-full bg-negro/10 text-negro/60 leading-none text-lg"
                      aria-label={`Quitar ${d.name}`}
                    >
                      −
                    </button>
                    <span className="text-sm font-bold w-5 text-center tabular-nums">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrement(d.id)}
                      className="w-8 h-8 rounded-full bg-verde-bosque text-crema leading-none text-lg hover:bg-verde-platano transition-colors"
                      aria-label={`Añadir otro ${d.name}`}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAdd(d.id)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-verde-bosque text-crema text-xs font-semibold uppercase tracking-wider pl-3.5 pr-4 py-2.5 hover:bg-verde-platano transition-colors"
                    aria-label={`Añadir ${d.name}`}
                  >
                    <span className="text-base leading-none">+</span> Añadir
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Acciones ── */}
        <div className="px-4 pb-5 pt-1 space-y-2">
          <button
            type="button"
            onClick={onContinue}
            className="w-full bg-[#c85a2a] text-crema text-[11px] font-semibold tracking-[0.2em] uppercase py-4 px-6 rounded-full hover:bg-[#d96535] transition-colors"
          >
            {drinksInCart > 0 ? "Perfecto, continuar" : "Continuar con la fecha"}
          </button>
          {drinksInCart === 0 && (
            <button
              type="button"
              onClick={onContinue}
              className="w-full text-center text-xs text-negro/45 hover:text-negro/70 transition-colors py-2"
            >
              No, gracias · seguir sin bebida
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
