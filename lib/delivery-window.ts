// ─── Rango de entrega ───────────────────────────────────────────────────────
// El cliente elige una hora (p. ej. 13:00) y le mostramos un margen de llegada:
// "entre las 13:00 y las 13:30". La hora guardada en el pedido (Sheet, Stripe,
// comandero) sigue siendo la hora elegida; esto solo cambia cómo se enseña.
//
// Para cambiar el margen (p. ej. a 20 min), edita esta constante y redepliega.
export const DELIVERY_WINDOW_MIN = 30;

const HM = /^(\d{1,2}):(\d{2})$/;

/** "13:00" → "13:30" (suma DELIVERY_WINDOW_MIN). Devuelve "" si no es HH:MM. */
export function deliveryWindowEnd(time: string, minutes = DELIVERY_WINDOW_MIN): string {
  const m = HM.exec((time ?? "").trim());
  if (!m) return "";
  const total = (Number(m[1]) * 60 + Number(m[2]) + minutes) % 1440;
  const h = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** "13:00" → "13:00 – 13:30". Si la hora no es válida, la devuelve tal cual. */
export function formatDeliveryWindow(time: string, minutes = DELIVERY_WINDOW_MIN): string {
  const end = deliveryWindowEnd(time, minutes);
  return end ? `${time.trim()} – ${end}` : time;
}

/** "13:00" → "entre las 13:00 y las 13:30" (para frases). */
export function deliveryWindowSentence(time: string, minutes = DELIVERY_WINDOW_MIN): string {
  const end = deliveryWindowEnd(time, minutes);
  return end ? `entre las ${time.trim()} y las ${end}` : `a las ${time}`;
}
