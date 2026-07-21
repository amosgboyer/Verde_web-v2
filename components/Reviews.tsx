"use client";

const REVIEWS = [
  {
    id: 1,
    name: "Mateo Andrade",
    location: "Chamberí, Madrid",
    product: "Ahora Comen Todos",
    text: "Hemos probado por primera vez vuestra comida mi novia y yo, e increíble se queda corto. Somos fans del turismo gastronómico, hemos ido a muchísimos sitios, y nos ha sorprendido una barbaridad. Todo exquisito, nada mejorable. Volveremos a pedir pronto y os recomendaremos a nuestros amigos.",
  },
  {
    id: 2,
    name: "Valentina Cedeño",
    location: "Tetuán, Madrid",
    product: "Tigrillo Mixto",
    text: "23 años viviendo aquí y no había probado nada que me llevara al Ecua de esta manera. Está riquísimo, ¡gracias!",
  },
  {
    id: 3,
    name: "Nicolás Mendoza",
    location: "Vallecas, Madrid",
    product: "Bolón Mixto de la Casa",
    text: "Nos ha gustado muchísimo el bolón. La sazón está muy rica y el concepto es top, faltaba uno en Madrid. El ají increíble. Gracias por venir hasta acá.",
  },
  {
    id: 4,
    name: "Camila Zambrano",
    location: "Getafe, Madrid",
    product: "Patacón de Rabo de Toro",
    text: "Todo acabado, muy bueno, perfecta sazón, sabe a Ecuador. Sin duda volveré a pedir. Mi favorito, el patacón con rabo de toro. Sigan así, mucha suerte.",
  },
  {
    id: 5,
    name: "Andrés Palacios",
    location: "Alcorcón, Madrid",
    product: "Patacón de Rabo de Toro",
    text: "El tigrillo y el corviche estaban muy ricos, pero el patacón de rabo… wow. Muchas gracias por el pedido.",
  },
];

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
            className="font-sans font-bold"
            style={{
              color: "#2E4F20",
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            }}
          >
            La comunidad Verde
          </h2>
        </div>

        {/* Reseñas (masonry para textos de distinta longitud) */}
        <div className="gsap-stagger columns-1 sm:columns-2 lg:columns-3 [column-gap:1rem]">
          {REVIEWS.map((r) => (
            <div
              key={r.id}
              className="rounded-[14px] p-5 mb-4 break-inside-avoid flex flex-col gap-3"
              style={{
                background: "white",
                border: "1px solid rgba(44,90,27,0.1)",
              }}
            >
              <p
                className="text-[0.82rem] leading-relaxed"
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
