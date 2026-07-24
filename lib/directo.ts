// ─── Piloto "en directo" (pedidos para HOY, tipo Glovo) ─────────────────────
// Ventana del piloto: mié 29, jue 30 y vie 31 de julio de 2026, todo el día,
// último pedido 19:15, cocina cierra 20:00. Entrega estimada ~40 min.
// Fuera de esta ventana, la web sigue como siempre (sin "pedir ahora").
//
// Para CAMBIAR el piloto: edita estas constantes (y redepliega).

export const DIRECTO_DATES = ["2026-07-29", "2026-07-30", "2026-07-31"];
export const DIRECTO_OPEN = "12:00"; // apertura del directo (ajústalo si abrís antes)
export const DIRECTO_LAST_CALL = "19:15"; // último pedido aceptado
export const DIRECTO_CLOSE = "20:00"; // cierre de cocina (informativo)
export const DIRECTO_ETA_MIN = 40; // minutos de entrega estimada

export interface DirectoStatus {
  isOpen: boolean; // se puede pedir en directo ahora mismo
  isPilotDay: boolean; // hoy es un día del piloto
  today: string; // YYYY-MM-DD (Madrid)
  nowHM: string; // HH:MM (Madrid)
  etaTime: string; // HH:MM = ahora + ETA, redondeado a :05
  lastCall: string; // HH:MM
  forced: boolean; // abierto por override de preview (no por la ventana real)
}

function hmToMin(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function minToHM(min: number): string {
  const norm = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Fecha (YYYY-MM-DD) y hora (HH:MM) actuales en horario de Madrid.
function madridNow(): { date: string; hm: string; minutes: number } {
  const now = new Date();
  const date = now.toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
  const parts = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { date, hm: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, minutes: h * 60 + m };
}

// Hora estimada de entrega = ahora + ETA, redondeada al múltiplo de 5 arriba.
export function etaFromNow(): string {
  const { minutes } = madridNow();
  const eta = Math.ceil((minutes + DIRECTO_ETA_MIN) / 5) * 5;
  return minToHM(eta);
}

// Fecha de hoy en Madrid (para reservationDate del pedido en directo).
export function todayMadrid(): string {
  return madridNow().date;
}

// Estado del directo. `force` (p.ej. ?directo=preview) lo abre aunque no sea la
// ventana real, para poder verlo/probarlo en la preview antes del piloto.
export function getDirectoStatus(force = false): DirectoStatus {
  const { date, hm, minutes } = madridNow();
  const isPilotDay = DIRECTO_DATES.includes(date);
  const withinHours =
    minutes >= hmToMin(DIRECTO_OPEN) && minutes <= hmToMin(DIRECTO_LAST_CALL);
  const realOpen = isPilotDay && withinHours;
  return {
    isOpen: force || realOpen,
    isPilotDay,
    today: date,
    nowHM: hm,
    etaTime: etaFromNow(),
    lastCall: DIRECTO_LAST_CALL,
    forced: force && !realOpen,
  };
}
