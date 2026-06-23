// ─── Lanzamiento por fases ──────────────────────────────────────────────────
//  - early_access (domingo 7 + lunes 8 jun): solo lista de espera, requiere código.
//  - open (martes 9 jun en adelante): público general, sin código.
// El cambio es AUTOMÁTICO por fecha (horario de Madrid).

// Código compartido que reciben los de la lista de espera. Cámbialo si quieres.
export const EARLY_ACCESS_CODE = "VERDE-VIP";

// Día en que abre al público general (sin código). Zona horaria de Madrid.
// Antes de esta fecha = acceso anticipado (lista de espera con código).
export const PUBLIC_OPEN_DATE = "2026-06-30"; // martes 30 jun

// La lista de espera ya está cerrada (no se aceptan nuevas altas).
export const WAITLIST_CLOSED = true;

export type LaunchPhase = "early_access" | "open";

// "YYYY-MM-DD" de hoy en horario de Madrid.
function todayMadrid(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
}

export function getLaunchPhase(): LaunchPhase {
  return todayMadrid() >= PUBLIC_OPEN_DATE ? "open" : "early_access";
}

export function isAccessCodeValid(code?: string | null): boolean {
  return (
    !!code && code.trim().toUpperCase() === EARLY_ACCESS_CODE.toUpperCase()
  );
}
