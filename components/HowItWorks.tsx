export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Elige tu producto",
      description: "Selecciona el que más te guste, la cantidad y el día de entrega.",
    },
    {
      number: "02",
      title: "Paga online de forma segura",
      description: "Paga el total del pedido online con Stripe. Confirmamos tu pedido de inmediato.",
    },
    {
      number: "03",
      title: "Recibe el día que tú elijas",
      description: "Te avisamos por WhatsApp y correo para coordinar la entrega. Sin colas, sin sorpresas.",
    },
  ];

  return (
    <section
      className="py-24 px-6"
      style={{ background: "#2E4F20" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center max-w-[520px] mx-auto">
          <p
            className="font-mono text-[0.68rem] tracking-[0.22em] uppercase mb-3"
            style={{ color: "#509234" }}
          >
            El proceso
          </p>
          <h2
            className="font-sans font-bold leading-tight mb-3"
            style={{
              color: "#F5EDD8",
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            }}
          >
            Cómo funciona
          </h2>
          <p
            className="text-sm leading-relaxed mx-auto max-w-[280px]"
            style={{ color: "rgba(245,237,216,0.45)" }}
          >
            Sin colas. Sin esperas. Solo verde cuando tú quieras.
          </p>
        </div>

        {/* Steps */}
        <div className="gsap-stagger grid sm:grid-cols-3 gap-px" style={{ background: "rgba(245,237,216,0.08)" }}>
          {steps.map((step) => (
            <div
              key={step.number}
              className="p-8 flex flex-col items-center text-center"
              style={{ background: "#2E4F20" }}
            >
              <span
                className="font-mono font-bold text-[2.5rem] leading-none mb-5"
                style={{ color: "rgba(245,237,216,0.18)" }}
              >
                {step.number}
              </span>
              <h3
                className="font-medium text-[1rem] mb-3 leading-snug"
                style={{ color: "#F5EDD8" }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm leading-relaxed max-w-[240px]"
                style={{ color: "rgba(245,237,216,0.5)" }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
