// Nº de pedido corto y legible para el cliente, derivado del id de sesión de
// Stripe. No requiere columnas nuevas ni almacenamiento: se puede recomputar
// desde el stripeSessionId que ya guarda cada pedido.
//
// Ej.: "cs_live_a1Hj9yKmZ..." → "A1HJ9YKM"
export function orderCodeFromSession(sessionId: string): string {
  return (sessionId ?? "")
    .replace(/^cs_(live|test)_/, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();
}

// Normaliza un teléfono a sus últimos 9 dígitos (ignora +34, espacios, etc.)
// para comparar de forma robusta lo que teclea el cliente con lo guardado.
export function normalizePhone(raw: string): string {
  return (raw.match(/\d/g) ?? []).join("").slice(-9);
}
