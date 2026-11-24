import { afterEach, describe, expect, it, vi } from "vitest";
import { getPacks, getProductById, getSalsas, PRODUCT_CHOICES, agotadoParaFecha, avisoEntrega } from "./products";
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
  it("Dos Tigrillos: pack de 27 € solo para entregas 27-29; el de 29 € bloqueado esos días", () => {
    vi.useFakeTimers();
    enMadrid("2026-11-25");
    expect(getPacks().some((p) => p.id === "pack-dos-tigrillos-bf")).toBe(false);
    enMadrid("2026-11-26");
    expect(getPacks().some((p) => p.id === "pack-dos-tigrillos-bf")).toBe(true);
    expect(getProductById("pack-dos-tigrillos-bf")?.finalPrice).toBe(27);
    expect(agotadoParaFecha("pack-dos-tigrillos-bf", "2026-11-26")).toBe(true);
    expect(agotadoParaFecha("pack-dos-tigrillos-bf", "2026-11-27")).toBe(false);
    expect(agotadoParaFecha("pack-dos-tigrillos-bf", "2026-11-30")).toBe(true);
    expect(agotadoParaFecha("pack-dos-tigrillos", "2026-11-26")).toBe(false);
    expect(agotadoParaFecha("pack-dos-tigrillos", "2026-11-28")).toBe(true);
    expect(getProductById("pack-dos-tigrillos")?.finalPrice).toBe(29);
  });

  it("2×1 en Chocletiza (pide 1, llévate 2) activo solo del 27 al 29", () => {
    vi.useFakeTimers();
    enMadrid("2026-11-25");
    expect(getActiveWeekendOffer()?.id).not.toBe("chocletiza-black-friday");
    enMadrid("2026-11-26"); // se abre el jueves…
    expect(getActiveWeekendOffer()?.id).toBe("chocletiza-black-friday");
    // …pero solo vale para entregas vie-dom
    expect(offerGiftApplies(getActiveWeekendOffer(), { id: "la-chocletiza" }, "2026-11-26")).toBe(false);
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

  it("packs: fuera Bolón + Patacón y los dos de Macambo; dentro Black Friday Dulce con elección", () => {
    const ids = getPacks().map((p) => p.id);
    expect(ids).not.toContain("pack-bolon-patacon");
    expect(ids).not.toContain("pack-canoa-macambo");
    expect(ids).not.toContain("pack-bolon-macambo");
    expect(ids).toContain("pack-black-friday-dulce");
    expect(getProductById("pack-black-friday-dulce")?.finalPrice).toBe(16.9);
    expect(PRODUCT_CHOICES.find((c) => c.productId === "pack-black-friday-dulce")?.options).toEqual([
      "Canoa de Maduro",
      "Bolón Mixto con Maduro",
    ]);
  });

  it("trío de salsas a 4,50 €: se ve desde ya, entregas del 25 al 29", () => {
    vi.useFakeTimers();
    enMadrid("2026-11-24");
    expect(getSalsas()[0]).toMatchObject({ id: "trio-salsas", finalPrice: 4.5 });
    expect(agotadoParaFecha("trio-salsas", "2026-11-24")).toBe(true);
    expect(agotadoParaFecha("trio-salsas", "2026-11-25")).toBe(false);
    expect(agotadoParaFecha("trio-salsas", "2026-11-29")).toBe(false);
    expect(agotadoParaFecha("trio-salsas", "2026-11-30")).toBe(true);
    enMadrid("2026-11-30");
    expect(getProductById("trio-salsas")?.available).toBe(false);
  });

  it("Mar y Tierra a 23 €: se pide desde ya, solo para entregas del jueves 26", () => {
    vi.useFakeTimers();
    enMadrid("2026-11-24");
    expect(getPacks().some((p) => p.id === "pack-mar-y-tierra")).toBe(true);
    expect(agotadoParaFecha("pack-mar-y-tierra", "2026-11-25")).toBe(true);
    expect(agotadoParaFecha("pack-mar-y-tierra", "2026-11-26")).toBe(false);
    expect(agotadoParaFecha("pack-mar-y-tierra", "2026-11-27")).toBe(true);
    expect(avisoEntrega("pack-mar-y-tierra", "2026-11-27")).toContain("jueves 26");
    enMadrid("2026-11-27");
    expect(getPacks().some((p) => p.id === "pack-mar-y-tierra")).toBe(false);
    expect(getProductById("pack-mar-y-tierra")?.finalPrice).toBe(23);
  });
});
