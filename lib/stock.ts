// Stock TOTAL limitado por plato (edición limitada). Cuenta cuántas unidades se
// han vendido ya (filas PAID/CONFIRMED en Orders, sumando cantidades) y resta del
// límite. Cuando llega a 0, el plato se agota. No distingue por día: es un cupo
// total hasta que se cambie el número aquí.
import { mismoId } from "./products";

// id del plato → unidades totales disponibles.
export const STOCK_LIMITADO: Record<string, number> = {
  "caldo-bolas-de-verde": 5,
};

type OrderLike = { productId: string; quantity: number; status: string };

function limiteDe(productId: string): number | null {
  for (const [id, lim] of Object.entries(STOCK_LIMITADO)) {
    if (mismoId(id, productId)) return lim;
  }
  return null;
}

/** ¿Este plato tiene stock total limitado? */
export function esLimitado(productId: string): boolean {
  return limiteDe(productId) != null;
}

/** Unidades ya vendidas (pedidos pagados/confirmados) de un plato. */
export function unidadesVendidas(productId: string, orders: OrderLike[]): number {
  return orders
    .filter(
      (o) =>
        (o.status === "PAID" || o.status === "CONFIRMED") &&
        mismoId(o.productId, productId)
    )
    .reduce((s, o) => s + (Number(o.quantity) || 0), 0);
}

/** Unidades que quedan de un plato limitado (0 si agotado). null si no es limitado. */
export function stockRestante(
  productId: string,
  orders: OrderLike[]
): number | null {
  const limite = limiteDe(productId);
  if (limite == null) return null;
  return Math.max(0, limite - unidadesVendidas(productId, orders));
}

/**
 * Comprueba que un carrito no supera el stock limitado. Suma las unidades que
 * pide el carrito por plato limitado y las compara con lo que queda. Devuelve
 * un mensaje de error para el cliente, o null si todo cabe.
 */
export function comprobarStockCarrito(
  items: { productId: string; quantity: number }[],
  orders: OrderLike[]
): string | null {
  // Agrupar cantidades pedidas por cada id limitado presente en el carrito.
  const pedidoPorId = new Map<string, number>();
  for (const it of items) {
    if (!esLimitado(it.productId)) continue;
    pedidoPorId.set(
      it.productId,
      (pedidoPorId.get(it.productId) || 0) + (Number(it.quantity) || 0)
    );
  }
  for (const [productId, pedido] of pedidoPorId) {
    const restante = stockRestante(productId, orders) ?? 0;
    if (pedido > restante) {
      if (restante <= 0) {
        return "Uno de los platos de tu pedido ya se ha agotado (edición limitada). Quítalo del carrito para continuar.";
      }
      return `De uno de los platos solo quedan ${restante} unidades (edición limitada). Reduce la cantidad para continuar.`;
    }
  }
  return null;
}
