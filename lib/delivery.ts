// Lógica de zonas de reparto compartida por el ZoneMap, el formulario de
// reserva y el backend de checkout. El punto de origen NO se expone en la UI.

// Bandas de reparto:
//  Banda 1 (interior, ≤3,5 km): 3,90 €
//  Banda 2 (resto M-30, 3,5-7 km): 5,90 €
//  Más de 7 km → fuera de cobertura.
export const ZONE_LIMITS = [3.5, 7]; // km máximos por banda
export const ZONE_PRICES = [3.9, 5.9]; // € de envío por banda
export const MAX_MINS = 45;

// Punto de salida (uso interno para calcular distancia — nunca se muestra).
// Calle de la Araucaria 19, 28039 Madrid (Tetuán).
const ORIGIN: [number, number] = [40.4602, -3.6999];

export interface DeliveryQuote {
  deliverable: boolean;
  zone: number | null; // 1..3
  fee: number; // € (0 si no se reparte)
  km: number;
}

// Precio de envío para un nivel de zona dado. Fuente de verdad del backend.
export function feeForZone(zone: number | null | undefined): number {
  if (!zone || zone < 1 || zone > ZONE_PRICES.length) return 0;
  return ZONE_PRICES[zone - 1];
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Geocodifica una dirección de Madrid y devuelve la zona/precio de reparto.
// Devuelve null si no se encuentra la dirección.
export async function quoteDelivery(query: string): Promise<DeliveryQuote | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query + ", Madrid, Spain"
    )}&format=json&limit=1`
  );
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) return null;

  const dest: [number, number] = [
    parseFloat(data[0].lat),
    parseFloat(data[0].lon),
  ];
  const km = haversineKm(ORIGIN, dest);
  const mins = Math.round(10 + km * 3.5);

  let zone: number | null = null;
  for (let i = 0; i < ZONE_LIMITS.length; i++) {
    if (km <= ZONE_LIMITS[i]) {
      zone = i + 1;
      break;
    }
  }

  const deliverable = !(mins > MAX_MINS || !zone);
  return {
    deliverable,
    zone: deliverable ? zone : null,
    fee: deliverable ? feeForZone(zone) : 0,
    km,
  };
}
