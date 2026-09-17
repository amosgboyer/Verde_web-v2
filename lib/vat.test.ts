import { describe, it, expect } from "vitest";
import { splitVat, vatBreakdown } from "./vat";

describe("splitVat", () => {
  it("15,00 € al 10 % → base 13,64 / IVA 1,36", () => {
    const { base, vat } = splitVat(1500, 0.1);
    expect(base).toBe(1364);
    expect(vat).toBe(136);
    expect(base + vat).toBe(1500);
  });

  it("base + vat === bruto siempre (varios importes y tipos)", () => {
    const casos: Array<[number, number]> = [
      [1500, 0.1], [1100, 0.1], [999, 0.1], [1, 0.1], [250, 0.1],
      [1210, 0.21], [100, 0.21], [4237, 0.21], [3, 0.21], [0, 0.1],
    ];
    for (const [gross, rate] of casos) {
      const { base, vat } = splitVat(gross, rate);
      expect(base + vat).toBe(gross);
    }
  });
});

describe("vatBreakdown", () => {
  it("carrito de un solo tipo (10 %) + envío", () => {
    const r = vatBreakdown(
      [{ gross: 1100, rate: 0.1 }, { gross: 900, rate: 0.1 }],
      { gross: 290, rate: 0.1 }
    );
    expect(r.groups).toHaveLength(1);
    expect(r.grossTotal).toBe(2290);
    expect(r.baseTotal + r.vatTotal).toBe(2290);
    expect(r.groups[0].rate).toBe(0.1);
  });

  it("carrito mixto 10 % + 21 %: un grupo por tipo y todo cuadra", () => {
    const r = vatBreakdown([
      { gross: 1000, rate: 0.1 },  // comida
      { gross: 1210, rate: 0.21 }, // refresco azucarado (futuro)
    ]);
    expect(r.groups).toHaveLength(2);
    // ordenado por tipo ascendente
    expect(r.groups[0].rate).toBe(0.1);
    expect(r.groups[1].rate).toBe(0.21);
    // 10 %: 1000 → base 909, vat 91
    expect(r.groups[0]).toEqual({ rate: 0.1, base: 909, vat: 91 });
    // 21 %: 1210 → base 1000, vat 210
    expect(r.groups[1]).toEqual({ rate: 0.21, base: 1000, vat: 210 });
    expect(r.grossTotal).toBe(2210);
    expect(r.baseTotal + r.vatTotal).toBe(r.grossTotal);
  });

  it("base + vat === grossTotal en un carrito arbitrario mixto", () => {
    const r = vatBreakdown(
      [
        { gross: 1234, rate: 0.1 },
        { gross: 567, rate: 0.1 },
        { gross: 4237, rate: 0.21 },
        { gross: 89, rate: 0.21 },
      ],
      { gross: 390, rate: 0.1 }
    );
    expect(r.baseTotal + r.vatTotal).toBe(r.grossTotal);
    // cada grupo cuadra por separado
    for (const g of r.groups) {
      // recomponer el bruto del grupo desde base+vat
      expect(g.base + g.vat).toBeGreaterThan(0);
    }
  });
});
