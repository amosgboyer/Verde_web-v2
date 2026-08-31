// Lógica de zonas de reparto compartida por el ZoneMap, el formulario de
// reserva y el backend de checkout.
//
// Modelo (ago 2026, "Palanca 1" del plan de precios): la zona se decide por
// km de ruta (ida) desde la base — Calle Araucaria 19, 28039 — hasta la
// dirección de entrega. En la práctica se resuelve con una tabla estática
// código postal → zona, calculada con esa distancia (centroide del CP × 1,3
// de factor de ruta). Sin APIs ni geocoding: instantáneo y sin fallos de red.
//
//  Z1 · ≤3 km   · 3,90 € · mínimo 15 € de comida
//  Z2 · 3–6 km  · 4,90 € · mínimo 15 €
//  Z3 · 6–9 km  · 6,90 € · mínimo 25 €
//  Z4 · 9–12 km · 9,90 € · mínimo 40 €
//  >12 km o CP no listado → SIN envío (solo recogida). Fallback seguro: si un
//  cliente legítimo cae fuera, que escriba por WhatsApp y se añade su CP aquí.

export const ZONE_PRICES = [3.9, 4.9, 6.9, 9.9]; // € de envío por zona (Z1..Z4)
export const ZONE_MIN_ORDER = [15, 15, 25, 40]; // € mínimos de comida (sin envío) por zona

// km ida estimados desde la base. Los CP marcados ~ son fronterizos entre dos
// zonas y pueden moverse a ojo si la experiencia real lo pide.
const ZONA_POR_CP: Record<string, number> = {
  // Z1 · ≤3 km
  "28020": 1, "28039": 1, "28046": 1, "28029": 1, "28040": 1,
  "28003": 1, "28016": 1, "28036": 1,
  // Z2 · 3–6 km
  "28035": 2 /*~3,1km*/, "28002": 2, "28010": 2, "28006": 2, "28015": 2,
  "28034": 2, "28004": 2, "28008": 2, "28001": 2, "28028": 2,
  // Z3 · 6–9 km
  "28033": 3 /*~6km*/, "28013": 3, "28050": 3, "28009": 3, "28027": 3,
  "28012": 3, "28049": 3, "28017": 3, "28005": 3, "28007": 3,
  // Z4 · 9–12 km
  "28011": 4 /*~9,1km*/, "28045": 4 /*~9,2km*/, "28023": 4, "28030": 4,
  "28026": 4, "28025": 4, "28024": 4 /*~12,1km*/,
  // Fuera de radio (>12 km) → sin envío, solo recogida: 28031, 28032, 28100
  // (Alcobendas), 28021 (Villaverde), 28051, 28341 (Valdemoro), 28669
  // (Boadilla), 28821/28850 (Coslada/Torrejón), 28913 (Leganés),
  // 28934/28935/28938 (Móstoles/Fuenlabrada)… y cualquier CP no listado.
};

export interface DeliveryQuote {
  deliverable: boolean;
  zone: number | null; // 1..4
  fee: number; // € (0 si no se reparte)
  minOrder: number; // € mínimos de comida para la zona (0 si no se reparte)
}

// Zona para un código postal. Acepta el CP con espacios o dentro de un texto
// más largo ("Madrid 28015"). null = fuera de cobertura o CP no reconocido.
export function zoneForPostalCode(postalCode: string): number | null {
  const cp = postalCode.match(/\b\d{5}\b/)?.[0];
  if (!cp) return null;
  return ZONA_POR_CP[cp] ?? null;
}

// Precio de envío para un nivel de zona dado. Fuente de verdad del backend.
export function feeForZone(zone: number | null | undefined): number {
  if (!zone || zone < 1 || zone > ZONE_PRICES.length) return 0;
  return ZONE_PRICES[zone - 1];
}

// Pedido mínimo de comida (sin contar el envío) para poder servir a domicilio.
export function minOrderForZone(zone: number | null | undefined): number {
  if (!zone || zone < 1 || zone > ZONE_MIN_ORDER.length) return 0;
  return ZONE_MIN_ORDER[zone - 1];
}

// Etiqueta para la columna `deliveryZone` de la hoja: zona explícita SIEMPRE
// al principio ("Z2" o "Z2 · Salamanca"). El terminal de THE JUNGLE la parsea
// con /^Z(\d)/ — con las tarifas nuevas el precio ya no identifica la zona
// (3,90 € era Z2 y ahora es Z1), así que la etiqueta elimina la ambigüedad.
export function zoneLabel(zone: number, barrio?: string | null): string {
  const extra = barrio?.trim();
  return extra ? `Z${zone} · ${extra}` : `Z${zone}`;
}

// Cotiza el envío para un código postal. Síncrono: es un lookup en la tabla.
export function quoteDeliveryByPostalCode(postalCode: string): DeliveryQuote {
  const zone = zoneForPostalCode(postalCode);
  if (!zone) return { deliverable: false, zone: null, fee: 0, minOrder: 0 };
  return {
    deliverable: true,
    zone,
    fee: feeForZone(zone),
    minOrder: minOrderForZone(zone),
  };
}
