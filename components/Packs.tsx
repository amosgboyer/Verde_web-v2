"use client";

import type { Product } from "@/lib/products";
import { getPacks } from "@/lib/products";

// Nombre, descripción y PRECIO salen de lib/products.ts — que es lo que cobra
// el checkout. Antes estaban copiados aquí a mano y un cambio de precio en el
// catálogo dejaba este escaparate anunciando otro. Aquí solo vive lo que es
// puramente de presentación (destacado, cinta y el "ahorras X").
const PRESENTACION: Record<
  string,
  { titulo: string; ahorro: string; featured?: boolean; ribbon?: string }
> = {
  "pack-dos-tigrillos": {
    titulo: "Los Dos Tigrillos",
    ahorro: "ahorras 3€",
    featured: true,
    ribbon: "Popular",
  },
  "pack-bolon-patacon": { titulo: "Bolón + Patacón", ahorro: "ahorras 2€" },
  "pack-grupo": { titulo: "Para Todo el Grupo", ahorro: "ahorras 2€" },
  // Menús con bebida: la bebida sale a 1,90 € dentro del menú (suelta 2,50).
  "menu-tigrillo": { titulo: "Menú Tigrillo", ahorro: "bebida a 1,90€" },
  "menu-corviche": { titulo: "Menú Corviche", ahorro: "bebida a 1,90€" },
  "menu-ceviche": { titulo: "Menú Ceviche", ahorro: "bebida a 1,90€" },
  "menu-sango": { titulo: "Menú Sango", ahorro: "bebida a 1,90€" },
};

// Precio en formato español, entero sin decimales: "27€", "14,50€".
function fmtPrecio(n: number): string {
  return (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",")) + "€";
}

const PACKS = getPacks().map((p) => {
  const pres = PRESENTACION[p.id] ?? { titulo: p.name, ahorro: "" };
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
}

export default function Packs({ readOnly = false, destacados = [], menuSemana }: PacksProps) {
  const hayNovedades = destacados.length > 0;

  // El bloque admite las dos cosas, así que el texto se adapta a lo que hay.
  const copy = hayNovedades
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
      style={{ background: "var(--g0, #1c3a10)" }}
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
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(200,150,10,0.45)",
                  }}
                >
                  <div
                    className="absolute top-[14px] right-[-24px] text-[0.62rem] font-medium tracking-[0.08em] uppercase px-8 py-1"
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

                  <div className="flex flex-col items-center gap-2 sm:gap-3 mt-auto">
                    <span
                      className="font-mono font-bold text-[1.3rem] sm:text-[1.5rem]"
                      style={{ color: "var(--gold, #c8960a)" }}
                    >
                      {fmtPrecio(plato.depositAmount || plato.finalPrice)}
                    </span>
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
                className="absolute top-[14px] right-[-24px] text-[0.62rem] font-medium tracking-[0.08em] uppercase px-8 py-1"
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
              <span
                className="text-[0.68rem] px-2.5 py-0.5 rounded-full mb-3 sm:mb-4"
                style={{ background: "rgba(200,150,10,0.3)", color: "#f5edd8" }}
              >
                bebida incluida a elegir
              </span>

              <div className="flex flex-col items-center gap-2 sm:gap-3 mt-auto">
                <span
                  className="font-mono font-bold text-[1.4rem] sm:text-[1.6rem]"
                  style={{ color: "var(--gold, #c8960a)" }}
                >
                  {fmtPrecio(menuSemana.depositAmount || menuSemana.finalPrice)}
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("verde:add-pack", {
                          detail: { items: [{ id: menuSemana.id, qty: 1 }] },
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
                  className="absolute top-[14px] right-[-24px] text-[0.62rem] font-medium tracking-[0.08em] uppercase px-8 py-1"
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

              <div className="flex flex-col items-center gap-2 sm:gap-3 mt-auto">
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
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('verde:add-pack', {
                        detail: { items: pack.items }
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
