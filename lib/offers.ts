// ─── Ofertas por producto y cantidad (nivel ítem) ──────────────────────────
// Distinto de lib/promotions.ts (que es un % global sobre todo el carrito,
// controlado desde Google Sheets). Aquí viven ofertas tipo "2ª unidad al 50%"
// sobre un producto concreto, con ventana de fechas propia (horario de Madrid).
// El cambio de activo/inactivo es AUTOMÁTICO por fecha.

export interface WeekendOffer {
  id: string;
  name: string; // se muestra al cliente y se guarda en el pedido
  tagline: string; // gancho corto
  productId: string; // id de referencia (fallback estático)
  productName: string; // nombre exacto mostrado al cliente
  productNameMatch: string; // nombre normalizado para casar con el Sheet
  everyNth: number; // cada N unidades, 1 va con descuento (2 = "cada 2ª unidad")
  percentOff: number; // % de descuento sobre la unidad con oferta
  startDate: string; // "YYYY-MM-DD" inclusive (Madrid)
  endDate: string; // "YYYY-MM-DD" inclusive (Madrid)
}

// Sweet Weekend — la 2ª Canoa de Maduro al 50%. Solo este fin de semana.
export const SWEET_WEEKEND: WeekendOffer = {
  id: "sweet-weekend",
  name: "Sweet Weekend",
  tagline: "La 2ª Canoa de Maduro, al 50%",
  productId: "canoa-maduro",
  productName: "Canoa de Maduro",
  productNameMatch: "canoa de maduro",
  everyNth: 2,
  percentOff: 50,
  startDate: "2026-07-17", // viernes
  endDate: "2026-07-19", // domingo (se apaga sola el lunes 20 a las 00:00)
};

// Normaliza un nombre para comparar (minúsculas, sin acentos, espacios colapsados).
// El id del producto puede variar entre el Sheet y el fallback estático; casar
// también por nombre hace que la oferta funcione sin depender del id.
export function normalizeProductName(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// ¿Este producto (por id o por nombre) es el objetivo de la oferta?
export function productMatchesOffer(
  offer: WeekendOffer,
  product: { id: string; name?: string }
): boolean {
  if (product.id === offer.productId) return true;
  if (product.name && normalizeProductName(product.name) === offer.productNameMatch) {
    return true;
  }
  return false;
}

// "YYYY-MM-DD" de hoy en horario de Madrid.
function todayMadrid(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
}

// Devuelve la oferta activa hoy, o null. Fuente de verdad para activarla.
export function getActiveWeekendOffer(): WeekendOffer | null {
  const today = todayMadrid();
  if (today >= SWEET_WEEKEND.startDate && today <= SWEET_WEEKEND.endDate) {
    return SWEET_WEEKEND;
  }
  return null;
}

export interface OfferItem {
  productId: string;
  productName?: string; // para casar por nombre si el id del Sheet difiere
  quantity: number;
  unitPrice: number; // precio unitario realmente cobrado (depositAmount)
}

export interface OfferDiscount {
  discountAmount: number; // € totales de descuento
  discountedUnits: number; // nº de unidades que van con descuento
}

// Calcula el descuento de la oferta a partir del carrito. Trabaja en céntimos
// enteros para evitar errores de coma flotante. Se usa en cliente (mostrar) y
// en servidor (cobro real — fuente de verdad).
export function computeOfferDiscount(
  offer: WeekendOffer,
  items: OfferItem[]
): OfferDiscount {
  const line = items.find((i) =>
    productMatchesOffer(offer, { id: i.productId, name: i.productName })
  );
  if (!line || line.quantity <= 0 || offer.everyNth <= 0) {
    return { discountAmount: 0, discountedUnits: 0 };
  }
  const discountedUnits = Math.floor(line.quantity / offer.everyNth);
  if (discountedUnits <= 0) return { discountAmount: 0, discountedUnits: 0 };

  const unitCents = Math.round(line.unitPrice * 100);
  const perUnitDiscountCents = Math.round((unitCents * offer.percentOff) / 100);
  const discountCents = perUnitDiscountCents * discountedUnits;

  return { discountAmount: discountCents / 100, discountedUnits };
}
