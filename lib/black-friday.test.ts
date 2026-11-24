import { afterEach, describe, expect, it, vi } from "vitest";
import { getPacks, getProductById, getSalsas } from "./products";
import {
  getActiveWeekendOffer,
  computeOfferDiscount,
  offerGiftApplies,
  giftItemName,
} from "./offers";

// 12:00 en Madrid del día indicado (UTC+1 en noviembre).
const enMadrid = (dia: string) => vi.setSystemTime(new Date(`${dia}T11:00:00Z`));

afterEach(() => vi.useRealTimers());

describe("Black Friday 2026", () => {
  it("Dos Tigrillos a 27 € solo del 27 al 29, en la carta y en el cobro", () => {
    vi.useFakeTimers();
    for (const [dia, precio] of [
      ["2026-11-26", 29],
      ["2026-11-27", 27],
      ["2026-11-29", 27],
      ["2026-11-30", 29],
    ] as const) {
      enMadrid(dia);
      expect(getProductById("pack-dos-tigrillos")?.depositAmount, dia).toBe(precio);
      expect(getPacks().find((p) => p.id === "pack-dos-tigrillos")?.finalPrice, dia).toBe(precio);
    }
  });

  it("2×1 en Chocletiza (pide 1, llévate 2) activo solo del 27 al 29", () => {
    vi.useFakeTimers();
    enMadrid("2026-11-26");
    expect(getActiveWeekendOffer()?.id).not.toBe("chocletiza-black-friday");
    enMadrid("2026-11-28");
    const oferta = getActiveWeekendOffer();
    expect(oferta?.id).toBe("chocletiza-black-friday");
    const d = computeOfferDiscount(
      oferta!,
      [{ productId: "la-chocletiza", productName: "La Chocletiza", quantity: 3, unitPrice: 9.9 }],
      "2026-11-29"
    );
    // El precio no baja: el regalo va en unidades, y cocina lo ve en el nombre.
    expect(d).toEqual({ discountAmount: 0, discountedUnits: 0 });
    expect(offerGiftApplies(oferta, { id: "la-chocletiza", name: "La Chocletiza" }, "2026-11-29")).toBe(true);
    expect(giftItemName("La Chocletiza", 2, oferta!.unidadPlural)).toBe(
      "La Chocletiza (2×1 · 4 chocletizas)"
    );
    // La empanada sigue diciendo "empanadas".
    expect(giftItemName("Empanada de Queso", 3)).toBe("Empanada de Queso (2×1 · 6 empanadas)");
    enMadrid("2026-11-30");
    expect(getActiveWeekendOffer()?.id).not.toBe("chocletiza-black-friday");
  });

  it("packs: fuera Bolón + Patacón, dentro los dos de Macambo", () => {
    const ids = getPacks().map((p) => p.id);
    expect(ids).not.toContain("pack-bolon-patacon");
    expect(getProductById("pack-canoa-macambo")?.finalPrice).toBe(17);
    expect(getProductById("pack-bolon-macambo")?.finalPrice).toBe(15.9);
  });

  it("trío de salsas a 4,50 €, el primero del popup de extras", () => {
    expect(getSalsas()[0]).toMatchObject({ id: "trio-salsas", finalPrice: 4.5 });
  });
});
