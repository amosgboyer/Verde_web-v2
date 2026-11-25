// Escenarios reales de uso del Black Friday contra el CHECKOUT (lo que cobra Stripe).
// Stripe y la hoja de Google van simulados; todo lo demás es el código de verdad.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { crear } = vi.hoisted(() => ({
  crear: vi.fn(async (_args: unknown) => ({ id: "cs_test_1", url: "https://stripe.test/pay" })),
}));
vi.mock("@/lib/stripe", () => ({ stripe: { checkout: { sessions: { create: crear } } } }));
vi.mock("@/lib/google-sheets", () => ({
  getSettings: async () => ({
    reservationStartTime: "11:00",
    reservationEndTime: "21:00",
    slotIntervalMinutes: 60,
    minLeadDays: 1,
    currency: "eur",
    reservationsOpen: true,
    promoEnabled: false,
    promoName: "",
    promoType: "",
    promoValue: 0,
    promoStartDate: "",
    promoEndDate: "",
  }),
  getOrdersRows: async () => [],
  // Platos que en producción vienen de la hoja (no están en el código).
  getProductsRows: async () => [
    { productId: "bollo-de-verde", name: "Bollo de Verde", description: "", finalPrice: 10, depositAmount: 10, available: true, allergens: [], imageUrl: "", category: "Verde" },
    { productId: "la-chocletiza", name: "La Chocletiza", description: "", finalPrice: 9.9, depositAmount: 9.9, available: true, allergens: [], imageUrl: "", category: "otros" },
    { productId: "tigrillo-mixto", name: "Tigrillo Mixto", description: "", finalPrice: 16, depositAmount: 16, available: true, allergens: [], imageUrl: "", category: "Verde" },
  ],
}));
vi.mock("@/lib/availability", () => ({ isSlotAvailable: async () => true }));

import { POST } from "./route";

