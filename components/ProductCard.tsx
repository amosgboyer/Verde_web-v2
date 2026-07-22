"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import clsx from "clsx";

// Precio en formato español: entero "10", decimal "2,20".
function fmtPrice(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
}

export interface SizeOption {
  label: string;
  product: Product;
}

interface ProductCardProps {
  product: Product;
  quantity: number;
  maxQuantity: number;
  onAdd: (productId: string) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  offerBadge?: string;
  // Selector de tamaño: si se pasa, la card muestra un toggle (p.ej. Entera/Media)
  // y los controles operan sobre el producto del tamaño elegido. Cada tamaño es un
  // producto real de la carta (mismo id/precio del Sheet).
  sizeOptions?: SizeOption[];
  quantityOf?: (productId: string) => number;
  // Extras del plato: productos que se añaden como pulsable dentro de esta card
  // (p.ej. reahogado para el corviche). Cada extra es un producto real del Sheet.
  addons?: { label: string; product: Product }[];
}

export default function ProductCard({
  product, quantity, maxQuantity, onAdd, onIncrement, onDecrement, offerBadge,
  sizeOptions, quantityOf, addons,
}: ProductCardProps) {
  const hasSizes = !!sizeOptions && sizeOptions.length > 1;
  const [sizeIdx, setSizeIdx] = useState(0);

  // Producto "activo" = el del tamaño seleccionado (o el propio si no hay tamaños).
  const active = hasSizes ? sizeOptions![sizeIdx].product : product;
  const qty = hasSizes ? (quantityOf?.(active.id) ?? 0) : quantity;
  const inCart = qty > 0;

  return (
    <div
      className={clsx(
        "relative rounded-[14px] overflow-hidden transition-all duration-200 cursor-pointer",
        "hover:-translate-y-[3px] hover:shadow-verde",
        !active.available && "opacity-40"
      )}
      style={{
        background: "#e8ddc4",
        border: offerBadge
          ? "1.5px solid var(--terra, #c85a2a)"
          : inCart
          ? "1.5px solid var(--g2, #4a7c2f)"
          : "1px solid var(--border, rgba(44,90,27,0.13))",
      }}
    >
      {/* Cinta de oferta (Sweet Weekend) */}
      {offerBadge && (
        <div
          className="absolute top-0 right-0 z-10 text-white text-[9px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-bl-[10px]"
          style={{ background: "var(--terra, #c85a2a)" }}
        >
          {offerBadge}
        </div>
      )}

      {/* Body */}
      <div className="p-[0.95rem_1.05rem_1.05rem]" style={{ padding: "0.95rem 1.05rem 1.05rem" }}>
        <h3
          className="font-medium mb-1"
          style={{
            fontSize: "0.95rem",
            color: "var(--dark, #1a1a0e)",
          }}
        >
          {product.name}
        </h3>
        <p
          className="leading-relaxed mb-2"
          style={{
            fontSize: "0.76rem",
            color: "var(--gray, #6e6e5a)",
            minHeight: "44px",
          }}
        >
          {product.description}
        </p>
        {product.allergens && product.allergens.length > 0 && (
          <p
            className="uppercase tracking-[0.05em] mb-3"
            style={{
              fontSize: "0.63rem",
              color: "var(--lgray, #a8a892)",
            }}
          >
            Contiene: {product.allergens.join(", ")}
          </p>
        )}

        {/* Selector de tamaño (Entera / Media) */}
        {hasSizes && (
          <div
            className="flex gap-1 mb-3 p-0.5 rounded-lg"
            style={{ background: "rgba(44,90,27,0.06)" }}
            role="group"
            aria-label="Elige el tamaño"
          >
            {sizeOptions!.map((opt, i) => {
              const selected = i === sizeIdx;
              return (
                <button
                  key={opt.product.id}
                  type="button"
                  onClick={() => setSizeIdx(i)}
                  aria-pressed={selected}
                  className="flex-1 rounded-md py-1 text-[0.7rem] font-semibold transition-colors duration-150"
                  style={
                    selected
                      ? { background: "var(--g1, #2d5a1b)", color: "#fff" }
                      : { background: "transparent", color: "var(--gray, #6e6e5a)" }
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Footer precio + controles */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div>
            <span
              className="font-mono font-bold leading-none"
              style={{
                fontSize: "1.2rem",
                color: "var(--g1, #2d5a1b)",
              }}
            >
              {fmtPrice(active.depositAmount || active.finalPrice)} €
            </span>
            <span
              className="block mt-0.5"
              style={{ fontSize: "0.62rem", color: "var(--lgray, #a8a892)" }}
            >
              pago online
            </span>
          </div>

          {active.available ? (
            inCart ? (
              <div
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                style={{ background: "var(--cream, #f2ead8)" }}
              >
                <button
                  type="button"
                  onClick={() => onDecrement(active.id)}
                  className="w-[18px] text-center font-medium border-none bg-transparent cursor-pointer transition-colors"
                  style={{
                    fontSize: "1.05rem",
                    color: "var(--g1, #2d5a1b)",
                    fontFamily: "inherit",
                  }}
                  aria-label="Quitar uno"
                >
                  −
                </button>
                <span
                  className="font-medium text-center tabular-nums"
                  style={{
                    fontSize: "0.88rem",
                    color: "var(--dark, #1a1a0e)",
                    minWidth: "16px",
                  }}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => onIncrement(active.id)}
                  disabled={qty >= maxQuantity}
                  className="w-[18px] text-center font-medium border-none bg-transparent cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    fontSize: "1.05rem",
                    color: "var(--g1, #2d5a1b)",
                    fontFamily: "inherit",
                  }}
                  aria-label="Añadir uno"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(active.id)}
                className="flex items-center justify-center rounded-lg text-white border-none cursor-pointer transition-all duration-150 hover:scale-[1.08]"
                style={{
                  width: "36px",
                  height: "36px",
                  fontSize: "1.2rem",
                  background: "var(--g1, #2d5a1b)",
                  flexShrink: 0,
                }}
                aria-label="Añadir al carrito"
              >
                +
              </button>
            )
          ) : (
            <span
              className="uppercase tracking-widest"
              style={{ fontSize: "0.63rem", color: "var(--lgray, #a8a892)" }}
            >
              Agotado
            </span>
          )}
        </div>

        {/* Extras del plato (p.ej. reahogado para el corviche) */}
        {addons && addons.length > 0 && (
          <div
            className="mt-3 pt-3 border-t space-y-1.5"
            style={{ borderColor: "rgba(44,90,27,0.1)" }}
          >
            {addons.map((a) => {
              const aq = quantityOf?.(a.product.id) ?? 0;
              const price = a.product.depositAmount || a.product.finalPrice;
              if (!a.product.available) return null;
              return aq > 0 ? (
                <div
                  key={a.product.id}
                  className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5"
                  style={{ background: "rgba(44,90,27,0.06)" }}
                >
                  <span
                    className="text-[0.72rem] font-medium"
                    style={{ color: "var(--g1, #2d5a1b)" }}
                  >
                    ✓ {a.label}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDecrement(a.product.id)}
                      className="w-4 text-center leading-none"
                      style={{ fontSize: "1rem", color: "var(--g1, #2d5a1b)" }}
                      aria-label={`Quitar ${a.label}`}
                    >
                      −
                    </button>
                    <span className="text-[0.75rem] font-semibold tabular-nums w-3 text-center">
                      {aq}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrement(a.product.id)}
                      disabled={aq >= maxQuantity}
                      className="w-4 text-center leading-none disabled:opacity-30"
                      style={{ fontSize: "1rem", color: "var(--g1, #2d5a1b)" }}
                      aria-label={`Añadir ${a.label}`}
                    >
                      +
                    </button>
                  </span>
                </div>
              ) : (
                <button
                  key={a.product.id}
                  type="button"
                  onClick={() => onAdd(a.product.id)}
                  className="w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 transition-colors"
                  style={{ background: "rgba(44,90,27,0.06)" }}
                >
                  <span
                    className="text-[0.72rem] font-medium"
                    style={{ color: "var(--gray, #6e6e5a)" }}
                  >
                    + {a.label}
                  </span>
                  <span
                    className="text-[0.72rem] font-bold"
                    style={{ color: "var(--g1, #2d5a1b)" }}
                  >
                    {fmtPrice(price)} €
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
