// Lógica de zonas de reparto compartida por el ZoneMap, el formulario de
// reserva y el backend de checkout.
//
// Modelo (ago 2026, handoff THE JUNGLE en 2 fases): la zona se decide por
// km de ruta (ida) desde la base — Calle Araucaria 19, 28039 — hasta la
// dirección de entrega. La distancia es una tabla estática CP → km y la zona
// una función de tramos configurable: pasar a la Fase 2 es cambiar UN objeto
// (TRAMOS_ENVIO), no tocar código. Sin APIs ni geocoding: instantáneo,
// idéntico en cliente y servidor.

// km de ruta (ida) estimados desde Calle Araucaria 19, 28039.
// Fuente: análisis THE JUNGLE ago-2026 (centroide de CP × factor de ruta 1,3).
const KM_POR_CP: Record<string, number> = {
  "28020": 0.5, "28039": 0.8, "28046": 1.8, "28029": 2.0, "28040": 2.6,
  "28003": 2.7, "28016": 2.8, "28036": 2.8, "28035": 3.1, "28002": 3.6,
  "28010": 4.0, "28006": 4.2, "28015": 4.4, "28034": 4.9, "28004": 5.2,
  "28008": 5.3, "28001": 5.4, "28028": 5.7, "28033": 6.0, "28013": 6.1,
  "28050": 6.3, "28009": 6.7, "28027": 6.8, "28012": 7.2, "28049": 7.3,
  "28017": 7.5, "28005": 7.6, "28007": 8.3, "28011": 9.1, "28045": 9.2,
  "28023": 9.4, "28030": 10.0, "28026": 10.9, "28025": 11.8, "28024": 12.0,
  // >12 km — quedan FUERA de reparto (tramoDe los rechaza):
  "28021": 16.4, "28031": 14.5, "28032": 12.6, "28051": 17.7, "28100": 13.9,
  "28341": 40.5, "28669": 23.6, "28706": 99, "28821": 15.6, "28850": 24.8,
  "28913": 19.7, "28934": 26.9, "28935": 29.8, "28938": 28.0,
};

// Radio máximo de reparto. CP no listado o por encima = sin envío (fallback
// seguro): solo recogida + WhatsApp; si un cliente legítimo cae fuera, se
// añade su CP a la tabla de arriba.
export const MAX_KM_REPARTO = 12;

export interface TramoEnvio {
  maxKm: number;
  zona: number;
  precio: number; // € de envío
  minimoPedido: number; // € mínimos de comida (sin envío); 0 = sin mínimo
}

// FASE 1 (activa): tarifas de HOY con el mapa corregido. Ningún CP cercano
// paga más; solo se corrigen los viajes ≥8 km regalados y se corta en 12 km.
const TRAMOS_ENVIO: TramoEnvio[] = [
  { maxKm: 5, zona: 1, precio: 2.9, minimoPedido: 0 },
  { maxKm: 8, zona: 2, precio: 3.9, minimoPedido: 0 },
  { maxKm: 12, zona: 3, precio: 5.9, minimoPedido: 0 },
];
// FASE 2 (NO activar aún — la activa Amos, ~3–4 semanas después, y requiere
// coordinar el MISMO día con el terminal de THE JUNGLE: umbrales de zonaDe()
// en js/analitica.js y Z4 en informes):
// const TRAMOS_ENVIO: TramoEnvio[] = [
//   { maxKm: 3,  zona: 1, precio: 3.9, minimoPedido: 15 },
//   { maxKm: 6,  zona: 2, precio: 4.9, minimoPedido: 15 },
//   { maxKm: 9,  zona: 3, precio: 6.9, minimoPedido: 25 },
//   { maxKm: 12, zona: 4, precio: 9.9, minimoPedido: 40 },
// ];

export interface DeliveryQuote {
  deliverable: boolean;
  zone: number | null;
  fee: number; // € (0 si no se reparte)
  minOrder: number; // € mínimos de comida para la zona (0 = sin mínimo)
}

// Tramo de envío para un código postal. Acepta el CP con espacios o dentro de
// un texto más largo ("Madrid 28015"). null = fuera de cobertura.
export function tramoForPostalCode(postalCode: string): TramoEnvio | null {
  const cp = postalCode.match(/\b\d{5}\b/)?.[0];
  if (!cp) return null;
  const km = KM_POR_CP[cp];
  if (km === undefined || km > MAX_KM_REPARTO) return null;
  return TRAMOS_ENVIO.find((t) => km <= t.maxKm) ?? null;
}

export function zoneForPostalCode(postalCode: string): number | null {
  return tramoForPostalCode(postalCode)?.zona ?? null;
}

// Precio de envío para un nivel de zona dado. Fuente de verdad del backend.
export function feeForZone(zone: number | null | undefined): number {
  return TRAMOS_ENVIO.find((t) => t.zona === zone)?.precio ?? 0;
}

// Pedido mínimo de comida (sin contar el envío) para servir a domicilio.
// En Fase 1 todos los tramos llevan 0: el chequeo existe pero está dormido.
export function minOrderForZone(zone: number | null | undefined): number {
  return TRAMOS_ENVIO.find((t) => t.zona === zone)?.minimoPedido ?? 0;
}

// Etiqueta para la columna `deliveryZone` de la hoja: zona explícita SIEMPRE
// al principio ("Z2" o "Z2 · Salamanca"). El terminal de THE JUNGLE la parsea
// con /^Z(\d)/ — cuando la Fase 2 cambie las tarifas, los precios viejos y
// nuevos se solapan (3,90 € es Z2 hoy y será Z1), así que el precio deja de
// identificar la zona; la etiqueta elimina la ambigüedad.
export function zoneLabel(zone: number, barrio?: string | null): string {
  const extra = barrio?.trim();
  return extra ? `Z${zone} · ${extra}` : `Z${zone}`;
}

// Cotiza el envío para un código postal. Síncrono: es un lookup en la tabla.
export function quoteDeliveryByPostalCode(postalCode: string): DeliveryQuote {
  const tramo = tramoForPostalCode(postalCode);
  if (!tramo) return { deliverable: false, zone: null, fee: 0, minOrder: 0 };
  return {
    deliverable: true,
    zone: tramo.zona,
    fee: tramo.precio,
    minOrder: tramo.minimoPedido,
  };
}
