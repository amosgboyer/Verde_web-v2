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
  // "Pide 1, llévate 2": cada unidad pedida se entrega doble y el precio NO
  // baja (no hay descuento en euros). Sin impares: pides 3, te llevas 6.
  // El nombre del ítem en el pedido lleva "(2×1 · N empanadas)" para cocina.
  regalo?: boolean;
  // Cómo se llaman las unidades en el nombre del ítem para cocina
  // ("6 empanadas", "4 chocletizas"). Por defecto, "empanadas".
  unidadPlural?: string;
  // Oferta con VARIOS platos, cada uno con sus días de entrega concretos
  // (Black Friday: Bollo jue+dom, Chocletiza sáb+dom). Si está, manda sobre
  // productId/productNameMatch/unidadPlural y sobre la ventana de reserva.
  productos?: {
    productId: string;
    productNameMatch: string;
    unidadPlural: string;
    fechas: string[]; // "YYYY-MM-DD" de entrega
    dias: string; // en texto: "jueves 26 y domingo 29"
  }[];
  // Instante exacto en que se abre (ISO con zona). Si está, la oferta no se
  // activa antes aunque `startDate` ya sea hoy.
  startAt?: string;
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

// 2×1 en Empanada de Queso — lanzamiento del plato. Se anuncia desde el
// sábado 7 y solo vale para pedidos que se entregan de miércoles 11 a domingo 15.
// Se apaga sola el lunes 16 a las 00:00 (Madrid).
// Desde el viernes 13 por la noche: "pide 1, llévate 2" (antes era "mete 2 en
// el carrito y paga 1"). Los pedidos anteriores NO llevan la etiqueta en el
// nombre y se entregan tal cual la cantidad.
export const EMPANADA_2X1: WeekendOffer = {
  id: "empanada-2x1",
  name: "2×1 en Empanada de Queso",
  tagline: "Pide 1 Empanada de Queso y llévate 2",
  badge: "Pide 1, llévate 2",
  regalo: true,
  productId: "empanada-de-queso",
  productName: "Empanada de Queso",
  productNameMatch: "empanada de queso",
  everyNth: 2,
  percentOff: 100,
  startDate: "2026-11-07", // sábado — se anuncia desde ya
  endDate: "2026-11-15", // domingo
  reservationStartDate: "2026-11-11", // miércoles — primera entrega con 2×1
  reservationEndDate: "2026-11-15",
};

// Black Friday 2026 (Amos, 24-11) — lineup por día de ENTREGA. Se abre hoy
// martes 24 a las 20:00 (Madrid). Dos 2×1 "pide 1, llévate 2" (como la
// empanada), cada uno con sus días:
//   · Bollo de Verde → jueves 26 y domingo 29
//   · La Chocletiza  → sábado 28 y domingo 29
// (El trío de salsas y los Dos Tigrillos −30 % son productos con sus propios
// días de entrega, en lib/products.ts.)
export const BLACK_FRIDAY_2X1: WeekendOffer = {
  id: "black-friday-2x1",
  name: "Black Friday · 2×1",
  tagline: "Jueves Bollo de Verde 2×1 · Sábado Chocletiza 2×1 · Domingo, los dos",
  badge: "Black Friday",
  regalo: true,
  productId: "bollo-de-verde",
  productName: "Bollo de Verde",
  productNameMatch: "bollo de verde",
  unidadPlural: "bollos",
  productos: [
    {
      productId: "bollo-de-verde",
      productNameMatch: "bollo de verde",
      unidadPlural: "bollos",
      fechas: ["2026-11-26", "2026-11-29"],
      dias: "jueves 26 y domingo 29",
    },
    {
      productId: "la-chocletiza",
      productNameMatch: "la chocletiza",
      unidadPlural: "chocletizas",
      fechas: ["2026-11-28", "2026-11-29"],
      dias: "sábado 28 y domingo 29",
    },
  ],
  everyNth: 2,
  percentOff: 100,
  startDate: "2026-11-24", // martes — se abre a las 20:00 (startAt)
  startAt: "2026-11-24T20:00:00+01:00",
  endDate: "2026-11-29", // domingo
  reservationStartDate: "2026-11-26",
  reservationEndDate: "2026-11-29",
};

