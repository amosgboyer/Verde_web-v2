"use client";

const REVIEWS = [
  {
    id: 1,
    name: "María G.",
    location: "Salamanca, Madrid",
    text: "El tigrillo me transportó directo a casa de mi abuela en Guayaquil. Increíble que se pueda encontrar esto en Madrid.",
    rating: 5,
    product: "Tigrillo XL Mixto",
  },
  {
    id: 2,
    name: "Carlos R.",
    location: "Malasaña, Madrid",
    text: "Pedí para una cena con amigos y no quedó ni uno. El bolón mixto es brutal. Repetiremos seguro.",
    rating: 5,
    product: "Bolón Mixto de la Casa",
  },
  {
    id: 3,
    name: "Ana M.",
    location: "Lavapiés, Madrid",
    text: "Me encanta el modelo de pedido anticipado. Sabes exactamente lo que vas a recibir y llega perfecto.",
    rating: 5,
    product: "Pack Los Dos Tigrillos",
  },
  {
    id: 4,
    name: "Diego P.",
    location: "Retiro, Madrid",
    text: "El corviche de pescado estaba fresco y con mucho sabor. Se nota que usan ingredientes de calidad.",
    rating: 5,
    product: "Corviche de Pescado",
  },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#FFBC23">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function Reviews() {
  return (
    <section className="py-20 px-6" style={{ background: "#F5EDD8" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p
            className="font-mono text-[0.68rem] tracking-[0.22em] uppercase mb-3"
            style={{ color: "#509234" }}
          >
            Lo que dicen
          </p>
          <h2
            className="font-serif font-semibold"
            style={{
              color: "#2E4F20",
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            }}
          >
            La comunidad Verde
          </h2>
        </div>

        {/* Grid reseñas */}
        <div className="gsap-stagger grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REVIEWS.map((r) => (
            <div
              key={r.id}
              className="rounded-[14px] p-5 flex flex-col gap-3"
              style={{
                background: "white",
                border: "1px solid rgba(44,90,27,0.1)",
              }}
            >
              <Stars n={r.rating} />
              <p
                className="text-[0.82rem] leading-relaxed flex-1"
                style={{ color: "#2e2e1e" }}
              >
                "{r.text}"
              </p>
              <div>
                <p
                  className="text-[0.78rem] font-medium"
                  style={{ color: "#2E4F20" }}
                >
                  {r.name}
                </p>
                <p className="text-[0.68rem]" style={{ color: "#a8a892" }}>
                  {r.location} · {r.product}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Instagram */}
        <div className="mt-10 text-center">
          <a
            href="https://instagram.com/verde_madrid"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 text-[0.82rem] font-medium transition-colors"
            style={{ color: "#2E4F20" }}
          >
            Ver más en
            <span style={{ color: "#509234" }}>@verde_madrid</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
