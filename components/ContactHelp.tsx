// Atención al cliente — WhatsApp + llamada. Centraliza dudas/reservas sin
// perder la cercanía. Se usa en el checkout (variant "inline") y abajo en la
// home (variant "section").

const PHONE_DISPLAY = "+34 605 442 809";
const TEL_HREF = "tel:+34605442809";
const WA_HREF =
  "https://wa.me/34605442809?text=" +
  encodeURIComponent("¡Hola Verde! Tengo una duda sobre mi pedido 🌱");

export default function ContactHelp({
  variant = "section",
}: {
  variant?: "inline" | "section";
}) {
  const waBtn = (
    <a
      href={WA_HREF}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-verde-bosque text-crema text-sm font-medium px-4 py-2 hover:bg-verde-platano transition-colors"
    >
      <span aria-hidden>💬</span> WhatsApp
    </a>
  );
  const callBtn = (
    <a
      href={TEL_HREF}
      className="inline-flex items-center gap-2 rounded-lg border border-verde-bosque/30 text-verde-bosque text-sm font-medium px-4 py-2 hover:bg-verde-bosque/5 transition-colors"
    >
      <span aria-hidden>📞</span> Llamar
    </a>
  );

  if (variant === "inline") {
    return (
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-negro/8 pt-5">
        <p className="text-sm text-negro/55">
          ¿Dudas con tu pedido? Te atendemos en persona:
        </p>
        {waBtn}
        {callBtn}
      </div>
    );
  }

  return (
    <section className="py-10 px-6 text-center" style={{ background: "#F5EDD8" }} id="atencion">
      <p
        className="text-[10px] font-medium tracking-[0.2em] uppercase mb-2"
        style={{ color: "#c85a2a" }}
      >
        Atención al cliente
      </p>
      <p className="text-sm mb-4 mx-auto max-w-md" style={{ color: "rgba(46,46,30,0.6)" }}>
        ¿Necesitas ayuda o prefieres reservar con nosotros? Te atendemos en
        persona — la cercanía de siempre.
      </p>
      <div className="flex flex-wrap gap-3 justify-center items-center">
        {waBtn}
        {callBtn}
        <span className="text-sm font-medium" style={{ color: "#2E4F20" }}>
          {PHONE_DISPLAY}
        </span>
      </div>
    </section>
  );
}
