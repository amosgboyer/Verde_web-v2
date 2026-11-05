export interface StoreConfig {
  reservationsOpen: boolean;
  closedMessage: string;
  deliveryDays: string[];
  maxQuantityPerOrder: number;
  currency: string;
}

// ─── Recogida en local ──────────────────────────────────────────────────────
// Pon `true` para volver a ofrecer "Recogida" en el checkout. Con `false` solo
// hay entrega a domicilio (el servidor también rechaza pedidos de recogida).
export const PICKUP_ENABLED = true;

// Hora mínima de RECOGIDA por día de la semana (0=domingo … 6=sábado). La
// entrega a domicilio no se ve afectada. Domingo: recogida desde las 11:00.
export const PICKUP_MIN_TIME_BY_WEEKDAY: Record<number, string> = { 0: "11:00" };

const NOMBRE_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function hhmmAMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Hora mínima de recogida para una fecha YYYY-MM-DD, o null si no hay límite. */
export function pickupMinTimeFor(dateISO: string): string | null {
  if (!dateISO) return null;
  const dia = new Date(dateISO + "T12:00:00Z").getUTCDay();
  return PICKUP_MIN_TIME_BY_WEEKDAY[dia] ?? null;
}

/**
 * Si la recogida NO se permite a esa fecha+hora, devuelve el aviso para el
 * cliente (p. ej. "Los domingos la recogida en local es a partir de las 11:00.").
 * Si se permite, devuelve null.
 */
export function pickupTimeError(dateISO: string, time: string): string | null {
  const min = pickupMinTimeFor(dateISO);
  if (!min || !time) return null;
  if (hhmmAMin(time) >= hhmmAMin(min)) return null;
  const dia = NOMBRE_DIA[new Date(dateISO + "T12:00:00Z").getUTCDay()];
  return `Los ${dia}s la recogida en local es a partir de las ${min}.`;
}

// Dirección del local. Se enseña en el formulario/resumen/email cuando hay
// recogida, y en el pie de la web.
export const STORE_ADDRESS_LINE1 = "Mercado de Barceló, planta 2, local 301";
export const STORE_ADDRESS_LINE2 = "Calle de Barceló 6, 28004 Madrid";
export const PICKUP_ADDRESS = `${STORE_ADDRESS_LINE1}, ${STORE_ADDRESS_LINE2}`;
export const PICKUP_MAPS_URL =
  "https://maps.google.com/?q=Mercado+de+Barcel%C3%B3+Calle+de+Barcel%C3%B3+6+28004+Madrid";

// ─── SOLD OUT general ───────────────────────────────────────────────────────
// Pon `true` para cerrar TODO (sold out del mes): no se puede reservar, el
// calendario queda vacío y se muestra el cartel de SOLD OUT. Pon `false` para
// reabrir (entonces manda `reservationsOpen` del Google Sheet). Requiere deploy.
export const SOLD_OUT = false;

// Para abrir o cerrar reservas, cambia `reservationsOpen` a true o false.
// En el futuro esto puede moverse a una variable de entorno o a Google Sheets.
export const storeConfig: StoreConfig = {
  reservationsOpen: true,

  closedMessage:
    "Nos hemos llenado de pedidos y preferimos cocinar bien antes que correr mal. Abrimos nuevos cupos muy pronto — déjanos tu WhatsApp y te avisamos.",

  deliveryDays: ["sábado", "domingo"],

  maxQuantityPerOrder: 10,

  currency: "eur",
};
