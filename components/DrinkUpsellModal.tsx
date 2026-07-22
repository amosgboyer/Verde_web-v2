"use client";

import { useEffect, useState } from "react";
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
 * Popup "Completa tu pedido" al ir a pagar, POR FASES: bebidas → salsas →
 * cubiertos. Cada fase en su propia pantalla (sin scroll largo). Una sola vez
 * por sesión. Portal para no verse afectado por los transform de GSAP.
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
  // Fases activas: primero salsas + cubiertos, luego bebidas (si hay).
  const steps: ("bebidas" | "extras")[] = [];
  steps.push("extras");
  if (drinks.length > 0) steps.push("bebidas");

  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const isLast = stepIdx >= steps.length - 1;

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

  function next() {
    if (isLast) onContinue();
    else setStepIdx((i) => i + 1);
  }

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
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            className="w-12 h-12 rounded-xl object-cover shrink-0"
          />
        )}

        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold text-negro/80 leading-snug">
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

  const HEAD: Record<string, { title: string; sub: string }> = {
    extras: { title: "Salsas y cubiertos", sub: "Salsas de la casa a 1,50 € y elige si quieres cubiertos." },
    bebidas: { title: "¿Algo para beber?", sub: "Añade una bebida bien fría." },
  };

  const modal = (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-negro/55 backdrop-blur-sm px-4 py-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="extras-title"
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
            id="extras-title"
            className="font-display text-crema text-2xl sm:text-[26px] leading-tight"
          >
            {HEAD[step].title}
          </h3>
          <p className="text-crema/75 text-sm mt-2 leading-relaxed">
            {HEAD[step].sub}
          </p>

          {/* Progreso por fases */}
          {steps.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {steps.map((s, i) => (
                <span
                  key={s}
                  className="h-1.5 rounded-full transition-all duration-200"
                  style={{
                    width: i === stepIdx ? 18 : 6,
                    background:
                      i === stepIdx ? "#F5EDD8" : "rgba(245,240,232,0.4)",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Contenido de la fase ── */}
        <div className="px-4 py-4 space-y-2 max-h-[42vh] overflow-y-auto">
          {step === "bebidas" && drinks.map((d) => ItemRow(d))}
          {step === "extras" && (
            <>
              {salsas.map((s) => ItemRow(s))}
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-negro/40 px-1 pt-3">
                ¿Necesitas cubiertos?
              </p>
              <div className="flex gap-2">
                {[
                  { label: "No, gracias", value: false },
                  { label: "Sí, ponme", value: true },
                ].map((opt) => {
                  const selected = cutlery === opt.value;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => onCutleryChange(opt.value)}
                      aria-pressed={selected}
                      className="flex-1 rounded-2xl border py-3.5 text-sm font-semibold transition-colors"
                      style={
                        selected
                          ? { background: "#2E4F20", color: "#F5EDD8", borderColor: "#2E4F20" }
                          : { background: "#fff", color: "rgba(26,26,14,0.7)", borderColor: "rgba(0,0,0,0.1)" }
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Acción ── */}
        <div className="px-4 pb-5 pt-1 space-y-2">
          <button
            type="button"
            onClick={next}
            className="w-full bg-[#c85a2a] text-crema text-[11px] font-semibold tracking-[0.2em] uppercase py-4 px-6 rounded-full hover:bg-[#d96535] transition-colors"
          >
            {isLast ? "Continuar con la fecha" : "Siguiente"}
          </button>
          {!isLast && (
            <button
              type="button"
              onClick={onContinue}
              className="w-full text-center text-xs text-negro/45 hover:text-negro/70 transition-colors py-1.5"
            >
              Saltar y continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
