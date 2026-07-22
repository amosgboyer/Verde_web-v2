"use client";

import { useState } from "react";
import Image from "next/image";
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
  sizeOptions?: SizeOption[];
  quantityOf?: (productId: string) => number;
  addons?: { label: string; product: Product }[];
  image?: string;
}

export default function ProductCard({
  product, quantity, maxQuantity, onAdd, onIncrement, onDecrement, offerBadge,
  sizeOptions, quantityOf, addons, image,
}: ProductCardProps) {
  const hasSizes = !!sizeOptions && sizeOptions.length > 1;
  const [sizeIdx, setSizeIdx] = useState(0);
  const [open, setOpen] = useState(false);

  const active = hasSizes ? sizeOptions![sizeIdx].product : product;
  const qty = hasSizes ? (quantityOf?.(active.id) ?? 0) : quantity;
  const inCart = qty > 0;
  const price = active.depositAmount || active.finalPrice;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <article
      className={clsx(
        "pc w-full aspect-[4/5] rounded-[15px] cursor-pointer select-none",
        open && "is-open",
        !active.available && "opacity-60"
      )}
      style={{
        border: offerBadge
          ? "1.5px solid var(--terra, #c85a2a)"
          : inCart
          ? "1.5px solid var(--g2, #4a7c2f)"
          : "1px solid var(--border, rgba(44,90,27,0.13))",
        background: "#e8ddc4",
      }}
      onClick={() => setOpen((o) => !o)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); }
      }}
      aria-label={product.name}
    >
      {/* Foto */}
      {image ? (
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 46vw, 22vw"
          style={{ objectFit: "cover" }}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1"
          style={{
            background:
              "linear-gradient(150deg, #e8efda 0%, #d3e3bd 55%, #c3dbab 100%)",
            color: "rgba(46,79,32,0.4)",
          }}
        >
          <span style={{ fontSize: "1.5rem", opacity: 0.6 }}>📷</span>
        </div>
      )}

      {/* Cinta de oferta */}
      {offerBadge && (
        <div
          className="absolute top-0 left-0 z-[4] text-white text-[9px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-br-[10px]"
          style={{ background: "var(--terra, #c85a2a)" }}
        >
          {offerBadge}
        </div>
      )}

      {/* Precio (siempre visible) */}
      <div
        className="absolute top-2 right-2 z-[2] font-extrabold tabular-nums"
        style={{
          background: "rgba(255,255,255,0.92)", color: "var(--g1, #2d5a1b)",
          fontSize: "0.8rem", padding: "3px 9px", borderRadius: "999px",
          boxShadow: "0 2px 8px rgba(28,58,16,0.15)",
        }}
      >
        {fmtPrice(price)} €
      </div>

      {/* Nombre (siempre visible, abajo) */}
      <div
        className="pc-namestrip absolute left-0 right-0 bottom-0 z-[2] px-3 pt-6 pb-2.5 text-white font-semibold leading-tight"
        style={{
          fontSize: "0.82rem",
          background:
            "linear-gradient(to top, rgba(20,28,12,0.85) 10%, rgba(20,28,12,0.35) 55%, transparent)",
        }}
      >
        {product.name}
      </div>

      {/* Panel desplegable */}
      <div
        className="pc-reveal absolute inset-0 z-[3] flex flex-col gap-2 p-3 text-left"
        style={{
          background:
            "linear-gradient(180deg, rgba(30,52,20,0.96), rgba(26,44,16,0.97))",
          color: "var(--cream, #F5EDD8)",
        }}
      >
        <div className="font-bold leading-tight" style={{ fontSize: "0.9rem" }}>
          {product.name}
        </div>
        <div
          className="flex-1 overflow-y-auto leading-snug"
          style={{ fontSize: "0.72rem", color: "rgba(245,240,232,0.82)" }}
        >
          {product.description}
        </div>

        {/* Selector de tamaño */}
        {hasSizes && (
          <div
            className="flex gap-1 p-0.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.1)" }}
            onClick={stop}
          >
            {sizeOptions!.map((opt, i) => {
              const selected = i === sizeIdx;
              return (
                <button
                  key={opt.product.id}
                  type="button"
                  onClick={(e) => { stop(e); setSizeIdx(i); }}
                  aria-pressed={selected}
                  className="flex-1 rounded-md py-1 text-[0.68rem] font-semibold transition-colors"
                  style={
                    selected
                      ? { background: "var(--leaf, #509234)", color: "#fff" }
                      : { background: "transparent", color: "rgba(245,240,232,0.7)" }
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Extras del plato */}
        {addons && addons.length > 0 && (
          <div className="space-y-1" onClick={stop}>
            {addons.map((a) => {
              if (!a.product.available) return null;
              const aq = quantityOf?.(a.product.id) ?? 0;
              const ap = a.product.depositAmount || a.product.finalPrice;
              return aq > 0 ? (
                <div
                  key={a.product.id}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  <span className="text-[0.68rem]">✓ {a.label}</span>
                  <span className="flex items-center gap-1.5">
                    <button type="button" onClick={(e) => { stop(e); onDecrement(a.product.id); }} className="leading-none" style={{ fontSize: "0.95rem" }} aria-label={`Quitar ${a.label}`}>−</button>
                    <span className="text-[0.72rem] font-semibold w-3 text-center tabular-nums">{aq}</span>
                    <button type="button" onClick={(e) => { stop(e); onIncrement(a.product.id); }} disabled={aq >= maxQuantity} className="leading-none disabled:opacity-30" style={{ fontSize: "0.95rem" }} aria-label={`Añadir ${a.label}`}>+</button>
                  </span>
                </div>
              ) : (
                <button
                  key={a.product.id}
                  type="button"
                  onClick={(e) => { stop(e); onAdd(a.product.id); }}
                  className="w-full flex items-center justify-between gap-2 rounded-md px-2 py-1"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <span className="text-[0.68rem]">+ {a.label}</span>
                  <span className="text-[0.68rem] font-bold">{fmtPrice(ap)} €</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Precio + acción */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="font-extrabold tabular-nums" style={{ fontSize: "1.05rem" }}>
            {fmtPrice(price)} €
          </span>
          {active.available ? (
            inCart ? (
              <span className="flex items-center gap-2 rounded-lg px-2 py-1" style={{ background: "rgba(255,255,255,0.14)" }} onClick={stop}>
                <button type="button" onClick={(e) => { stop(e); onDecrement(active.id); }} className="leading-none" style={{ fontSize: "1.05rem" }} aria-label="Quitar uno">−</button>
                <span className="font-semibold tabular-nums w-4 text-center" style={{ fontSize: "0.85rem" }}>{qty}</span>
                <button type="button" onClick={(e) => { stop(e); onIncrement(active.id); }} disabled={qty >= maxQuantity} className="leading-none disabled:opacity-30" style={{ fontSize: "1.05rem" }} aria-label="Añadir uno">+</button>
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => { stop(e); onAdd(active.id); }}
                className="font-bold rounded-lg px-3.5 py-2 transition-colors"
                style={{ background: "var(--leaf, #509234)", color: "#fff", fontSize: "0.8rem" }}
              >
                Añadir +
              </button>
            )
          ) : (
            <span className="uppercase tracking-widest" style={{ fontSize: "0.62rem", color: "rgba(245,240,232,0.6)" }}>
              Agotado
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
