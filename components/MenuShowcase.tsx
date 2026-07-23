import type { Product } from "@/lib/products";

// Carta en modo solo-lectura (sin pedir). Se muestra cuando hay SOLD OUT para
// que los visitantes vean los platos aunque no se pueda reservar.

const CATS = [
  { key: "verde", title: "VERDE Y SOLO VERDE", sub: "Herencia cultural y vínculo con la tierra." },
  { key: "maduro", title: "PARA LOS AMANTES DEL MADURO", sub: "Una versión más dulce, intensa y contundente." },
  { key: "otros", title: "OTROS PRODUCTOS", sub: "Más opciones de la casa." },
];

function normCat(c?: string) {
  const l = (c ?? "").trim().toLowerCase();
  return l === "verde" || l === "maduro" ? l : "otros";
}

export default function MenuShowcase({ products }: { products: Product[] }) {
  const items = products.filter((p) => !p.isPack && p.available);
  if (!items.length) return null;

  return (
    <section className="py-20 px-6" style={{ background: "#e8ddc4" }} id="carta">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-md mx-auto mb-12">
          <p
            className="font-mono text-[0.68rem] tracking-[0.2em] uppercase mb-2"
            style={{ color: "#4a7c2f" }}
          >
            La carta
          </p>
          <h2
            className="font-sans font-bold text-3xl sm:text-4xl mb-2"
            style={{ color: "#2d5a1b" }}
          >
            Esto es lo que cocinamos
          </h2>
          <p className="text-sm" style={{ color: "rgba(46,46,30,0.55)" }}>
            Este mes estamos completos, pero así es nuestra carta. Únete a la lista y
            te avisamos en cuanto reabramos.
          </p>
        </div>

        <div className="space-y-10">
          {CATS.map((cat) => {
            const list = items.filter((p) => normCat(p.category) === cat.key);
            if (!list.length) return null;
            return (
              <div key={cat.key}>
                <div className="mb-4">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1"
                    style={{ color: "rgba(46,79,32,0.7)" }}
                  >
                    {cat.title}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(46,46,30,0.45)" }}>
                    {cat.sub}
                  </p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {list.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-[14px] p-[0.95rem_1.05rem]"
                      style={{ background: "#f2ead8", border: "1px solid rgba(44,90,27,0.13)" }}
                    >
                      <h3 className="font-medium mb-1" style={{ fontSize: "0.95rem", color: "#1a1a0e" }}>
                        {p.name}
                      </h3>
                      <p
                        className="leading-relaxed mb-2"
                        style={{ fontSize: "0.76rem", color: "#6e6e5a", minHeight: 44 }}
                      >
                        {p.description}
                      </p>
                      {p.allergens && p.allergens.length > 0 && (
                        <p
                          className="uppercase tracking-[0.05em] mb-2"
                          style={{ fontSize: "0.63rem", color: "#a8a892" }}
                        >
                          Contiene: {p.allergens.join(", ")}
                        </p>
                      )}
                      <span
                        className="font-mono font-bold"
                        style={{ fontSize: "1.1rem", color: "#2d5a1b" }}
                      >
                        {p.depositAmount || p.finalPrice} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Aviso de alérgenos + contaminación cruzada */}
        <div
          className="mt-12 mx-auto max-w-2xl text-center leading-relaxed"
          style={{ fontSize: "0.72rem", color: "rgba(46,46,30,0.5)" }}
        >
          <p className="font-semibold" style={{ color: "#8a5a2a" }}>
            ⚠️ Todos nuestros platos pueden contener trazas de cacahuete.
          </p>
          <p className="mt-1">
            Información orientativa. Si tienes una alergia grave, escríbenos antes
            de pedir y lo confirmamos contigo.
          </p>
        </div>
      </div>
    </section>
  );
}
