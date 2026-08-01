// ─── Ofertas por producto y cantidad (nivel ítem) ──────────────────────────
// Distinto de lib/promotions.ts (que es un % global sobre todo el carrito,
// controlado desde Google Sheets). Aquí viven ofertas tipo "2ª unidad al 50%"
// sobre un producto concreto, con ventana de fechas propia (horario de Madrid).
// El cambio de activo/inactivo es AUTOMÁTICO por fecha.

export interface WeekendOffer {
  id: string;
  name: string; // se muestra al cliente y se guarda en el pedido
  tagline: string; // gancho corto
  badge: string; // sello de urgencia ("Solo este finde", "Solo hoy")
  productId: string; // id de referencia (fallback estático)
  productName: string; // nombre exacto mostrado al cliente
  productNameMatch: string; // nombre normalizado para casar con el Sheet
  everyNth: number; // cada N unidades, 1 va con descuento (2 = "cada 2ª unidad")
  percentOff: number; // % de descuento sobre la unidad con oferta (100 = gratis)
  // ── Ventana en la que la oferta SE VE en la web (día natural, Madrid) ──
  startDate: string; // "YYYY-MM-DD" inclusive (Madrid)
  endDate: string; // "YYYY-MM-DD" inclusive (Madrid)
  // ── Días de ENTREGA a los que se aplica. Si se omiten, vale cualquiera ──
  // Sirve para "se anuncia hoy, pero solo para pedidos de mañana".
  reservationStartDate?: string;
  reservationEndDate?: string;
}

// Sweet Weekend — la 2ª Canoa de Maduro al 50%. Solo este fin de semana.
export const SWEET_WEEKEND: WeekendOffer = {
  id: "sweet-weekend",
  name: "Sweet Weekend",
  tagline: "La 2ª Canoa de Maduro, al 50%",
  badge: "Solo este finde",
  productId: "canoa-maduro",
  productName: "Canoa de Maduro",
  productNameMatch: "canoa de maduro",
  everyNth: 2,
  percentOff: 50,
  startDate: "2026-07-17", // viernes
  endDate: "2026-07-19", // domingo (se apaga sola el lunes 20 a las 00:00)
};

// 2×1 en Tigrillo — se anuncia SOLO el sábado 1 y solo vale para pedidos que
// se entregan el domingo 2. Se apaga sola el domingo a las 00:00 (Madrid).
export const TIGRILLO_2X1: WeekendOffer = {
  id: "tigrillo-2x1",
  name: "2×1 en Tigrillo",
  tagline: "El 2º Tigrillo Mixto, gratis",
  badge: "Solo hoy",
  productId: "tigrillo-mixto",
  productName: "Tigrillo Mixto",
  productNameMatch: "tigrillo mixto",
  everyNth: 2,
  percentOff: 100,
  startDate: "2026-08-01", // sábado — único día en que se ve
  endDate: "2026-08-01",
  reservationStartDate: "2026-08-02", // domingo — único día de entrega válido
  reservationEndDate: "2026-08-02",
};

// Orden de prioridad: la primera que esté activa hoy es la que se aplica.
const OFERTAS: WeekendOffer[] = [TIGRILLO_2X1, SWEET_WEEKEND];

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
  return (
    OFERTAS.find((o) => today >= o.startDate && today <= o.endDate) ?? null
  );
}

// ¿La oferta cubre el día de entrega elegido? Una oferta sin ventana de
// reserva vale para cualquier día; con ventana, solo dentro de ella. Sin fecha
// elegida todavía → NO se aplica (se aplicará al elegir el día correcto).
export function offerCoversReservationDate(
  offer: WeekendOffer,
  reservationDate: string | undefined
): boolean {
  if (!offer.reservationStartDate && !offer.reservationEndDate) return true;
  const d = (reservationDate ?? "").trim().slice(0, 10);
  if (!d) return false;
  if (offer.reservationStartDate && d < offer.reservationStartDate) return false;
  if (offer.reservationEndDate && d > offer.reservationEndDate) return false;
  return true;
}

// Sello corto para la card del producto: "2×1" o "2ª −50%".
export function offerBadgeLabel(offer: WeekendOffer): string {
  if (offer.percentOff >= 100) {
    return offer.everyNth === 2 ? "2×1" : `${offer.everyNth}×${offer.everyNth - 1}`;
  }
  return `${offer.everyNth}ª −${offer.percentOff}%`;
}

// Cómo se consigue, en una frase. El gancho ya lo da `tagline`, así que aquí
// solo va la mecánica — si no, la tarjeta dice dos veces lo mismo.
export function offerRuleText(offer: WeekendOffer): string {
  return `Añade ${offer.everyNth} al carrito y el descuento se aplica solo.`;
}

// Condición de día de entrega, en texto. null si la oferta no la tiene.
export function offerReservationText(offer: WeekendOffer): string | null {
  const desde = offer.reservationStartDate;
  const hasta = offer.reservationEndDate;
  if (!desde && !hasta) return null;
  const fmt = (d: string) =>
    new Date(d + "T12:00:00Z")
      .toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Europe/Madrid",
      })
      // es-ES mete coma tras el día de la semana ("domingo, 2 de agosto").
      .replace(",", "");
  if (desde && hasta && desde === hasta) return `Solo para pedidos del ${fmt(desde)}`;
  if (desde && hasta) return `Solo para pedidos del ${fmt(desde)} al ${fmt(hasta)}`;
  if (desde) return `Solo para pedidos a partir del ${fmt(desde)}`;
  return `Solo para pedidos hasta el ${fmt(hasta!)}`;
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
//
// `reservationDate` es obligatorio a propósito: hay ofertas que solo valen para
// ciertos días de entrega, y un parámetro opcional se olvidaría en algún sitio
// y regalaría el descuento a pedidos que no lo tienen.
export function computeOfferDiscount(
  offer: WeekendOffer,
  items: OfferItem[],
  reservationDate: string | undefined
): OfferDiscount {
  if (!offerCoversReservationDate(offer, reservationDate)) {
    return { discountAmount: 0, discountedUnits: 0 };
  }
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
