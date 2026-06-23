import type { LaunchPhase } from "@/lib/launch";

// Banner de agradecimiento + calendario de apertura por fases.
export default function LaunchBanner({ phase }: { phase: LaunchPhase }) {
  return (
    <section
      className="relative px-6 py-16 overflow-hidden"
      style={{ background: "var(--g0, #1c3a10)" }}
      id="gracias-banner"
    >
      {/* grain sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.05,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "180px",
        }}
      />

      <div className="relative max-w-2xl mx-auto text-center">
        <p
          className="font-mono text-[0.68rem] tracking-[0.3em] uppercase mb-3"
          style={{ color: "var(--g3, #7ab356)" }}
        >
          Gracias
        </p>
        <h2
          className="font-sans font-bold leading-tight mb-4"
          style={{ color: "var(--cream, #f2ead8)", fontSize: "clamp(1.8rem, 5vw, 2.8rem)" }}
        >
          ¡Muchísimas gracias a todos!
        </h2>
        <p
          className="text-base leading-relaxed mb-10 max-w-md mx-auto"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          Por vuestro apoyo nos hemos llenado. Reabrimos cupos por fases — gracias
          por hacer crecer lo verde.
        </p>

        {/* Calendario de fases */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
          <div
            className="rounded-xl p-5"
            style={{
              background:
                phase === "early_access" ? "var(--terra, #c85a2a)" : "rgba(255,255,255,0.05)",
              border:
                phase === "early_access"
                  ? "1px solid var(--terra2, #e07040)"
                  : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <p className="font-mono text-[0.6rem] tracking-[0.15em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              Domingo y lunes
            </p>
            <p className="font-semibold text-white mb-1">Acceso anticipado</p>
            <p className="text-[0.82rem]" style={{ color: "rgba(255,255,255,0.75)" }}>
              Solo lista de espera, con tu código.
            </p>
          </div>

          <div
            className="rounded-xl p-5"
            style={{
              background:
                phase === "open" ? "var(--terra, #c85a2a)" : "rgba(255,255,255,0.05)",
              border:
                phase === "open"
                  ? "1px solid var(--terra2, #e07040)"
                  : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <p className="font-mono text-[0.6rem] tracking-[0.15em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              Desde el martes
            </p>
            <p className="font-semibold text-white mb-1">Abierto para todos</p>
            <p className="text-[0.82rem]" style={{ color: "rgba(255,255,255,0.75)" }}>
              Sin código, reserva libre.
            </p>
          </div>
        </div>

        {phase === "early_access" && (
          <p className="text-[0.8rem] mt-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            ¿Estás en la lista de espera? Usa el código que te enviamos por
            WhatsApp al reservar.
          </p>
        )}
        {phase === "open" && (
          <p className="text-[0.85rem] mt-8 font-medium" style={{ color: "var(--g3, #7ab356)" }}>
            ¡Ya estamos abiertos para todos! 🌱
          </p>
        )}
      </div>
    </section>
  );
}
