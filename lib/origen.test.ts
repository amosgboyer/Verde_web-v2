import { describe, expect, it } from "vitest";
import {
  codificarOrigen,
  combinarOrigen,
  decodificarOrigen,
  limpiarValor,
  origenDeVisita,
} from "./origen";

const HOST = "www.verdemadrid.com";

describe("origenDeVisita", () => {
  it("lee los UTMs del enlace de la bio", () => {
    expect(
      origenDeVisita("https://www.verdemadrid.com/?utm_source=instagram&utm_medium=social&utm_campaign=bio", "", HOST)
    ).toEqual({ utmSource: "instagram", utmCampaign: "bio", referrer: "" });
  });

  it("apunta solo el dominio del referrer externo, nunca la URL completa", () => {
    expect(origenDeVisita("https://www.verdemadrid.com/", "https://l.instagram.com/?u=https%3A%2F%2Fx&e=AT0", HOST)).toEqual({
      utmSource: "",
      utmCampaign: "",
      referrer: "l.instagram.com",
    });
  });

  it("ignora la navegación interna, con o sin www", () => {
    expect(origenDeVisita("https://verdemadrid.com/gracias", "https://www.verdemadrid.com/", "verdemadrid.com")).toBeNull();
    expect(origenDeVisita("https://www.verdemadrid.com/", "https://verdemadrid.com/carta", HOST)).toBeNull();
  });

  it("no cuenta la vuelta del pago como procedencia", () => {
    expect(origenDeVisita("https://www.verdemadrid.com/gracias", "https://checkout.stripe.com/c/pay/x", HOST)).toBeNull();
  });

  it("devuelve null sin UTMs ni referrer, y con URL o referrer ilegibles", () => {
    expect(origenDeVisita("https://www.verdemadrid.com/", "", HOST)).toBeNull();
    expect(origenDeVisita("no es una url", "", HOST)).toBeNull();
    expect(origenDeVisita("https://www.verdemadrid.com/", "basura", HOST)).toBeNull();
  });

  it("limpia valores raros y largos", () => {
    const o = origenDeVisita(`https://x.com/?utm_source=Insta<script>&utm_campaign=${"a".repeat(200)}`, "", HOST);
    expect(o?.utmSource).toBe("instascript");
    expect(o?.utmCampaign.length).toBe(80);
  });
});

describe("combinarOrigen", () => {
  const ig = { utmSource: "instagram", utmCampaign: "bio", referrer: "" };
  const google = { utmSource: "", utmCampaign: "", referrer: "google.com" };
  const DIA = 24 * 60 * 60 * 1000;

  it("un enlace con UTMs siempre gana", () => {
    expect(combinarOrigen(ig, { origen: google, t: 0 }, 1000)?.origen).toEqual(ig);
  });

  it("un referrer suelto no pisa lo que ya había", () => {
    const g = { origen: ig, t: 0 };
    expect(combinarOrigen(google, g, DIA)).toBe(g);
  });

  it("lo guardado caduca a los 7 días", () => {
    expect(combinarOrigen(null, { origen: ig, t: 0 }, 8 * DIA)).toBeNull();
    expect(combinarOrigen(google, { origen: ig, t: 0 }, 8 * DIA)?.origen).toEqual(google);
  });
});

describe("codificar / decodificar", () => {
  it("cabe en una sola clave de metadata y vuelve igual", () => {
    const o = { utmSource: "instagram", utmCampaign: "story-2026-10-20", referrer: "l.instagram.com" };
    const s = codificarOrigen(o);
    expect(s).toBe("instagram|story-2026-10-20|l.instagram.com");
    expect(s.length).toBeLessThanOrEqual(500);
    expect(decodificarOrigen(s)).toEqual(o);
  });

  it("sin origen no manda nada, y decodificar vacío da campos vacíos", () => {
    expect(codificarOrigen(null)).toBe("");
    expect(codificarOrigen({ utmSource: "", utmCampaign: "", referrer: "" })).toBe("");
    expect(decodificarOrigen(undefined)).toEqual({ utmSource: "", utmCampaign: "", referrer: "" });
  });

  it("un '|' colado en un valor no rompe el formato", () => {
    expect(limpiarValor("a|b")).toBe("ab");
  });
});
