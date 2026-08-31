"use client";

import { useState } from "react";
import { quoteDeliveryByPostalCode } from "@/lib/delivery";
import { PICKUP_ADDRESS } from "@/lib/store-config";

const WHATSAPP_URL =
  "https://wa.me/34605442809?text=" +
  encodeURIComponent("Hola VERDE 👋 Mi código postal no sale en vuestra zona de envío. ¿Podéis llegar hasta mí?");

export default function ZoneMap() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{
    type: "ok" | "warn" | "blocked" | null;
    msg: string;
    sub?: string;
    showWhatsApp?: boolean;
  }>({ type: null, msg: "" });

  function calcZone() {
    if (!input.trim()) return;
    // Acepta el CP suelto o dentro de una dirección ("Calle X 4, 28015 Madrid").
    const cp = input.match(/\b\d{5}\b/)?.[0];
    if (!cp) {
      setResult({
        type: "warn",
        msg: "Dinos tu código postal",
        sub: "Con los 5 dígitos nos vale — p. ej. 28039.",
      });
      return;
    }

    const quote = quoteDeliveryByPostalCode(cp);
    if (!quote.deliverable) {
      setResult({
        type: "blocked",
        msg: "Aún no llegamos a tu zona 🙏",
        sub: `Repartimos hasta 12 km de nuestra cocina. Puedes recoger tu pedido en ${PICKUP_ADDRESS} o escribirnos por WhatsApp y lo vemos.`,
        showWhatsApp: true,
      });
      window.dispatchEvent(
        new CustomEvent("verde:delivery:update", {
          detail: { deliverable: false, zone: null, fee: 0, postalCode: cp },
        })
      );
      return;
    }

    setResult({
      type: "ok",
      msg: `✅ Podemos llevarte el verde · ${quote.fee.toFixed(2).replace(".", ",")} € de envío`,
      sub:
        `Zona ${quote.zone}` +
        (quote.minOrder > 0 ? ` · Pedido mínimo ${quote.minOrder} € de comida` : "") +
        ". El envío se añade automáticamente a tu pedido.",
    });
    // Sincroniza con el carrito / formulario de pago
    window.dispatchEvent(
      new CustomEvent("verde:delivery:update", {
        detail: { deliverable: true, zone: quote.zone, fee: quote.fee, postalCode: cp },
      })
    );
  }

  const resultStyles = {
    ok: { bg: "#eaf4e8", color: "#1c3a10", border: "#c0ddb8" },
    warn: { bg: "#fef9e7", color: "#7d5a00", border: "#f0d060" },
    blocked: { bg: "#fef9e7", color: "#5a4200", border: "#f0d060" },
  };
  const rs = result.type ? resultStyles[result.type] : null;

  return (
    <section className="py-14 px-6 border-t" style={{ background: "white", borderColor: "rgba(44,90,27,0.08)" }} id="zonas">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase mb-2" style={{ color: "#c85a2a" }}>Zona de reparto</p>
        <h2 className="font-sans font-bold text-2xl mb-2" style={{ color: "#2d5a1b" }}>¿Llegamos a tu barrio?</h2>
        <p className="text-sm mb-6 mx-auto max-w-md" style={{ color: "rgba(46,46,30,0.5)" }}>
          Introduce tu código postal y te decimos si podemos llevarte el verde y cuánto cuesta el envío.
        </p>

        <div className="flex gap-2 mb-4 max-w-lg mx-auto">
          <input
            type="text"
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && calcZone()}
            placeholder="Tu código postal (p. ej. 28039)"
            className="flex-1 border-0 border-b bg-transparent px-0 py-2.5 text-sm focus:outline-none transition-colors text-center"
            style={{ borderColor: "rgba(46,46,30,0.15)", color: "#2e2e1e" }}
          />
          <button
            onClick={calcZone}
            className="text-[11px] font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-colors"
            style={{ background: "#2d5a1b", color: "#f2ead8" }}
          >
            Calcular
          </button>
        </div>

        {rs && (
          <div className="mb-2 p-4 text-sm max-w-lg mx-auto border" style={{ background: rs.bg, color: rs.color, borderColor: rs.border }}>
            <strong className="block mb-1">{result.msg}</strong>
            {result.sub && <span className="text-xs opacity-80">{result.sub}</span>}
            {result.showWhatsApp && (
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-xs font-bold underline underline-offset-2"
              >
                Escribirnos por WhatsApp ↗
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
