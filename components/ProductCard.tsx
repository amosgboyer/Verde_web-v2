import type { Product } from "@/lib/products";
import clsx from "clsx";

interface ProductCardProps {
  product: Product;
  quantity: number;
  maxQuantity: number;
  onAdd: (productId: string) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
}

const BADGES: Record<string, { label: string; bg: string; color: string }> = {
  "Tigrillo XL Mixto": { label: "⭐ Más pedido", bg: "#c85a2a", color: "#f2ead8" },
  "Canoa de Maduro":   { label: "Novedad",       bg: "#c8960a", color: "#1a1a0e" },
};

export default function ProductCard({
  product, quantity, maxQuantity, onAdd, onIncrement, onDecrement,
}: ProductCardProps) {
  const inCart = quantity > 0;
  const badge = BADGES[product.name];

  return (
    <div className={clsx(
      "border transition-all duration-200 p-5 flex flex-col relative",
      inCart ? "border-verde-bosque" : "border-negro/12 bg-white/50",
      !product.available && "opacity-40"
    )}>
      {/* Badge */}
      {badge && (
        <span
          className="absolute top-3 right-3 text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      )}

      {/* Imagen del producto (si viene de Google Sheets) */}
      {product.image && (
        <div className="w-full aspect-[4/3] mb-4 overflow-hidden bg-crema">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover object-top" />
        </div>
      )}

      {/* Info */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-1">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-verde-bosque leading-tight mb-1">{product.name}</h3>
          <p className="text-sm text-negro/55 leading-relaxed">{product.description}</p>
          {product.allergens && product.allergens.length > 0 && (
            <p className="text-[10px] font-medium text-negro/30 uppercase tracking-wider mt-2">
              Contiene: {product.allergens.join(", ")}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-verde-bosque text-base">{product.depositAmount || product.finalPrice} €</p>
          <p className="text-[10px] font-medium text-negro/30 uppercase tracking-wider mt-0.5">Pago online</p>
        </div>
      </div>

      {/* Controles */}
      {product.available && (
        <div className="mt-auto">
          {inCart ? (
            <div className="flex items-center gap-0 border border-verde-bosque/25 w-fit">
              <button type="button" onClick={() => onDecrement(product.id)}
                className="w-9 h-9 flex items-center justify-center text-verde-bosque hover:bg-verde-bosque hover:text-crema transition-colors duration-150 text-lg font-light"
                aria-label="Quitar uno">−</button>
              <span className="w-10 text-center text-sm font-semibold text-verde-bosque tabular-nums">{quantity}</span>
              <button type="button" onClick={() => onIncrement(product.id)} disabled={quantity >= maxQuantity}
                className="w-9 h-9 flex items-center justify-center text-verde-bosque hover:bg-verde-bosque hover:text-crema transition-colors duration-150 text-lg font-light disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Añadir uno">+</button>
            </div>
          ) : (
            <button type="button" onClick={() => onAdd(product.id)}
              className="text-[11px] font-semibold tracking-[0.2em] uppercase text-verde-bosque border border-verde-bosque/30 px-4 py-2 hover:bg-verde-bosque hover:text-crema transition-colors duration-200">
              + Añadir
            </button>
          )}
        </div>
      )}
      {!product.available && (
        <p className="text-[10px] font-medium text-negro/30 uppercase tracking-widest mt-auto">Agotado</p>
      )}
    </div>
  );
}
