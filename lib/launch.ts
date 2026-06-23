// ─── Lanzamiento por fases ──────────────────────────────────────────────────
//  - early_access (domingo 7 + lunes 8 jun): solo lista de espera, requiere código.
//  - open (martes 9 jun en adelante): público general, sin código.
// El cambio es AUTOMÁTICO por fecha (horario de Madrid).

// Código compartido que reciben los de la lista de espera.
// Es "verde" en binario (ASCII): v e r d e. Al meterlo, la web hace una
// animación de descifrado que revela "VERDE MADRID".
// Para enviarlo por WhatsApp (legible): 01110110 01100101 01110010 01100100 01100101
export const EARLY_ACCESS_CODE = "0111011001100101011100100110010001100101";

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

// Compara ignorando espacios/saltos de línea (el binario se pega con espacios).
export function isAccessCodeValid(code?: string | null): boolean {
  if (!code) return false;
  const clean = (s: string) => s.replace(/\s+/g, "");
  return clean(code) === clean(EARLY_ACCESS_CODE);
}
