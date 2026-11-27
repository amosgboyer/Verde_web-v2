import { describe, expect, it } from "vitest";
import { decidirDiaLineup } from "./lineup";

describe("lineup: nunca cambiar el día del pedido sin querer", () => {
  it("caso real 27-11: pedido para el domingo + Tigrillos desde la fila del viernes → sigue en domingo", () => {
    expect(decidirDiaLineup({ diaActual: "2026-11-29", fechaFila: "2026-11-27", hayPlatos: true })).toBe("respetar");
  });
  it("sin día elegido → la fila elige su día", () => {
    expect(decidirDiaLineup({ diaActual: "", fechaFila: "2026-11-27", hayPlatos: true })).toBe("elegir");
  });
  it("fila que solo es un día (Dom 29 · Todas) → cambia el día a propósito", () => {
    expect(decidirDiaLineup({ diaActual: "2026-11-28", fechaFila: "2026-11-29", hayPlatos: false })).toBe("elegir");
  });
  it("mismo día → nada que respetar", () => {
    expect(decidirDiaLineup({ diaActual: "2026-11-29", fechaFila: "2026-11-29", hayPlatos: true })).toBe("elegir");
  });
  it("fila sin día (recogida) → no toca el día", () => {
    expect(decidirDiaLineup({ diaActual: "2026-11-29", hayPlatos: false })).toBe("nada");
  });
});
