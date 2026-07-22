"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/lib/products";
import { imageForProduct } from "@/lib/products";

// Precio en formato español: entero "10", decimal "2,20".
function fmtPrice(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
}

interface DrinkUpsellModalProps {
  drinks: Product[];
  salsas: Product[];
  cart: Record<string, number>;
  cutlery: boolean;
  onCutleryChange: (value: boolean) => void;
  onAdd: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  /** Cierra el popup y avanza al siguiente paso (marca como visto). */
  onContinue: () => void;
}

/**
 * Popup "Completa tu pedido" al ir a pagar: bebidas + salsas extra + cubiertos.
 * Aparece una sola vez por sesión. Se renderiza en un portal para no verse
 * afectado por los transform de GSAP.
 */
export default function DrinkUpsellModal({
  drinks,
  salsas,
  cart,
  cutlery,
  onCutleryChange,
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

  const extrasInCart =
    [...drinks, ...salsas].reduce((s, p) => s + (cart[p.id] ?? 0), 0);

  function ItemRow(item: Product) {
    const qty = cart[item.id] ?? 0;
    const price = item.depositAmount || item.finalPrice;
    const active = qty > 0;
    const img = imageForProduct(item);
    return (
      <div
        key={item.id}
        className="flex items-center gap-3 rounded-2xl border bg-white p-2.5 pr-3 transition-colors"
        style={{ borderColor: active ? "#509234" : "rgba(0,0,0,0.10)" }}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            className="w-12 h-12 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-verde-bosque/8 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-negro/80 leading-snug truncate">
            {item.name}
          </p>
          <p className="text-sm font-semibold text-verde-bosque">
            {fmtPrice(price)} €
          </p>
        </div>

        {active ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onDecrement(item.id)}
              className="w-8 h-8 rounded-full bg-negro/10 text-negro/60 leading-none text-lg"
              aria-label={`Quitar ${item.name}`}
            >
              −
            </button>
            <span className="text-sm font-bold w-5 text-center tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => onIncrement(item.id)}
              className="w-8 h-8 rounded-full bg-verde-bosque text-crema leading-none text-lg hover:bg-verde-platano transition-colors"
              aria-label={`Añadir otro ${item.name}`}
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(item.id)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-verde-bosque text-crema text-xs font-semibold uppercase tracking-wider pl-3.5 pr-4 py-2.5 hover:bg-verde-platano transition-colors"
            aria-label={`Añadir ${item.name}`}
          >
            <span className="text-base leading-none">+</span> Añadir
          </button>
        )}
      </div>
    );
  }

  const sectionLabel = (t: string) => (
    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-negro/40 px-1 pt-1">
      {t}
    </p>
  );

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
        {/* ── Cabecera ── */}
        <div
          className="relative px-6 pt-8 pb-6 text-center"
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
          <h3
            id="drink-upsell-title"
            className="font-display text-crema text-2xl sm:text-[26px] leading-tight"
          >
            ¿Completas tu pedido?
          </h3>
          <p className="text-crema/75 text-sm mt-2 leading-relaxed">
            Bebidas, salsas y cubiertos. Se añaden en un toque.
          </p>
        </div>

        {/* ── Extras (scroll) ── */}
        <div className="px-4 py-3 space-y-2 max-h-[42vh] overflow-y-auto">
          {drinks.length > 0 && (
            <>
              {sectionLabel("Bebidas")}
              {drinks.map((d) => ItemRow(d))}
            </>
          )}
          {salsas.length > 0 && (
            <>
              {sectionLabel("Salsas")}
              {salsas.map((s) => ItemRow(s))}
            </>
          )}
        </div>

        {/* ── Cubiertos ── */}
        <div className="px-4 pb-1">
          <div
            className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-3"
            style={{ borderColor: "rgba(0,0,0,0.10)" }}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-negro/80">
                ¿Necesitas cubiertos?
              </p>
              <p className="text-xs text-negro/45">Gratis. Si no, evitamos plástico.</p>
            </div>
            <div
              className="flex gap-1 p-0.5 rounded-full shrink-0"
              style={{ background: "rgba(0,0,0,0.06)" }}
            >
              {[
                { label: "No", value: false },
                { label: "Sí", value: true },
              ].map((opt) => {
                const selected = cutlery === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onCutleryChange(opt.value)}
                    aria-pressed={selected}
                    className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
                    style={
                      selected
                        ? { background: "#2E4F20", color: "#F5EDD8" }
                        : { background: "transparent", color: "rgba(26,26,14,0.5)" }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Acción ── */}
        <div className="px-4 pb-5 pt-2">
          <button
            type="button"
            onClick={onContinue}
            className="w-full bg-[#c85a2a] text-crema text-[11px] font-semibold tracking-[0.2em] uppercase py-4 px-6 rounded-full hover:bg-[#d96535] transition-colors"
          >
            {extrasInCart > 0 ? "Perfecto, continuar" : "Continuar con la fecha"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
