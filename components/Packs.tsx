"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import type { WeekendOffer } from "@/lib/offers";
import { productMatchesOffer, offerBadgeLabel, offerReservationText } from "@/lib/offers";
import OfferCountdown from "./OfferCountdown";
import { getPacks, PRODUCT_CHOICES, mismoId, esPlatoDorado, promoVigente } from "@/lib/products";

// Nombre, descripción y PRECIO salen de lib/products.ts — que es lo que cobra
// el checkout. Antes estaban copiados aquí a mano y un cambio de precio en el
// catálogo dejaba este escaparate anunciando otro. Aquí solo vive lo que es
// puramente de presentación (destacado, cinta y el "ahorras X").
const PRESENTACION: Record<
  string,
  { titulo: string; ahorro: string; ahorroPromo?: string; featured?: boolean; ribbon?: string }
> = {
  "pack-dos-tigrillos": {
    titulo: "Los Dos Tigrillos",
    ahorro: "ahorras 3€",
    ahorroPromo: "ahorras 5€", // Black Friday: 27 € frente a 32 € sueltos
    featured: true,
    ribbon: "Popular",
  },
  "pack-canoa-macambo": {
    titulo: "Canoa + Maduro con Macambo",
    ahorro: "ahorras 3€",
    ribbon: "Nuevo",
  },
  "pack-dos-tigrillos-bf": {
    titulo: "Los Dos Tigrillos −30%",
    ahorro: "antes 29€ · vie 27 y dom 29",
    featured: true,
    ribbon: "Black Friday",
  },
  "pack-black-friday-dulce": {
    titulo: "Black Friday Dulce",
    ahorro: "ahorras hasta 3,10€",
    featured: true,
    ribbon: "Nuevo",
  },
  "pack-mar-y-tierra": {
    titulo: "Mar y Tierra",
    ahorro: "ahorras 3€",
    featured: true,
    ribbon: "Jueves 26",
  },
  "pack-bolon-macambo": {
    titulo: "Bolón con Maduro + Macambo",
    ahorro: "ahorras 2,10€",
  },
  "pack-bolon-patacon": { titulo: "Bolón + Patacón", ahorro: "ahorras 2€" },
  "pack-grupo": { titulo: "Para Todo el Grupo", ahorro: "ahorras 2€" },
  // Menús con bebida: la bebida sale a 1,90 € dentro del menú (suelta 2,50).
  "menu-tigrillo": { titulo: "Menú Tigrillo", ahorro: "bebida a 1,90€" },
  "menu-corviche": { titulo: "Menú Corviche", ahorro: "bebida a 1,90€" },
  "menu-ceviche": { titulo: "Menú Ceviche", ahorro: "bebida a 1,90€" },
  "menu-sango": { titulo: "Menú Sango", ahorro: "bebida a 1,90€" },
};

// Lineup de Black Friday 2026 (Amos, 24-11). Días = días de ENTREGA. Las
// reglas de verdad están en lib/offers.ts (2×1) y lib/products.ts (trío y
// Tigrillos −30 %); esto solo lo cuenta.
const LINEUP_BF: { dia: string; oferta: string; nota?: string; sello: string; todo?: boolean }[] = [
  { dia: "Toda la semana", oferta: "Recoge en el local", nota: "Te regalamos una Empanada de Queso", sello: "GRATIS" },
  { dia: "Mié 25", oferta: "Trío de salsas", nota: "Ají + verde + maní, toda la semana", sello: "4,50€" },
  { dia: "Jue 26", oferta: "Bollo de Verde", nota: "Pide 1 y llévate 2", sello: "2×1" },
  { dia: "Vie 27", oferta: "Pack Dos Tigrillos", nota: "20,30 € en vez de 29 €", sello: "−30%" },
  { dia: "Sáb 28", oferta: "La Chocletiza", nota: "Pide 1 y llévate 2", sello: "2×1" },
  { dia: "Dom 29", oferta: "Todas las ofertas", nota: "Bollo 2×1 · Tigrillos −30% · Chocletiza 2×1 · Trío", sello: "TODO", todo: true },
];

// Precio en formato español, entero sin decimales: "27€", "14,50€".
function fmtPrecio(n: number): string {
  return (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",")) + "€";
}

