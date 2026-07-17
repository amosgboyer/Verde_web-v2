"use client";

import type { Product } from "@/lib/products";
import clsx from "clsx";

// Precio en formato español: entero "10", decimal "2,20".
function fmtPrice(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
}

interface ProductCardProps {
  product: Product;
  quantity: number;
  maxQuantity: number;
  onAdd: (productId: string) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  offerBadge?: string;
}

export default function ProductCard({
  product, quantity, maxQuantity, onAdd, onIncrement, onDecrement, offerBadge,
}: ProductCardProps) {
  const inCart = quantity > 0;

  return (
    <div
      className={clsx(
        "relative rounded-[14px] overflow-hidden transition-all duration-200 cursor-pointer",
        "hover:-translate-y-[3px] hover:shadow-verde",
        !product.available && "opacity-40"
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
              {fmtPrice(product.depositAmount || product.finalPrice)} €
            </span>
            <span
              className="block mt-0.5"
              style={{ fontSize: "0.62rem", color: "var(--lgray, #a8a892)" }}
            >
              pago online
            </span>
          </div>

          {product.available ? (
            inCart ? (
              <div
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                style={{ background: "var(--cream, #f2ead8)" }}
              >
                <button
                  type="button"
                  onClick={() => onDecrement(product.id)}
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
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onIncrement(product.id)}
                  disabled={quantity >= maxQuantity}
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
                onClick={() => onAdd(product.id)}
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
      </div>
    </div>
  );
}
