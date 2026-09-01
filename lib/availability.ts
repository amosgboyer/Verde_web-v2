import {
  getSettings,
  getAvailabilityRows,
  getSlotOverridesRows,
  getOrdersRows,
} from "./google-sheets";
import { SOLD_OUT } from "./store-config";

// Normalizes "9:00" → "09:00", "9:5" → "09:05", already-padded values unchanged
export function normalizeTime(t: string): string {
  if (!t) return "";
  const [rawH = "0", rawM = "00"] = t.trim().split(":");
  return `${rawH.padStart(2, "0")}:${rawM.padStart(2, "0")}`;
}

// Trims and keeps only YYYY-MM-DD
export function normalizeDate(d: string): string {
  if (!d) return "";
  return d.trim().slice(0, 10);
}

export interface TimeSlot {
  time: string;
  status: "available" | "sold_out";
  remaining: number;
}

export interface DayAvailability {
  date: string;
  status: "available" | "sold_out" | "closed" | "past_or_today";
  note: string;
  slots: TimeSlot[];
}

// Horas que NO se ofrecen para reservar. Editar aquí.
// 10:00 fuera todos los días (pedido de Amos, 01-09) · 14:00 = hueco de comida.
const BLOCKED_TIMES = ["10:00", "14:00"];

// Capacidad por slot por defecto: 2 pedidos por hora (régimen de Amos desde
// el 01-09). La columna C de la pestaña Availability la sobreescribe por día.
const DEFAULT_MAX_ORDERS_PER_SLOT = 2;

// Desde el 01-09 se abre TODOS los días: un día futuro sin fila en la pestaña
// Availability se ofrece abierto con el cupo por defecto, dentro de esta
// ventana rodante. La hoja pasa a ser el override — sirve para CERRAR un día
// (open=FALSE, como el 09/10-09), marcar sold out manual, poner nota o cupo
// especial — y ya no hay que abrir filas cada mes.
const DEFAULT_OPEN_DAYS_AHEAD = 30;

export function buildTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number
): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;
  while (current <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    const slot = `${h}:${m}`;
    if (!BLOCKED_TIMES.includes(slot)) slots.push(slot);
    current += intervalMinutes;
  }
  return slots;
}

export async function getAvailabilityDays(): Promise<DayAvailability[]> {
  if (SOLD_OUT) return []; // sold out general → sin fechas disponibles

  const [settings, availRows, overrides, orders] = await Promise.all([
    getSettings(),
    getAvailabilityRows(),
    getSlotOverridesRows(),
    getOrdersRows(),
  ]);

  if (!settings.reservationsOpen) return [];

  const today = new Date().toISOString().slice(0, 10);
  const timeSlots = buildTimeSlots(
    settings.reservationStartTime,
    settings.reservationEndTime,
    settings.slotIntervalMinutes
  );

  const paidOrders = orders
    .filter((o) => o.status === "PAID" || o.status === "CONFIRMED")
    .map((o) => ({
      ...o,
      reservationDate: normalizeDate(o.reservationDate),
      reservationTime: normalizeTime(o.reservationTime),
      quantity: Number(o.quantity) || 0,
    }));

  // Días abiertos por defecto: se rellenan los huecos de la ventana rodante
  // que no tengan fila propia en la hoja (la fila, si existe, manda).
  const fechasConFila = new Set(availRows.map((r) => normalizeDate(r.date)));
  const allDays = [...availRows];
  for (let i = 1; i <= DEFAULT_OPEN_DAYS_AHEAD; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    if (!fechasConFila.has(iso)) {
      allDays.push({
        date: iso,
        isOpen: true,
        maxOrdersPerSlot: 0, // 0 → cae al cupo por defecto
        manuallySoldOut: false,
        note: "",
      });
    }
  }
  allDays.sort((a, b) => normalizeDate(a.date).localeCompare(normalizeDate(b.date)));

  return allDays.map((day): DayAvailability => {
    const dayDate = normalizeDate(day.date);

    if (dayDate <= today) {
      return { date: dayDate, status: "past_or_today", note: "", slots: [] };
    }

    if (!day.isOpen) {
      return { date: dayDate, status: "closed", note: day.note, slots: [] };
    }

    if (day.manuallySoldOut) {
      return { date: dayDate, status: "sold_out", note: day.note, slots: [] };
    }

    const slots: TimeSlot[] = timeSlots.map((time) => {
      const normTime = normalizeTime(time);

      const override = overrides.find(
        (o) => normalizeDate(o.date) === dayDate && normalizeTime(o.time) === normTime
      );

      if (override?.status === "sold_out") {
        return { time: normTime, status: "sold_out", remaining: 0 };
      }

      const dayCapacity =
        day.maxOrdersPerSlot > 0
          ? day.maxOrdersPerSlot
          : DEFAULT_MAX_ORDERS_PER_SLOT;
      const capacity =
        override?.maxOrdersOverride != null
          ? override.maxOrdersOverride
          : dayCapacity;

      const matchedOrders = paidOrders.filter(
        (o) => o.reservationDate === dayDate && o.reservationTime === normTime
      );
      // El cupo cuenta PEDIDOS, no líneas: la hoja escribe una fila por plato
      // (+ la línea de envío), así que sumar cantidades vaciaba la franja con
      // un solo pedido de 2+ productos (bug real: 1 pedido de 3 líneas dejaba
      // "sold out" una franja con cupo 2). Un pedido = una sesión de Stripe.
      const usedCapacity = new Set(matchedOrders.map((o) => o.stripeSessionId))
        .size;
      const remaining = Math.max(0, capacity - usedCapacity);

      if (process.env.NODE_ENV === "development") {
        console.log("[availability]", {
          date: dayDate,
          time: normTime,
          matchedOrders: matchedOrders.length,
          usedCapacity,
          slotCapacity: capacity,
          remaining,
          status: remaining > 0 ? "available" : "sold_out",
        });
      }

      return {
        time: normTime,
        status: remaining > 0 ? "available" : "sold_out",
        remaining,
      };
    });

    const hasAvailable = slots.some((s) => s.status === "available");

    return {
      date: dayDate,
      status: hasAvailable ? "available" : "sold_out",
      note: day.note,
      slots,
    };
  });
}

export async function getAvailableSlotsForDate(
  date: string
): Promise<TimeSlot[]> {
  const normDate = normalizeDate(date);
  const days = await getAvailabilityDays();
  const day = days.find((d) => d.date === normDate);
  return day?.slots ?? [];
}

export async function isSlotAvailable(
  date: string,
  time: string
): Promise<boolean> {
  const normTime = normalizeTime(time);
  const slots = await getAvailableSlotsForDate(date);
  const slot = slots.find((s) => s.time === normTime);
  return slot?.status === "available" && (slot?.remaining ?? 0) > 0;
}

export async function calculateDayStatus(
  date: string
): Promise<"available" | "sold_out" | "closed" | "past_or_today"> {
  const normDate = normalizeDate(date);
  const days = await getAvailabilityDays();
  const day = days.find((d) => d.date === normDate);
  return day?.status ?? "closed";
}
