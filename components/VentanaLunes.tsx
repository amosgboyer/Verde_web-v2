"use client";

import { useEffect, useState } from "react";
import { estadoVentana, VENTANA_LUNES } from "@/lib/ventana-lunes";

// ─── Banner de la Ventana del Lunes ─────────────────────────────────────────
// Franja fija arriba del todo mientras la ventana está abierta (lunes
// 15:33–15:48 Madrid): entra deslizándose, cuenta atrás en vivo y en el último
// minuto se pone urgente. Al cerrarse desaparece sola. El countdown es
// escaparate — el descuento real lo decide el servidor al pagar.
//
// ?ventana=preview lo enseña cualquier día con una cuenta simulada (marcada
// como vista previa) para poder verlo sin esperar al lunes. El preview NO
// activa ningún descuento: el servidor ni se entera.

function fmtMMSS(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function VentanaLunes() {
  const [segundos, setSegundos] = useState(0);
  const [live, setLive] = useState(false);
  const [preview, setPreview] = useState(false);
  const [cerrado, setCerrado] = useState(false); // la × del cliente

  useEffect(() => {
    const esPreview =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("ventana") === "preview";
    setPreview(esPreview);

    if (esPreview) {
      // Cuenta simulada completa, para verla sin esperar al lunes.
      setLive(true);
      setSegundos(VENTANA_LUNES.duracionMin * 60);
      const t = setInterval(
        () => setSegundos((s) => (s > 0 ? s - 1 : VENTANA_LUNES.duracionMin * 60)),
        1000
      );
      return () => clearInterval(t);
    }

    const tick = () => {
      const e = estadoVentana();
      setLive(e.live);
      setSegundos(e.segundosRestantes);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  if (!live || cerrado) return null;

  const urgente = !preview && segundos <= 60;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[95] animate-slide-down"
      role="status"
      style={{
        background: urgente
          ? "linear-gradient(90deg, #7f1212, #b91c1c)"
          : "linear-gradient(90deg, #b91c1c, #c85a2a)",
        boxShadow: "0 4px 24px rgba(127,18,18,0.45)",
      }}
    >
      <style>{`
        @keyframes vl-slide-down { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        .animate-slide-down { animation: vl-slide-down 0.45s cubic-bezier(0.16,1,0.3,1); }
        @keyframes vl-tick { 0% { transform: scale(1); } 50% { transform: scale(${urgente ? 1.12 : 1.045}); } 100% { transform: scale(1); } }
        .vl-digits { animation: vl-tick 1s ease-in-out infinite; }
      `}</style>

      <div className="max-w-[1060px] mx-auto flex items-center justify-center gap-3 sm:gap-5 px-4 py-2.5 text-white">
        <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-white animate-ping shrink-0" />

        <p className="text-[11px] sm:text-[12.5px] font-bold uppercase tracking-[0.14em] leading-tight text-center">
          {VENTANA_LUNES.nombre} · −{VENTANA_LUNES.porcentaje}% en toda la carta
          <span className="block sm:inline normal-case font-medium tracking-normal text-white/85">
            {" "}pagando ahora, para entregas de miércoles o jueves
          </span>
        </p>

        <span
          className="vl-digits font-mono font-extrabold tabular-nums text-lg sm:text-2xl shrink-0"
          aria-label={`Quedan ${fmtMMSS(segundos)} minutos`}
        >
          {fmtMMSS(segundos)}
        </span>

        {preview && (
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] bg-white/20 rounded-full px-2 py-0.5 shrink-0">
            vista previa
          </span>
        )}

        <button
          type="button"
          onClick={() => setCerrado(true)}
          aria-label="Ocultar el aviso"
          className="shrink-0 w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 transition-colors leading-none text-sm"
        >
          ×
        </button>
      </div>
    </div>
  );
}
