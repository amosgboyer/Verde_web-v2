"use client";

const PACKS = [
  {
    id: "tigrillos",
    name: "Los Dos Tigrillos",
    desc: "2× Tigrillo XL Mixto. Hecho en demiglass de carne, chicharrón, mix de quesos y sal prieta.",
    price: "27€",
    saving: "ahorras 3€",
    featured: true,
    ribbon: "Popular",
    items: [{ id: "pack-dos-tigrillos", qty: 1 }],
  },
  {
    id: "bolon-patacon",
    name: "Bolón + Patacón",
    desc: "Bolón Mixto de la Casa + Ración de Patacón con salsa verde de queso y queso manaba.",
    price: "14€",
    saving: "ahorras 2€",
    featured: false,
    items: [{ id: "pack-bolon-patacon", qty: 1 }],
  },
  {
    id: "grupo",
    name: "Para Todo el Grupo",
    desc: "Ahora Comen Todos + Ración de Patacón. Para 3–4 personas con ganas de verde.",
    price: "24€",
    saving: "ahorras 2€",
    featured: false,
    items: [{ id: "pack-grupo", qty: 1 }],
  },
];

export default function Packs({ readOnly = false }: { readOnly?: boolean }) {
  return (
    <section
      className="px-8 py-[4.5rem]"
      style={{ background: "var(--g0, #1c3a10)" }}
    >
      <div className="max-w-[1060px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[480px] mx-auto mb-10">
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
        <div className="gsap-stagger grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {PACKS.map((pack) => (
            <div
              key={pack.id}
              className="relative rounded-[14px] p-[1.6rem] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 flex flex-col items-center text-center"
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
                className="font-sans font-bold text-[1.15rem] mb-[0.5rem] text-white"
              >
                {pack.name}
              </h3>
              <p
                className="text-[0.78rem] leading-relaxed mb-5 max-w-[280px]"
                style={{
                  color: pack.featured
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.55)",
                }}
              >
                {pack.desc}
              </p>

              <div className="flex flex-col items-center gap-3 mt-auto">
                <div className="flex items-center justify-center gap-2">
                  <span
                    className="font-mono font-bold text-[1.5rem]"
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
