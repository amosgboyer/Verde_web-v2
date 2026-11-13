"use client";

import { useEffect, useState } from "react";
import { offerEndsAtMs, type WeekendOffer } from "@/lib/offers";

// Cuenta atrás hasta que la oferta deja de verse (00:00 del día siguiente a
// endDate, hora de Madrid). Se pinta solo en el navegador para no chocar con
// el HTML del servidor (la hora cambia entre uno y otro), y desaparece sola
// al llegar a cero.
export default function OfferCountdown({
  offer,
  className = "",
  light = false,
}: {
  offer: WeekendOffer;
  className?: string;
  /** Texto blanco, para usarla sobre fondo naranja. */
  light?: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return null;
  const left = offerEndsAtMs(offer) - now;
  if (left <= 0) return null;

  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  const cells: [string, string][] = [
    ...(d > 0 ? ([[String(d), d === 1 ? "día" : "días"]] as [string, string][]) : []),
    [pad(h), "h"],
    [pad(m), "min"],
    [pad(sec), "seg"],
  ];

  const fg = light ? "#fff" : "#a8451f";
  const cellBg = light ? "rgba(255,255,255,0.18)" : "rgba(200,90,42,0.12)";

  return (
    <div
      className={`flex items-center gap-2 flex-wrap ${className}`}
      role="timer"
      aria-live="off"
      aria-label={`La oferta termina en ${d > 0 ? `${d} días, ` : ""}${h} horas y ${m} minutos`}
    >
      <span
        className="text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: fg }}
      >
        Termina en
      </span>
      <span className="flex items-center gap-1">
        {cells.map(([v, unit]) => (
          <span
            key={unit}
            className="flex items-baseline gap-0.5 rounded-md px-1.5 py-0.5 tabular-nums"
            style={{ background: cellBg, color: fg }}
          >
            <span className="text-[15px] font-extrabold leading-none">{v}</span>
            <span className="text-[9px] font-semibold opacity-80">{unit}</span>
          </span>
        ))}
      </span>
    </div>
  );
}
