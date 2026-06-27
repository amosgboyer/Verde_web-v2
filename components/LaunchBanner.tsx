import type { LaunchPhase } from "@/lib/launch";
import { PUBLIC_OPEN_AT } from "@/lib/launch";
import Countdown from "@/components/Countdown";
import AccessGate from "@/components/AccessGate";

// Banner de agradecimiento + cuenta atrás + código de acceso (unificados en un
// recuadro central), con el calendario de fases a los laterales.
export default function LaunchBanner({
  phase,
  code,
}: {
  phase: LaunchPhase;
  code?: string;
}) {
  const earlyActive = phase === "early_access";
  const openActive = phase === "open";

  const cardSunMon = (
    <div
      className="rounded-xl p-5 text-left"
      style={{
        background: earlyActive ? "var(--terra, #c85a2a)" : "rgba(255,255,255,0.05)",
        border: earlyActive
          ? "1px solid var(--terra2, #e07040)"
          : "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <p
        className="font-mono text-[0.6rem] tracking-[0.15em] uppercase mb-1"
        style={{ color: "rgba(255,255,255,0.7)" }}
      >
        Domingo y lunes
      </p>
      <p className="font-semibold text-white mb-1">Acceso anticipado</p>
      <p className="text-[0.82rem]" style={{ color: "rgba(255,255,255,0.75)" }}>
        Solo lista de espera, con tu código.
      </p>
    </div>
  );

  const cardTue = (
    <div
      className="rounded-xl p-5 text-left"
      style={{
        background: openActive ? "var(--terra, #c85a2a)" : "rgba(255,255,255,0.05)",
        border: openActive
          ? "1px solid var(--terra2, #e07040)"
          : "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <p
        className="font-mono text-[0.6rem] tracking-[0.15em] uppercase mb-1"
        style={{ color: "rgba(255,255,255,0.7)" }}
      >
        Desde el martes
      </p>
      <p className="font-semibold text-white mb-1">Abierto para todos</p>
      <p className="text-[0.82rem]" style={{ color: "rgba(255,255,255,0.75)" }}>
        Sin código, reserva libre.
      </p>
    </div>
  );

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

      <div className="relative max-w-5xl mx-auto">
        {/* Encabezado */}
        <div className="text-center max-w-2xl mx-auto">
          <p
            className="font-mono text-[0.68rem] tracking-[0.3em] uppercase mb-3"
            style={{ color: "var(--g3, #7ab356)" }}
          >
            Gracias
          </p>
          <h2
            className="font-sans font-bold leading-tight mb-4"
            style={{
              color: "var(--cream, #f2ead8)",
              fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
            }}
          >
            ¡Muchísimas gracias a todos!
          </h2>
          <p
            className="text-base leading-relaxed mb-2 max-w-md mx-auto"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Por vuestro apoyo nos hemos llenado. Reabrimos cupos por fases —
            gracias por hacer crecer lo verde.
          </p>
        </div>

        {earlyActive ? (
          <>
            {/* Tarjetas a los laterales + recuadro central (countdown + código) */}
            <div className="grid lg:grid-cols-[1fr_minmax(0,1.7fr)_1fr] gap-6 items-center mt-10">
              <div className="order-2 lg:order-1">{cardSunMon}</div>

              <div
                className="order-1 lg:order-2 rounded-3xl px-5 py-8"
                style={{
                  background: "rgba(0,0,0,0.18)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Countdown
                  target={PUBLIC_OPEN_AT}
                  label="Tu acceso exclusivo termina en"
                  finishedLabel="¡Abierto para todos! 🌱"
                  variant="banner"
                />
                <p
                  className="text-[0.78rem] mt-6 text-center"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Después, abrimos para todo el mundo. Reserva con tu código antes
                  de que vuele.
                </p>
                {code && <AccessGate code={code} bare />}
              </div>

              <div className="order-3 lg:order-3">{cardTue}</div>
            </div>

            <p
              className="text-[0.8rem] mt-8 text-center"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              ¿Estás en la lista de espera? Usa el código que te enviamos por
              WhatsApp o email al reservar.
            </p>
          </>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto mt-10">
              {cardSunMon}
              {cardTue}
            </div>
            {openActive && (
              <p
                className="text-[0.85rem] mt-8 font-medium text-center"
                style={{ color: "var(--g3, #7ab356)" }}
              >
                ¡Ya estamos abiertos para todos! 🌱
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