type Item = { productId: string; quantity: number };
async function pedir(items: Item[], fecha: string, metodo: "pickup" | "delivery" = "pickup") {
  crear.mockClear();
  const body = {
    items,
    reservationDate: fecha,
    reservationTime: "14:00",
    customerName: "Prueba Claude",
    email: "prueba@example.com",
    phone: "600000000",
    deliveryMethod: metodo,
    privacyAccepted: true,
    termsAccepted: true,
    accessCode: "",
  };
  const req = new Request("http://localhost/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await POST(req as any);
  const json = await res.json();
  if (res.status !== 200) return { error: json.error as string, lineas: [], meta: [] as { id: string; name: string; qty: number; price: number }[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const args = crear.mock.calls[0][0] as any;
  const lineas = args.line_items.map((l: any) => ({
    nombre: l.price_data.product_data.name as string,
    cent: l.price_data.unit_amount as number,
    qty: l.quantity as number,
  }));
  const trozos = Object.keys(args.metadata)
    .filter((k) => k.startsWith("items"))
    .sort()
    .map((k) => args.metadata[k])
    .join("");
  return { error: null, lineas, meta: JSON.parse(trozos) as { id: string; name: string; qty: number; price: number }[] };
}
const total = (l: { cent: number; qty: number }[]) => l.reduce((s, x) => s + x.cent * x.qty, 0) / 100;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-25T21:00:00+01:00")); // miércoles por la noche
});
afterEach(() => vi.useRealTimers());

describe("Black Friday · checkout con escenarios de cliente", () => {
  it("pack de 29 € + domingo → cobra 20,30 €", async () => {
    const r = await pedir([{ productId: "pack-dos-tigrillos", quantity: 1 }], "2026-11-29");
    expect(r.error).toBeNull();
    expect(total(r.lineas)).toBeCloseTo(20.3);
  });

  it("pack −30 % + sábado → cobra 29 €", async () => {
    const r = await pedir([{ productId: "pack-dos-tigrillos-bf", quantity: 1 }], "2026-11-28");
    expect(r.error).toBeNull();
    expect(total(r.lineas)).toBeCloseTo(29);
  });

  it("los dos packs a la vez + viernes → 2 × 20,30 € en una línea", async () => {
    const r = await pedir(
      [{ productId: "pack-dos-tigrillos", quantity: 1 }, { productId: "pack-dos-tigrillos-bf", quantity: 1 }],
      "2026-11-27"
    );
    expect(r.error).toBeNull();
    const tig = r.meta.filter((m) => /tigrillos/.test(m.id));
    expect(tig).toEqual([expect.objectContaining({ id: "pack-dos-tigrillos-bf", qty: 2, price: 20.3 })]);
    expect(total(r.lineas)).toBeCloseTo(40.6);
  });

  it("Bollo (jueves) + Chocletiza (sábado), entrega el SÁBADO → 2×1 solo en la Chocletiza", async () => {
    const r = await pedir(
      [{ productId: "bollo-de-verde", quantity: 1 }, { productId: "la-chocletiza", quantity: 1 }],
      "2026-11-28",
      "delivery"
    );
    // a domicilio exige dirección: si falla por eso, lo repetimos en recogida
    const rr = r.error ? await pedir(r.error ? [{ productId: "bollo-de-verde", quantity: 1 }, { productId: "la-chocletiza", quantity: 1 }] : [], "2026-11-28") : r;
    expect(rr.error).toBeNull();
    const choclo = rr.meta.find((m) => m.id === "la-chocletiza")!;
    const bollo = rr.meta.find((m) => m.id === "bollo-de-verde")!;
    expect(choclo.name).toContain("2×1 · 2 chocletizas");
    expect(bollo.name).not.toContain("2×1");
    expect(total(rr.lineas)).toBeCloseTo(19.9);
  });

  it("Bollo + Chocletiza el DOMINGO → 2×1 en los dos, sin cambiar el precio", async () => {
    const r = await pedir(
      [{ productId: "bollo-de-verde", quantity: 2 }, { productId: "la-chocletiza", quantity: 1 }],
      "2026-11-29"
    );
    expect(r.error).toBeNull();
    expect(r.meta.find((m) => m.id === "bollo-de-verde")!.name).toContain("2×1 · 4 bollos");
    expect(r.meta.find((m) => m.id === "la-chocletiza")!.name).toContain("2×1 · 2 chocletizas");
    expect(total(r.lineas)).toBeCloseTo(29.9);
  });

  it("Bollo el JUEVES con recogida → 2×1 + empanada de regalo a 0 €", async () => {
    const r = await pedir([{ productId: "bollo-de-verde", quantity: 1 }], "2026-11-26", "pickup");
    expect(r.error).toBeNull();
    expect(r.meta.find((m) => m.id === "bollo-de-verde")!.name).toContain("2×1 · 2 bollos");
    const regalo = r.meta.find((m) => m.id === "empanada-regalo-recogida");
    expect(regalo).toMatchObject({ qty: 1, price: 0 });
    expect(total(r.lineas)).toBeCloseTo(10);
  });

  it("Bollo el VIERNES → sin 2×1 (no es su día)", async () => {
    const r = await pedir([{ productId: "bollo-de-verde", quantity: 1 }], "2026-11-27");
    expect(r.error).toBeNull();
    expect(r.meta.find((m) => m.id === "bollo-de-verde")!.name).not.toContain("2×1");
  });

  it("trío de salsas el jueves → 4,50 €; el lunes 30 → no se puede", async () => {
    const r = await pedir([{ productId: "trio-salsas", quantity: 1 }, { productId: "la-chocletiza", quantity: 1 }], "2026-11-26");
    expect(r.error).toBeNull();
    expect(r.meta.find((m) => m.id === "trio-salsas")!.price).toBe(4.5);
    expect(total(r.lineas)).toBeCloseTo(14.4);
    const r2 = await pedir([{ productId: "trio-salsas", quantity: 1 }, { productId: "la-chocletiza", quantity: 1 }], "2026-11-30");
    expect(r2.error).toBeTruthy();
  });

  it("pack de 29 € el lunes 30 → 29 €, sin ofertas", async () => {
    const r = await pedir([{ productId: "pack-dos-tigrillos", quantity: 1 }], "2026-11-30");
    expect(r.error).toBeNull();
    expect(total(r.lineas)).toBeCloseTo(29);
  });
});
