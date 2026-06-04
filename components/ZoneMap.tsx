"use client";

import { useState } from "react";
import { quoteDelivery } from "@/lib/delivery";

export default function ZoneMap() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "ok" | "warn" | "blocked" | null; msg: string; sub?: string }>({ type: null, msg: "" });

  async function calcZone() {
    if (!address.trim()) return;
    setLoading(true);
    setResult({ type: null, msg: "" });
    try {
      const quote = await quoteDelivery(address);
      if (!quote) {
        setResult({ type: "warn", msg: "No encontramos esa dirección", sub: "Prueba: Calle + número + Madrid" });
        setLoading(false);
        return;
      }

      if (!quote.deliverable) {
        setResult({ type: "blocked", msg: "Aún no llegamos a tu zona 🙏", sub: "Estamos creciendo y pronto ampliaremos el reparto. Síguenos en @verde_madrid para enterarte cuando lleguemos a tu barrio." });
        window.dispatchEvent(new CustomEvent("verde:delivery:update", { detail: { deliverable: false, zone: null, fee: 0, address } }));
      } else {
        const price = quote.fee;
        setResult({
          type: quote.zone && quote.zone <= 2 ? "ok" : "warn",
          msg: `✅ Podemos llevarte el verde · ${price.toFixed(2).replace(".", ",")} € de envío`,
          sub: "El envío se añade automáticamente a tu pedido.",
        });
        // Sincroniza con el carrito / formulario de pago
        window.dispatchEvent(new CustomEvent("verde:delivery:update", {
          detail: { deliverable: true, zone: quote.zone, fee: quote.fee, address },
        }));
      }
    } catch {
      setResult({ type: "warn", msg: "Error de conexión", sub: "Inténtalo de nuevo." });
    }
    setLoading(false);
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
          Introduce tu dirección y te decimos si podemos llevarte el verde y cuánto cuesta el envío.
        </p>

        <div className="flex gap-2 mb-4 max-w-lg mx-auto">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && calcZone()}
            placeholder="Tu dirección en Madrid..."
            className="flex-1 border-0 border-b bg-transparent px-0 py-2.5 text-sm focus:outline-none transition-colors text-center"
            style={{ borderColor: "rgba(46,46,30,0.15)", color: "#2e2e1e" }}
          />
          <button
            onClick={calcZone}
            disabled={loading}
            className="text-[11px] font-bold tracking-[0.15em] uppercase px-5 py-2.5 transition-colors disabled:opacity-50"
            style={{ background: "#2d5a1b", color: "#f2ead8" }}
          >
            {loading ? "..." : "Calcular"}
          </button>
        </div>

        {rs && (
          <div className="mb-2 p-4 text-sm max-w-lg mx-auto border" style={{ background: rs.bg, color: rs.color, borderColor: rs.border }}>
            <strong className="block mb-1">{result.msg}</strong>
            {result.sub && <span className="text-xs opacity-80">{result.sub}</span>}
          </div>
        )}
      </div>
    </section>
  );
}
