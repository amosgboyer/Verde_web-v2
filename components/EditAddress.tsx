"use client";

import { useState } from "react";
import { quoteDeliveryByPostalCode } from "@/lib/delivery";

const inputClass =
  "w-full border-0 border-b border-negro/15 bg-transparent px-0 py-2.5 text-sm text-negro placeholder:text-negro/28 focus:outline-none focus:border-verde-bosque transition-colors duration-200";
const labelClass =
  "block text-[10px] font-medium uppercase tracking-[0.2em] text-negro/40 mb-2";

interface Props {
  codigo: string;
}

export default function EditAddress({ codigo }: Props) {
  const [code, setCode] = useState(codigo);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [details, setDetails] = useState("");
  const [barrio, setBarrio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Aviso de zona/tarifa de la nueva dirección (estimación desde el CP; el
  // servidor decide el cobro real de la diferencia). Misma tabla que el checkout.
  const cp = postalCode.match(/\b\d{5}\b/)?.[0] ?? "";
  const quote = cp ? quoteDeliveryByPostalCode(cp) : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim()) return setError("Introduce el código de tu pedido.");
    if (phone.trim().length < 6) return setError("Introduce el teléfono con el que hiciste el pedido.");
    if (address.trim().length < 5) return setError("Introduce la nueva dirección.");
    if (!cp) return setError("Introduce un código postal válido (5 dígitos).");

    setLoading(true);
    try {
      const res = await fetch("/api/change-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          phone: phone.trim(),
          deliveryAddress: address.trim(),
          deliveryDetails: details.trim(),
          postalCode: cp,
          deliveryZone: barrio.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No hemos podido cambiar la dirección.");
        return;
      }
      if (data.url) {
        window.location.href = data.url; // pagar la diferencia
        return;
      }
      setDone(true); // aplicado sin cobro
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="border border-verde-bosque/25 bg-verde-bosque/[0.05] rounded-xl p-6">
        <h1 className="text-verde-bosque text-xl font-bold mb-2">
          ✓ Dirección actualizada
        </h1>
        <p className="text-sm text-negro/60 leading-relaxed">
          Hemos cambiado la dirección de entrega de tu pedido. Si necesitas algo
          más, escríbenos por WhatsApp.
        </p>
        <a
          href="/"
          className="inline-block mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-verde-bosque underline underline-offset-2"
        >
          Volver a Verde
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h1 className="text-verde-bosque text-2xl font-bold tracking-tight mb-1">
        Cambiar la dirección de mi pedido
      </h1>
      <p className="text-sm text-negro/50 mb-8 leading-relaxed">
        Introduce el teléfono con el que hiciste el pedido y la nueva dirección.
        Si tu nueva dirección cae en una zona de reparto más cara, te cobraremos
        solo la diferencia del envío.
      </p>

      <div className="space-y-7">
        <div>
          <label htmlFor="code" className={labelClass}>Código de pedido</label>
          <input id="code" className={inputClass} value={code}
            onChange={(e) => setCode(e.target.value)} placeholder="Ej. VERDE-XXXX" />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Teléfono del pedido</label>
          <input id="phone" type="tel" className={inputClass} value={phone}
            onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" />
        </div>
        <div>
          <label htmlFor="address" className={labelClass}>Nueva dirección</label>
          <input id="address" className={inputClass} value={address}
            onChange={(e) => { setAddress(e.target.value); setError(null); }}
            placeholder="Calle, número, piso…" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="postalCode" className={labelClass}>Código postal</label>
            <input id="postalCode" className={inputClass} value={postalCode}
              onChange={(e) => { setPostalCode(e.target.value); setError(null); }} placeholder="28015" />
          </div>
          <div>
            <label htmlFor="barrio" className={labelClass}>Barrio (opcional)</label>
            <input id="barrio" className={inputClass} value={barrio}
              onChange={(e) => setBarrio(e.target.value)} placeholder="Chamberí" />
          </div>
        </div>
        <div>
          <label htmlFor="details" className={labelClass}>Piso, puerta, referencia</label>
          <input id="details" className={inputClass} value={details}
            onChange={(e) => setDetails(e.target.value)} placeholder="2ºA, timbre…" />
        </div>

        {quote && (
          <p className="text-[12px] text-negro/55">
            {quote.deliverable
              ? `Zona ${quote.zone} · envío ${quote.fee.toFixed(2).replace(".", ",")} €. Si es más que tu envío actual, pagarás solo la diferencia.`
              : "Esa dirección queda fuera de nuestra zona de reparto (hasta 12 km)."}
          </p>
        )}

        {error && <p className="text-tierra text-sm">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-verde-bosque text-crema text-[11px] font-semibold tracking-[0.2em] uppercase py-4 px-6 hover:bg-verde-platano transition-colors disabled:opacity-60">
          {loading ? "Procesando…" : "Guardar nueva dirección"}
        </button>
      </div>
    </form>
  );
}
