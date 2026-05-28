export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Elige tu producto",
      description: "Selecciona el que más te guste, la cantidad y el día de entrega.",
      icon: "🫘",
    },
    {
      number: "02",
      title: "Paga online de forma segura",
      description: "Paga el total del pedido online con Stripe. Confirmamos tu pedido de inmediato.",
      icon: "🔒",
    },
    {
      number: "03",
      title: "Recibe el día que tú elijas",
      description: "Te avisamos por WhatsApp y correo para coordinar la entrega. Sin colas, sin sorpresas.",
      icon: "📦",
    },
  ];

  return (
    <section
      className="py-24 px-6"
      style={{ background: "#2E4F20" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p
              className="text-[0.68rem] tracking-[0.22em] uppercase mb-3"
              style={{ color: "#509234" }}
            >
              El proceso
            </p>
            <h2
              className="font-serif font-semibold leading-tight"
              style={{
                color: "#F5EDD8",
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              }}
            >
              Cómo funciona
            </h2>
          </div>
          <p
            className="text-sm max-w-[260px] leading-relaxed"
            style={{ color: "rgba(245,237,216,0.45)" }}
          >
            Sin colas. Sin esperas. Solo verde cuando tú quieras.
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-3 gap-px" style={{ background: "rgba(245,237,216,0.08)" }}>
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="p-8"
              style={{ background: "#2E4F20" }}
            >
              <div className="flex items-start justify-between mb-6">
                <span className="text-2xl">{step.icon}</span>
                <span
                  className="font-serif font-bold text-[2.5rem] leading-none"
                  style={{ color: "rgba(245,237,216,0.08)" }}
                >
                  {step.number}
                </span>
              </div>
              <h3
                className="font-medium text-[1rem] mb-3 leading-snug"
                style={{ color: "#F5EDD8" }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
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
