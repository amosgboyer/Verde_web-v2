"use client";

const PACKS = [
  {
    id: "p1",
    name: "Los Dos Tigrillos",
    desc: "2× Tigrillo XL Mixto para compartir. Caldo madre, chicharrón, rabo desmenuzado, mix de quesos y salsa de maní.",
    price: 27,
    saving: 3,
    featured: true,
  },
  {
    id: "p2",
    name: "Bolón + Patacón",
    desc: "Bolón Mixto de la Casa + Ración de Patacón. La combinación más pedida.",
    price: 14,
    saving: 2,
    featured: false,
  },
  {
    id: "p3",
    name: "Para Todo el Grupo",
    desc: "Ahora Comen Todos (6 mini bolones) + Ración de Patacón. Para 3-4 personas.",
    price: 24,
    saving: 2,
    featured: false,
  },
];

export default function Packs() {
  return (
    <div className="bg-verde-bosque py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] font-medium tracking-[0.22em] uppercase mb-2" style={{ color: "#7ab356" }}>
          Ofertas y combinaciones
        </p>
        <h2 className="text-crema font-bold text-2xl mb-2">Packs de la semana</h2>
        <p className="text-sm mb-8" style={{ color: "rgba(245,240,232,0.45)" }}>
          Combinaciones pensadas para que pruebes más por menos.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PACKS.map((pack) => (
            <a
              key={pack.id}
              href="#reservar"
              className="block p-5 rounded-xl border transition-all duration-200 hover:-translate-y-1"
              style={{
                background: pack.featured ? "#c85a2a" : "rgba(255,255,255,0.06)",
                borderColor: pack.featured ? "#e07040" : "rgba(255,255,255,0.1)",
                boxShadow: pack.featured ? "0 8px 40px rgba(200,90,42,0.4)" : "none",
              }}
            >
              {pack.featured && (
                <span
                  className="inline-block text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full mb-3"
                  style={{ background: "#c8960a", color: "#1a1a0e" }}
                >
                  Popular
                </span>
              )}
              <h3 className="text-crema font-bold text-base mb-2">{pack.name}</h3>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(245,240,232,0.55)" }}>
                {pack.desc}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-crema font-bold text-xl">{pack.price} €</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.15)", color: "rgba(245,240,232,0.9)" }}
                >
                  Ahorras {pack.saving} €
                </span>
              </div>
            </a>
          ))}
        </div>
        <p className="text-[10px] text-center mt-6" style={{ color: "rgba(245,240,232,0.25)" }}>
          Indica en notas del pedido la combinación elegida
        </p>
      </div>
    </div>
  );
}