// Si el pack lleva una promo vigente (Black Friday…), la cinta es la de la
// promo y el ahorro sale de `ahorroPromo`.
const PACKS = getPacks().map((p) => {
  const base = PRESENTACION[p.id] ?? { titulo: p.name, ahorro: "" };
  const pres =
    p.promo && promoVigente(p)
      ? { ...base, ribbon: p.promo.etiqueta, ahorro: base.ahorroPromo ?? base.ahorro }
      : base;
  return {
    id: p.id,
    name: pres.titulo,
    desc: p.description,
    price: fmtPrecio(p.finalPrice),
    saving: pres.ahorro,
    featured: pres.featured ?? false,
    ribbon: pres.ribbon,
    items: [{ id: p.id, qty: 1 }],
  };
});

interface PacksProps {
  readOnly?: boolean;
  /** Platos nuevos que van arriba, antes de los packs. Vienen de la carta real
   *  (Sheet si está), así que su precio es el que se cobra. */
  destacados?: Product[];
  /** El menú de la semana (fila `menu-semana` del Sheet). Se pinta como la
   *  card MÁS destacada del bloque de packs, con la bebida a elegir. */
  menuSemana?: Product;
  /** Oferta activa (2×1, 2ª al 50 %…). Si cae sobre un plato de Novedades,
   *  su card lo anuncia. */
  weekendOffer?: WeekendOffer | null;
  /** Semana de Black Friday: fondo negro, acentos dorados y textos de campaña.
   *  Lo decide el servidor (fecha de Madrid) para que no parpadee al cargar. */
  blackFriday?: boolean;
}

