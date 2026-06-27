"use client";

import { useEffect, useState } from "react";

type Variant = "hero" | "banner";

interface CountdownProps {
  /** ISO del instante objetivo (UTC). Ej: "2026-06-29T22:00:00.000Z". */
  target: string;
  /** Texto pequeño encima de los dígitos. Ej: "Abrimos al público en". */
  label: string;
  /** Qué mostrar cuando ya se alcanzó la fecha. */
  finishedLabel?: string;
  variant?: Variant;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function computeTimeLeft(targetMs: number): TimeLeft {
  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: false,
  };
}

const pad = (n: number): string => String(n).padStart(2, "0");

export default function Countdown({
  target,
  label,
  finishedLabel = "¡Ya está abierto! 🌱",
  variant = "hero",
}: CountdownProps) {
  const targetMs = new Date(target).getTime();
  // null hasta que monta en cliente — evita mismatch de hidratación.
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTime(computeTimeLeft(targetMs));
    const id = setInterval(() => setTime(computeTimeLeft(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const isBanner = variant === "banner";

  // Paleta según variante.
  const accent = isBanner ? "var(--terra, #c85a2a)" : "var(--gold, #d9a441)";
  const labelColor = isBanner ? "var(--g3, #7ab356)" : "rgba(255,255,255,0.7)";
  const cardBg = isBanner ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.35)";
  const cardBorder = isBanner
    ? "1px solid rgba(255,255,255,0.14)"
    : "1px solid rgba(255,255,255,0.18)";
  const digitColor = "var(--cream, #f2ead8)";
  const unitColor = "rgba(255,255,255,0.5)";

  // Reserva de espacio durante SSR / primer frame (mismo layout, sin saltos).
  if (!time) {
    return (
      <div
        className="flex flex-col items-center"
        style={{ minHeight: isBanner ? 118 : 132 }}
        aria-hidden="true"
      />
    );
  }

  if (time.done) {
    return (
      <p
        className="font-sans font-semibold text-center"
        style={{
          color: accent,
          fontSize: isBanner ? "1.05rem" : "1.25rem",
        }}
      >
        {finishedLabel}
      </p>
    );
  }

  const units: { value: number; label: string }[] = [
    { value: time.days, label: "días" },
    { value: time.hours, label: "horas" },
    { value: time.minutes, label: "min" },
    { value: time.seconds, label: "seg" },
  ];

  const digitSize = isBanner
    ? "clamp(1.5rem, 6vw, 2.4rem)"
    : "clamp(1.7rem, 7.5vw, 3.4rem)";
  const cardW = isBanner
    ? "clamp(52px, 16vw, 78px)"
    : "clamp(54px, 17.5vw, 92px)";

  return (
    <div className="flex flex-col items-center w-full">
      <p
        className="font-mono uppercase tracking-[0.28em] mb-4 text-center"
        style={{
          color: labelColor,
          fontSize: isBanner ? "0.62rem" : "0.7rem",
        }}
      >
        {label}
      </p>

      <div
        className="flex items-stretch justify-center"
        style={{ gap: isBanner ? "clamp(0.3rem, 1.5vw, 0.5rem)" : "clamp(0.35rem, 1.8vw, 0.7rem)" }}
        role="timer"
        aria-live="off"
      >
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center">
            <div
              className="flex flex-col items-center justify-center rounded-2xl"
              style={{
                width: cardW,
                padding: isBanner ? "0.7rem 0.4rem" : "0.9rem 0.5rem",
                background: cardBg,
                border: cardBorder,
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                boxShadow: "0 6px 22px rgba(0,0,0,0.28)",
              }}
            >
              <span
                className="font-sans font-bold tabular-nums leading-none"
                style={{
                  color: digitColor,
                  fontSize: digitSize,
                  // El bloque de segundos late suavemente para dar vida.
                  animation:
                    u.label === "seg" ? "vrd-pulse 1s ease-in-out infinite" : undefined,
                }}
              >
                {pad(u.value)}
              </span>
              <span
                className="font-mono uppercase tracking-[0.15em] mt-2"
                style={{ color: unitColor, fontSize: isBanner ? "0.52rem" : "0.6rem" }}
              >
                {u.label}
              </span>
            </div>

            {/* Separador ":" entre tarjetas (no tras la última). */}
            {i < units.length - 1 && (
              <span
                className="font-bold self-start"
                style={{
                  color: accent,
                  fontSize: digitSize,
                  lineHeight: 1,
                  margin: isBanner
                    ? "0.55rem clamp(0.02rem, 0.5vw, 0.1rem) 0"
                    : "0.7rem clamp(0.02rem, 0.6vw, 0.15rem) 0",
                  opacity: 0.55,
                }}
                aria-hidden="true"
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes vrd-pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.55;
            transform: scale(0.94);
          }
        }
      `}</style>
    </div>
  );
}
