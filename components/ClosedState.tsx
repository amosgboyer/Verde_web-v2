import WaitlistForm from "./WaitlistForm";

interface ClosedStateProps {
  message: string;
}

export default function ClosedState({ message }: ClosedStateProps) {
  const month = new Date().toLocaleDateString("es-ES", { month: "long" });
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1);

  return (
    <section
      className="relative py-24 px-6 bg-verde-bosque min-h-[78vh] flex items-center overflow-hidden"
      id="waitlist"
    >
      {/* textura grain sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.05,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "180px",
        }}
      />

      <div className="relative max-w-xl mx-auto w-full text-center">
        {/* Sello SOLD OUT */}
        <div className="flex justify-center mb-8">
          <span
            className="inline-block font-mono font-bold uppercase tracking-[0.25em] text-2xl sm:text-3xl px-7 py-3 rounded-xl -rotate-3"
            style={{
              color: "#f2ead8",
              border: "3px solid #e07040",
              background: "rgba(200,90,42,0.14)",
              boxShadow: "0 10px 40px rgba(200,90,42,0.25)",
            }}
          >
            Sold Out
          </span>
        </div>

        <p className="text-crema/35 text-[10px] font-medium tracking-[0.4em] uppercase mb-3">
          Reservas cerradas
        </p>
        <h2 className="text-crema text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
          {monthCap} está completo
        </h2>
        <p className="text-crema/55 text-base leading-relaxed max-w-sm mx-auto mb-12">
          {message}
        </p>

        {/* Aviso de reapertura */}
        <div className="border-t border-crema/12 pt-10 text-left">
          <h3 className="text-crema text-xl font-semibold mb-2">
            Avísame del próximo cupo
          </h3>
          <p className="text-crema/45 text-sm mb-8">
            Déjanos tu WhatsApp y te escribimos en cuanto abramos nuevas fechas.
          </p>
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
