// Cálculo de IVA informativo. NO cambia ningún importe: los precios de Verde ya
// son finales CON IVA incluido; aquí solo se DESGLOSA el IVA que ya contienen.
//
// Todo el dinero se maneja en CÉNTIMOS ENTEROS. Nunca floats: se formatea solo
// al mostrar. La base se calcula desde el bruto (no al revés) para que
// base + vat === bruto exactamente, sin descuadres de redondeo.

// IVA del envío. Pendiente de confirmar con gestoría (podría ir al tipo del
// pedido o al general); de momento, reducido como la comida.
export const SHIPPING_VAT_RATE = 0.10;

export interface VatLine {
  /** Importe BRUTO (con IVA) en céntimos enteros. */
  gross: number;
  /** Tipo de IVA como fracción (0.10, 0.21…). */
  rate: number;
}

export interface VatGroup {
  rate: number;
  /** Base imponible en céntimos. */
  base: number;
  /** Cuota de IVA en céntimos. */
  vat: number;
}

export interface VatResult {
  /** Un grupo por tipo de IVA presente, ordenado por tipo ascendente. */
  groups: VatGroup[];
  baseTotal: number;
  vatTotal: number;
  grossTotal: number;
}

/**
 * Separa un bruto (con IVA) en base + cuota, en céntimos enteros.
 * base = redondeo(bruto / (1+tipo)); vat = bruto − base → base + vat === bruto.
 */
export function splitVat(
  grossAmount: number,
  rate: number
): { base: number; vat: number } {
  const base = Math.round(grossAmount / (1 + rate));
  return { base, vat: grossAmount - base };
}

/**
 * Desglosa un conjunto de líneas (y, opcionalmente, el envío) agrupando por tipo
 * de IVA. Suma el bruto de cada tipo y aplica splitVat una vez por grupo, así el
 * desglose cuadra al céntimo con el total. Soporta varios tipos a la vez.
 */
export function vatBreakdown(
  lines: VatLine[],
  shipping?: VatLine | null
): VatResult {
  const all = shipping && shipping.gross > 0 ? [...lines, shipping] : lines;
  const grossByRate = new Map<number, number>();
  for (const l of all) {
    if (l.gross <= 0) continue;
    grossByRate.set(l.rate, (grossByRate.get(l.rate) ?? 0) + l.gross);
  }
  const groups: VatGroup[] = [];
  let baseTotal = 0;
  let vatTotal = 0;
  let grossTotal = 0;
  for (const [rate, gross] of [...grossByRate.entries()].sort((a, b) => a[0] - b[0])) {
    const { base, vat } = splitVat(gross, rate);
    groups.push({ rate, base, vat });
    baseTotal += base;
    vatTotal += vat;
    grossTotal += gross;
  }
  return { groups, baseTotal, vatTotal, grossTotal };
}

/** Céntimos → "1.234,56" (formato español, sin el símbolo €). */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Tipo como porcentaje entero para mostrar: 0.10 → "10". */
export function ratePercent(rate: number): string {
  return String(Math.round(rate * 100));
}
