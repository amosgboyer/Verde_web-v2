import type { ActivePromotion } from "./promotions";

// ─── La Ventana del Lunes ───────────────────────────────────────────────────
//
// Todos los lunes, de 15:33 a 15:48 (Madrid), 15 minutos de −10% en toda la
// carta — pero SOLO para pedidos cuya entrega caiga en miércoles o jueves.
// La idea: empujar los dos días flojos de la semana con una cita fija que se
// pueda anunciar ("los lunes a las 3:33 y 33 segundos…" — el 33 es la gracia).
//
// Este módulo corre en cliente Y en servidor, así que todo es puro y con reloj
// inyectable. La única verdad que cobra es la del SERVIDOR (checkout): el
// countdown del navegador es escaparate, el reloj del cliente puede estar mal.

export const VENTANA_LUNES = {
  nombre: "Ventana del Lunes",
  porcentaje: 10,
  diaSemana: 1, // lunes (0 = domingo)
  horaInicio: { h: 15, m: 33 },
  duracionMin: 15,
  // Gracia SOLO en el servidor, al pagar: quien vio el precio con descuento en
  // los últimos segundos no lo pierde por el tiempo de rellenar la tarjeta.
  // Nunca al revés: la gracia solo puede favorecer al cliente.
  graciaSegundos: 90,
} as const;

const INICIO_SEG =
  (VENTANA_LUNES.horaInicio.h * 60 + VENTANA_LUNES.horaInicio.m) * 60;
const FIN_SEG = INICIO_SEG + VENTANA_LUNES.duracionMin * 60;

// Partes de fecha/hora en Madrid, sin depender del huso del que ejecuta.
function partesMadrid(now: Date): { diaSemana: number; segundosDelDia: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const dias: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return {
    diaSemana: dias[get("weekday")] ?? -1,
    segundosDelDia:
      Number(get("hour")) * 3600 + Number(get("minute")) * 60 + Number(get("second")),
  };
}

export interface EstadoVentana {
  live: boolean;
  /** Segundos hasta el cierre (0 si no está abierta). */
  segundosRestantes: number;
}

/** ¿Está abierta la ventana AHORA (hora de Madrid)? Sin gracia: esto pinta UI. */
export function estadoVentana(now: Date = new Date()): EstadoVentana {
  const { diaSemana, segundosDelDia } = partesMadrid(now);
  const live =
    diaSemana === VENTANA_LUNES.diaSemana &&
    segundosDelDia >= INICIO_SEG &&
    segundosDelDia < FIN_SEG;
  return { live, segundosRestantes: live ? FIN_SEG - segundosDelDia : 0 };
}

/** ¿La fecha de entrega (YYYY-MM-DD) cae en miércoles o jueves? Cualquier
 *  semana vale: el objetivo es llenar esos días, no solo los inmediatos. */
export function esMiercolesOJueves(fechaISO: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaISO ?? "")) return false;
  const dow = new Date(fechaISO + "T12:00:00Z").getUTCDay();
  return dow === 3 || dow === 4;
}

/**
 * La comprobación DEL COBRO (checkout): ventana abierta —con la gracia— y
 * entrega en miércoles o jueves. Es la única que da dinero; el cliente solo
 * estima con `estadoVentana` + `esMiercolesOJueves`.
 */
export function ventanaAplicaAlPago(
  reservationDate: string,
  now: Date = new Date()
): boolean {
  if (!esMiercolesOJueves(reservationDate)) return false;
  const { diaSemana, segundosDelDia } = partesMadrid(now);
  return (
    diaSemana === VENTANA_LUNES.diaSemana &&
    segundosDelDia >= INICIO_SEG &&
    segundosDelDia < FIN_SEG + VENTANA_LUNES.graciaSegundos
  );
}

/** La ventana con el traje de promoción de siempre: así el cobro, la fila de
 *  Orders, el email y el resumen la tratan como cualquier otra promo. */
export function promocionVentana(): ActivePromotion {
  return {
    isActive: true,
    promoName: VENTANA_LUNES.nombre,
    promoType: "percentage",
    promoValue: VENTANA_LUNES.porcentaje,
  };
}