// Semana de Black Friday (Amos, 24-11): la zona de ofertas de la home se pone
// en negro con detalles dorados. De miércoles 25 (sale el trío de salsas) a
// domingo 29. Se apaga sola el lunes 30.
export const BLACK_FRIDAY = {
  abreEn: "2026-11-24T20:00:00+01:00", // martes 24, 20:00 (Madrid): se abre el lineup
  hasta: "2026-11-29",
};
export function esBlackFriday(): boolean {
  return Date.now() >= Date.parse(BLACK_FRIDAY.abreEn) && todayMadrid() <= BLACK_FRIDAY.hasta;
}

// Orden de prioridad: la primera que esté activa hoy es la que se aplica.
const OFERTAS: WeekendOffer[] = [BLACK_FRIDAY_2X1, EMPANADA_2X1, TIGRILLO_2X1, SWEET_WEEKEND];

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
  if (offer.productos) return !!productoDeOferta(offer, product);
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
    OFERTAS.find(
      (o) =>
        today >= o.startDate &&
        today <= o.endDate &&
        (!o.startAt || Date.now() >= Date.parse(o.startAt))
    ) ?? null
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
  if (offer.regalo) {
    return "Cada una que pidas son dos: te llevamos el doble sin pagar más.";
  }
  return `Añade ${offer.everyNth} al carrito y el descuento se aplica solo.`;
}

// Condición de día de entrega, en texto. null si la oferta no la tiene.
export function offerReservationText(offer: WeekendOffer): string | null {
  if (offer.productos) {
    return offer.productos
      .map((x) => `${x.productNameMatch.replace(/^./, (c) => c.toUpperCase())}: entregas del ${x.dias}`)
      .join(" · ");
  }
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
  // "Pide 1, llévate 2" no rebaja el precio: el regalo va en unidades.
  if (offer.regalo) return { discountAmount: 0, discountedUnits: 0 };
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


// ─── "Pide 1, llévate 2" ───────────────────────────────────────────────────

// ¿Se entrega doble este producto en este pedido? (oferta regalo + día válido)
export function offerGiftApplies(
  offer: WeekendOffer | null | undefined,
  product: { id: string; name?: string },
  reservationDate: string | undefined
): boolean {
  if (offer?.productos) {
    const pr = productoDeOferta(offer, product);
    const d = (reservationDate ?? "").trim().slice(0, 10);
    return !!offer.regalo && !!pr && pr.fechas.includes(d);
  }
  return (
    !!offer?.regalo &&
    productMatchesOffer(offer, product) &&
    offerCoversReservationDate(offer, reservationDate)
  );
}

// Nombre del ítem en el pedido (Sheet, emails, Stripe) cuando va doble.
// Ej.: "Empanada de Queso (2×1 · 6 empanadas)" con cantidad 3.
export function giftItemName(
  name: string,
  quantity: number,
  unidadPlural = "empanadas"
): string {
  return `${name} (2×1 · ${quantity * 2} ${unidadPlural})`;
}

// Plato concreto de una oferta multi-plato (o undefined si no está en ella).
export function productoDeOferta(
  offer: WeekendOffer,
  product: { id: string; name?: string }
) {
  return offer.productos?.find(
    (x) =>
      x.productId === product.id ||
      (!!product.name && normalizeProductName(product.name) === x.productNameMatch)
  );
}

// Cómo llamar a las unidades de ESTE plato en el nombre del ítem para cocina.
export function unidadPluralDe(
  offer: WeekendOffer | null | undefined,
  product: { id: string; name?: string }
): string | undefined {
  if (!offer) return undefined;
  return (offer.productos && productoDeOferta(offer, product)?.unidadPlural) || offer.unidadPlural;
}

// ─── Fin de la oferta (cuenta atrás) ───────────────────────────────────────

// Instante (ms UTC) de las 00:00 en Madrid del día siguiente a `endDate`:
// es cuando la oferta deja de verse. Sirve igual en invierno y en verano.
export function offerEndsAtMs(offer: WeekendOffer): number {
  const [y, m, d] = offer.endDate.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d + 1, 0, 0, 0);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(guess))
      .map((p) => [p.type, p.value])
  );
  const madridAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return guess - (madridAsUtc - guess);
}
