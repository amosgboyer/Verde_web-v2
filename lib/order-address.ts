// Lógica pura para decidir qué pasa al cambiar la dirección de un pedido:
// misma zona / más barata (sin cobro), más cara (cobrar diferencia) o fuera de
// cobertura. Sin red ni estado — se apoya en la tabla de zonas de lib/delivery,
// la misma que usa el checkout, así que lo que ve el cliente es lo que se cobra.

import { quoteDeliveryByPostalCode, type DeliveryQuote } from "./delivery";

export type AddressChangeOutcome =
  | { kind: "out_of_area" }
  | { kind: "no_charge"; zone: number; newFee: number }
  | { kind: "charge"; zone: number; newFee: number; diff: number };

/**
 * Evalúa el cambio de dirección comparando la tarifa nueva (por el CP nuevo)
 * con la que ya se cobró en el pedido (`oldFee`).
 * - fuera de cobertura → "out_of_area"
 * - nueva ≤ vieja → "no_charge" (misma zona o más barata; no se devuelve)
 * - nueva > vieja → "charge" con la diferencia a cobrar
 */
export function evaluateAddressChange(
  newPostalCode: string,
  oldFee: number
): AddressChangeOutcome {
  const q: DeliveryQuote = quoteDeliveryByPostalCode(newPostalCode);
  if (!q.deliverable || q.zone == null) return { kind: "out_of_area" };
  const newFee = q.fee;
  const diff = Math.round((newFee - oldFee) * 100) / 100;
  if (diff > 0) return { kind: "charge", zone: q.zone, newFee, diff };
  return { kind: "no_charge", zone: q.zone, newFee };
}
