import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPacks,
  getProductById,
  getSalsas,
  PRODUCT_CHOICES,
  agotadoParaFecha,
  avisoEntrega,
  packParaFecha,
} from "./products";
import {
  getActiveWeekendOffer,
  computeOfferDiscount,
  offerGiftApplies,
  giftItemName,
  unidadPluralDe,
  esBlackFriday,
  regaloRecogidaAplica,
} from "./offers";

// Hora de Madrid (UTC+1 en noviembre).
const a = (iso: string) => vi.setSystemTime(new Date(`${iso}+01:00`));

afterEach(() => vi.useRealTimers());

const BOLLO = { id: "bollo-de-verde", name: "Bollo de Verde" };
const CHOCLO = { id: "la-chocletiza", name: "La Chocletiza" };

describe("Black Friday 2026 — lineup por día de entrega", () => {
  it("se abre hoy martes 24 a las 20:00 y se cierra al acabar el domingo 29", () => {
    vi.useFakeTimers();
    a("2026-11-24T19:59:00");
    expect(esBlackFriday()).toBe(false);
    expect(getActiveWeekendOffer()?.id).not.toBe("black-friday-2x1");
    expect(getSalsas().some((s) => s.id === "trio-salsas")).toBe(false);
    expect(getPacks().some((p) => p.id === "pack-dos-tigrillos-bf")).toBe(false);
    a("2026-11-24T20:00:00");
    expect(esBlackFriday()).toBe(true);
    expect(getActiveWeekendOffer()?.id).toBe("black-friday-2x1");
    expect(getSalsas()[0]).toMatchObject({ id: "trio-salsas", finalPrice: 4.5 });
    expect(getPacks().some((p) => p.id === "pack-dos-tigrillos-bf")).toBe(true);
    a("2026-11-29T23:00:00");
    expect(esBlackFriday()).toBe(true);
    a("2026-11-30T09:00:00");
    expect(esBlackFriday()).toBe(false);
    expect(getActiveWeekendOffer()?.id).not.toBe("black-friday-2x1");
    expect(getProductById("trio-salsas")?.available).toBe(false);
  });

  it("2×1: Bollo jueves y domingo; Chocletiza sábado y domingo", () => {
    vi.useFakeTimers();
    a("2026-11-25T12:00:00");
    const o = getActiveWeekendOffer();
    const g = (p: typeof BOLLO, d: string) => offerGiftApplies(o, p, d);
    expect([g(BOLLO, "2026-11-26"), g(BOLLO, "2026-11-27"), g(BOLLO, "2026-11-28"), g(BOLLO, "2026-11-29")])
      .toEqual([true, false, false, true]);
    expect([g(CHOCLO, "2026-11-26"), g(CHOCLO, "2026-11-27"), g(CHOCLO, "2026-11-28"), g(CHOCLO, "2026-11-29")])
      .toEqual([false, false, true, true]);
    // El regalo no baja el precio; cocina lo ve en el nombre del ítem.
    expect(
      computeOfferDiscount(o!, [{ productId: "bollo-de-verde", quantity: 2, unitPrice: 10 }], "2026-11-26")
    ).toEqual({ discountAmount: 0, discountedUnits: 0 });
    expect(giftItemName("Bollo de Verde", 2, unidadPluralDe(o, BOLLO))).toBe("Bollo de Verde (2×1 · 4 bollos)");
    expect(giftItemName("La Chocletiza", 1, unidadPluralDe(o, CHOCLO))).toBe("La Chocletiza (2×1 · 2 chocletizas)");
    expect(giftItemName("Empanada de Queso", 3)).toBe("Empanada de Queso (2×1 · 6 empanadas)");
  });

  it("Dos Tigrillos −30 % (20,30 €) solo entregas viernes y domingo; el de 29 € bloqueado esos días", () => {
    vi.useFakeTimers();
    a("2026-11-25T12:00:00");
    expect(getProductById("pack-dos-tigrillos-bf")?.finalPrice).toBe(20.3);
    expect(agotadoParaFecha("pack-dos-tigrillos-bf", "2026-11-26")).toBe(true);
    expect(agotadoParaFecha("pack-dos-tigrillos-bf", "2026-11-27")).toBe(false);
    expect(agotadoParaFecha("pack-dos-tigrillos-bf", "2026-11-28")).toBe(true);
    expect(agotadoParaFecha("pack-dos-tigrillos-bf", "2026-11-29")).toBe(false);
    expect(avisoEntrega("pack-dos-tigrillos-bf", "2026-11-28")).toContain("viernes 27 y del domingo 29");
    expect(agotadoParaFecha("pack-dos-tigrillos", "2026-11-27")).toBe(true);
    expect(agotadoParaFecha("pack-dos-tigrillos", "2026-11-28")).toBe(false);
    expect(agotadoParaFecha("pack-dos-tigrillos", "2026-11-29")).toBe(true);
    expect(getProductById("pack-dos-tigrillos")?.finalPrice).toBe(29);
  });

  it("Dos Tigrillos: el pack cambia solo según el día (bug 25-11: domingo sin −30 %)", () => {
    expect(packParaFecha("pack-dos-tigrillos", "2026-11-29")).toBe("pack-dos-tigrillos-bf");
    expect(packParaFecha("pack-dos-tigrillos", "2026-11-27")).toBe("pack-dos-tigrillos-bf");
    expect(packParaFecha("pack-dos-tigrillos", "2026-11-28")).toBe("pack-dos-tigrillos");
    expect(packParaFecha("pack-dos-tigrillos-bf", "2026-11-28")).toBe("pack-dos-tigrillos");
    expect(packParaFecha("pack-dos-tigrillos-bf", "2026-11-29")).toBe("pack-dos-tigrillos-bf");
    expect(packParaFecha("pack-dos-tigrillos", "")).toBe("pack-dos-tigrillos");
    expect(packParaFecha("tigrillo-mixto", "2026-11-29")).toBe("tigrillo-mixto");
  });

  it("trío de salsas: entregas del miércoles 25 al domingo 29", () => {
    expect(agotadoParaFecha("trio-salsas", "2026-11-24")).toBe(true);
    expect(agotadoParaFecha("trio-salsas", "2026-11-25")).toBe(false);
    expect(agotadoParaFecha("trio-salsas", "2026-11-29")).toBe(false);
    expect(agotadoParaFecha("trio-salsas", "2026-11-30")).toBe(true);
  });

  it("packs: solo Dos Tigrillos (29 €) y, en sus días, el −30 %; fuera los de Maduro con Macambo", () => {
    vi.useFakeTimers();
    a("2026-11-25T12:00:00");
    const ids = getPacks().map((p) => p.id);
    expect(ids.sort()).toEqual(["pack-dos-tigrillos", "pack-dos-tigrillos-bf"]);
    a("2026-11-30T12:00:00");
    expect(getPacks().map((p) => p.id)).toEqual(["pack-dos-tigrillos"]);
    expect(getProductById("maduro-con-macambo")?.category).toBe("maduro");
    void PRODUCT_CHOICES;
  });

  it("empanada de regalo al RECOGER en el local, del 25 al 29 (desde hoy 20:00)", () => {
    vi.useFakeTimers();
    a("2026-11-24T19:00:00");
    expect(regaloRecogidaAplica("pickup", "2026-11-25")).toBe(false);
    a("2026-11-24T20:00:00");
    expect(regaloRecogidaAplica("pickup", "2026-11-25")).toBe(true);
    expect(regaloRecogidaAplica("pickup", "2026-11-29")).toBe(true);
    expect(regaloRecogidaAplica("delivery", "2026-11-27")).toBe(false);
    expect(regaloRecogidaAplica("pickup", "2026-11-30")).toBe(false);
  });
});