export default function Packs({ readOnly = false, destacados = [], menuSemana, weekendOffer = null, blackFriday = false }: PacksProps) {
  const hayNovedades = destacados.length > 0;

  // Bebida del menú de la semana: se elige AQUÍ, en la propia tarjeta, y
  // viaja con el evento al carrito (y de ahí a las notas del pedido).
  const menuChoice = menuSemana
    ? PRODUCT_CHOICES.find((c) => mismoId(c.productId, menuSemana.id))
    : undefined;
  const [bebidaMenu, setBebidaMenu] = useState<string>(
    menuChoice?.options[0] ?? ""
  );
  // Packs con elección (p. ej. Black Friday Dulce: Canoa o Bolón). Igual que la
  // bebida del menú: se elige en la tarjeta y viaja con el evento al carrito.
  const [packChoices, setPackChoices] = useState<Record<string, string>>({});

  // El bloque admite las dos cosas, así que el texto se adapta a lo que hay.
  const copy = blackFriday
    ? {
        eyebrow: "Black Friday · Lineup de la semana",
        titulo: "Black Friday en Verde",
        sub: "Una oferta para cada día de entrega. El domingo, todas a la vez.",
      }
    : hayNovedades
    ? {
        eyebrow: "Novedades · Combinaciones",
        titulo: "Lo nuevo y lo que más se pide",
        sub: "Los platos recién llegados y las combinaciones de siempre, al mejor precio.",
      }
    : {
        eyebrow: "Combinaciones",
        titulo: "Packs de la casa",
        sub: "Las combinaciones que más piden. Un poco de todo lo mejor, al mejor precio.",
      };

  const subtitulo = (texto: string) => (
    <p
      className="font-mono text-[0.62rem] tracking-[0.25em] uppercase mb-3 mt-1"
      style={{ color: "var(--g3, #7ab356)" }}
    >
      {texto}
    </p>
  );

  return (
    <section
      className="px-5 py-10 sm:px-8 sm:py-[4.5rem]"
      style={
        blackFriday
          ? ({
              background: "linear-gradient(180deg, #050505 0%, #111 100%)",
              borderTop: "2px solid var(--gold, #c8960a)",
              borderBottom: "2px solid var(--gold, #c8960a)",
              // Los rótulos verdes de la sección pasan a dorado.
              "--g3": "#e0b23a",
            } as React.CSSProperties)
          : { background: "var(--g0, #1c3a10)" }
      }
    >
      <div className="max-w-[1060px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[480px] mx-auto mb-6 sm:mb-10">
          <p className="font-mono text-[0.68rem] tracking-[0.2em] uppercase mb-2"
            style={{ color: "var(--g3, #7ab356)" }}>
            {copy.eyebrow}
          </p>
          <h2
            className="font-sans font-bold mb-2"
            style={{
              color: "var(--cream, #f2ead8)",
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              lineHeight: 1.15,
            }}
          >
            {copy.titulo}
          </h2>
          <p className="text-[0.85rem] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            {copy.sub}
          </p>
        </div>

        {/* ── Lineup de Black Friday: una oferta por día de ENTREGA ── */}
        {blackFriday && (
          <ol className="max-w-[520px] mx-auto mb-8 sm:mb-12 rounded-[14px] overflow-hidden"
            style={{ border: "1px solid rgba(224,178,58,0.45)" }}>
            {LINEUP_BF.map((d, i) => (
              <li
                key={d.dia}
                className="flex items-center gap-3 px-4 py-3 text-left"
                style={{
                  background: d.todo ? "rgba(224,178,58,0.16)" : i % 2 ? "rgba(255,255,255,0.03)" : "transparent",
                  borderTop: i ? "1px solid rgba(224,178,58,0.18)" : undefined,
                }}
              >
                <span
                  className="font-mono text-[0.68rem] tracking-[0.12em] uppercase w-[72px] shrink-0"
                  style={{ color: "#e0b23a" }}
                >
                  {d.dia}
                </span>
                <span className="flex-1 text-[0.86rem] font-semibold" style={{ color: "var(--cream, #f2ead8)" }}>
                  {d.oferta}
                  {d.nota && (
                    <span className="block text-[0.72rem] font-normal" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {d.nota}
                    </span>
                  )}
                </span>
                <span
                  className="text-[0.7rem] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "#e0b23a", color: "#111" }}
                >
                  {d.sello}
                </span>
              </li>
            ))}
          </ol>
        )}

        {/* ── Novedades: platos nuevos, antes de los packs ── */}
        {hayNovedades && (
          <div className="mb-8 sm:mb-12">
            {subtitulo("Novedades")}
            <div
              className="gsap-stagger grid gap-3 sm:gap-5"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
            >
              {destacados.map((plato) => (
                <article
                  key={plato.id}
                  className="relative rounded-[14px] p-4 sm:p-[1.6rem] overflow-hidden flex flex-col items-center text-center"
                  style={
                    esPlatoDorado(plato.id)
                      ? {
                          // Mismo dorado intenso que la card del Menú de la Semana.
                          background:
                            "linear-gradient(150deg, rgba(200,150,10,0.28), rgba(200,90,42,0.22))",
                          border: "1.5px solid var(--gold, #c8960a)",
                          boxShadow: "0 8px 44px rgba(200,150,10,0.35)",
                        }
                      : {
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(200,150,10,0.45)",
                        }
                  }
                >
                  <div
                    className="absolute top-[26px] right-[-44px] w-[160px] text-center text-[0.62rem] font-medium tracking-[0.08em] uppercase py-1"
                    style={{
                      background: "var(--gold, #c8960a)",
                      color: "var(--dark, #1a1a0e)",
                      transform: "rotate(45deg)",
                    }}
                  >
                    Nuevo
                  </div>

                  <h3 className="font-sans font-bold text-[1rem] sm:text-[1.15rem] mb-1 text-white">
                    {plato.name}
                  </h3>
                  <p
                    className="text-[0.76rem] sm:text-[0.78rem] leading-relaxed mb-3 sm:mb-5 max-w-[280px]"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {plato.description}
                  </p>

                  {weekendOffer && productMatchesOffer(weekendOffer, plato) && (
                    <div
                      className="mb-3 sm:mb-4 flex flex-col items-center gap-1 rounded-[10px] px-3 py-2"
                      style={{ background: "var(--terra, #c85a2a)", color: "#fff" }}
                    >
                      <span className="text-[0.8rem] font-bold uppercase tracking-[0.06em]">
                        {offerBadgeLabel(weekendOffer)} · {weekendOffer.tagline}
                      </span>
                      {offerReservationText(weekendOffer) && (
                        <span className="text-[0.66rem]" style={{ color: "rgba(255,255,255,0.85)" }}>
                          {offerReservationText(weekendOffer)}
                        </span>
                      )}
                      <OfferCountdown offer={weekendOffer} light className="justify-center mt-0.5" />
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-2 sm:gap-3 mt-auto">
                    <div className="flex flex-col items-center leading-tight">
                      <span
                        className="font-mono font-bold text-[1.3rem] sm:text-[1.5rem]"
                        style={{ color: "var(--gold, #c8960a)" }}
                      >
                        {fmtPrecio(plato.depositAmount || plato.finalPrice)}
                      </span>
                      <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.55)" }}>
                        IVA incluido
                      </span>
                    </div>
                    {typeof plato.stockRemaining === "number" &&
                      plato.available !== false && (
                        <span
                          className="text-[0.66rem] font-bold uppercase tracking-[0.06em] px-3 py-1 rounded-full"
                          style={{
                            background: "var(--terra, #c85a2a)",
                            color: "#fff",
                          }}
                        >
                          {plato.stockRemaining === 1
                            ? "¡Última unidad!"
                            : `Edición limitada · quedan ${plato.stockRemaining}`}
                        </span>
                      )}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent("verde:add-pack", {
                              detail: { items: [{ id: plato.id, qty: 1 }] },
                            })
                          )
                        }
                        className="text-[0.78rem] font-medium px-6 py-2 rounded-lg text-white transition-colors cursor-pointer border-none"
                        style={{ background: "rgba(255,255,255,0.12)" }}
                      >
                        Pedir →
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* ── Packs ── */}
        {hayNovedades && subtitulo("Packs de la casa")}
        <div className="gsap-stagger grid gap-3 sm:gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {/* Menú de la semana — la card que más resalta del bloque */}
          {menuSemana && (
            <div
              className="relative rounded-[14px] p-4 sm:p-[1.6rem] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 flex flex-col items-center text-center"
              style={{
                background:
                  "linear-gradient(150deg, rgba(200,150,10,0.28), rgba(200,90,42,0.22))",
                border: "1.5px solid var(--gold, #c8960a)",
                boxShadow: "0 8px 44px rgba(200,150,10,0.35)",
              }}
            >
              <div
                className="absolute top-[26px] right-[-44px] w-[160px] text-center text-[0.62rem] font-medium tracking-[0.08em] uppercase py-1"
                style={{
                  background: "var(--gold, #c8960a)",
                  color: "var(--dark, #1a1a0e)",
                  transform: "rotate(45deg)",
                }}
              >
                Cada semana
              </div>

              <h3 className="font-sans font-bold text-[1.05rem] sm:text-[1.2rem] mb-1 text-white">
                Menú de la Semana
              </h3>
              <p
                className="text-[0.76rem] sm:text-[0.78rem] leading-relaxed mb-2 max-w-[280px]"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {menuSemana.description ||
                  "Plato, acompañante y bebida a precio cerrado. Cambia cada semana."}
              </p>
              {/* Bebida incluida: se elige en la tarjeta, antes de pedir */}
              {menuChoice && (
                <div className="mb-3 sm:mb-4 w-full max-w-[300px]">
                  <p
                    className="text-[0.62rem] font-medium tracking-[0.15em] uppercase mb-1.5"
                    style={{ color: "rgba(245,237,216,0.75)" }}
                  >
                    Elige tu bebida (incluida)
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {menuChoice.options.map((opt) => {
                      const sel = bebidaMenu === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setBebidaMenu(opt)}
                          aria-pressed={sel}
                          className="rounded-full px-2.5 py-1 text-[0.68rem] font-semibold transition-colors border"
                          style={
                            sel
                              ? {
                                  background: "var(--gold, #c8960a)",
                                  color: "var(--dark, #1a1a0e)",
                                  borderColor: "var(--gold, #c8960a)",
                                }
                              : {
                                  background: "rgba(255,255,255,0.08)",
                                  color: "rgba(245,237,216,0.8)",
                                  borderColor: "rgba(245,237,216,0.25)",
                                }
                          }
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center gap-2 sm:gap-3 mt-auto">
                <div className="flex flex-col items-center leading-tight">
                  <span
                    className="font-mono font-bold text-[1.4rem] sm:text-[1.6rem]"
                    style={{ color: "var(--gold, #c8960a)" }}
                  >
                    {fmtPrecio(menuSemana.depositAmount || menuSemana.finalPrice)}
                  </span>
                  <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.55)" }}>
                    IVA incluido
                  </span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("verde:add-pack", {
                          detail: {
                            items: [{ id: menuSemana.id, qty: 1 }],
                            choice: menuChoice
                              ? { productId: menuSemana.id, value: bebidaMenu }
                              : undefined,
                          },
                        })
                      )
                    }
                    className="text-[0.78rem] font-medium px-6 py-2 rounded-lg transition-colors cursor-pointer border-none"
                    style={{ background: "var(--gold, #c8960a)", color: "var(--dark, #1a1a0e)", fontWeight: 700 }}
                  >
                    Pedir →
                  </button>
                )}
              </div>
            </div>
          )}
          {PACKS.map((pack) => (
            <div
              key={pack.id}
              className="relative rounded-[14px] p-4 sm:p-[1.6rem] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 flex flex-col items-center text-center"
              style={
                pack.featured
                  ? {
                      background: "var(--terra, #c85a2a)",
                      border: "1px solid var(--terra2, #e07040)",
                      boxShadow: "0 8px 40px rgba(200,90,42,0.4)",
                    }
                  : {
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }
              }
            >
              {/* Ribbon Popular */}
              {pack.ribbon && (
                <div
                  className="absolute top-[26px] right-[-44px] w-[160px] text-center text-[0.62rem] font-medium tracking-[0.08em] uppercase py-1"
                  style={{
                    background: "var(--gold, #c8960a)",
                    color: "var(--dark, #1a1a0e)",
                    transform: "rotate(45deg)",
                  }}
                >
                  {pack.ribbon}
                </div>
              )}

              <h3
                className="font-sans font-bold text-[1rem] sm:text-[1.15rem] mb-1 text-white"
              >
                {pack.name}
              </h3>
              <p
                className="text-[0.76rem] sm:text-[0.78rem] leading-relaxed mb-3 sm:mb-5 max-w-[280px]"
                style={{
                  color: pack.featured
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.55)",
                }}
              >
                {pack.desc}
              </p>

              {(() => {
                const cfg = PRODUCT_CHOICES.find((c) => mismoId(c.productId, pack.id));
                if (!cfg || readOnly) return null;
                const actual = packChoices[pack.id] ?? cfg.options[0];
                return (
                  <div className="mb-3 sm:mb-4 w-full max-w-[300px]">
                    <p
                      className="text-[0.62rem] font-medium tracking-[0.15em] uppercase mb-1.5"
                      style={{ color: "rgba(245,237,216,0.75)" }}
                    >
                      Elige tu plato
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {cfg.options.map((opt) => {
                        const sel = actual === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setPackChoices((prev) => ({ ...prev, [pack.id]: opt }))}
                            aria-pressed={sel}
                            className="rounded-full px-2.5 py-1 text-[0.7rem] font-semibold transition-colors border"
                            style={
                              sel
                                ? {
                                    background: "var(--gold, #c8960a)",
                                    color: "var(--dark, #1a1a0e)",
                                    borderColor: "var(--gold, #c8960a)",
                                  }
                                : {
                                    background: "rgba(255,255,255,0.08)",
                                    color: "rgba(245,237,216,0.85)",
                                    borderColor: "rgba(245,237,216,0.3)",
                                  }
                            }
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-col items-center gap-2 sm:gap-3 mt-auto">
                <div className="flex flex-col items-center leading-tight">
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className="font-mono font-bold text-[1.3rem] sm:text-[1.5rem]"
                      style={{
                        color: pack.featured
                          ? "white"
                          : "var(--g3, #7ab356)",
                      }}
                    >
                      {pack.price}
                    </span>
                    <span
                      className="text-[0.7rem] px-2 py-0.5 rounded-full"
                      style={{
                        background: pack.featured
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(74,124,47,0.25)",
                        color: pack.featured ? "white" : "var(--g3, #7ab356)",
                      }}
                    >
                      {pack.saving}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>
                    IVA incluido
                  </span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const cfg = PRODUCT_CHOICES.find((c) => mismoId(c.productId, pack.id));
                      window.dispatchEvent(new CustomEvent('verde:add-pack', {
                        detail: {
                          items: pack.items,
                          choice: cfg
                            ? { productId: pack.id, value: packChoices[pack.id] ?? cfg.options[0] }
                            : undefined,
                        }
                      }));
                    }}
                    className="text-[0.78rem] font-medium px-6 py-2 rounded-lg text-white transition-colors cursor-pointer border-none"
                    style={{
                      background: pack.featured
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(255,255,255,0.12)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = pack.featured
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(255,255,255,0.12)";
                    }}
                  >
                    Pedir →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
