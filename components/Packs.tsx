"use client";

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

export default function Packs({ readOnly = false }: { readOnly?: boolean }) {
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
            Combinaciones
          </p>
          <h2
            className="font-sans font-bold mb-2"
            style={{
              color: "var(--cream, #f2ead8)",
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              lineHeight: 1.15,
            }}
          >
            Packs de la casa
          </h2>
          <p className="text-[0.85rem] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            Las combinaciones que más piden. Un poco de todo lo mejor, al mejor precio.
          </p>
        </div>

        {/* Grid */}
        <div className="gsap-stagger grid gap-3 sm:gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
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
