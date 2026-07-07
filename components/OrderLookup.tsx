"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderLookup({ error }: { error?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");

  function byCode(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) router.push(`/anadir?codigo=${encodeURIComponent(c)}`);
  }

  function byPhone(e: React.FormEvent) {
    e.preventDefault();
    const p = phone.trim();
    if (!p) return;
    const q = new URLSearchParams({ tel: p });
    if (date) q.set("fecha", date);
    router.push(`/anadir?${q.toString()}`);
  }

  const inputStyle =
    "w-full rounded-lg px-4 py-3 text-sm outline-none bg-white border border-negro/15 focus:border-verde-bosque transition-colors";
  const btnStyle =
    "mt-3 w-full rounded-lg py-3 text-[0.72rem] font-bold tracking-[0.2em] uppercase bg-verde-bosque text-crema hover:bg-verde-platano transition-colors";

  return (
    <div className="max-w-md mx-auto">
      <p className="font-mono text-[0.62rem] tracking-[0.3em] uppercase text-verde-bosque/70 mb-2">
        Añadir a tu pedido
      </p>
      <h1 className="font-sans font-bold text-2xl text-negro/85 mb-2">
        ¿Se te olvidó algo?
      </h1>
      <p className="text-sm text-negro/50 mb-8 leading-relaxed">
        Añade lo que quieras a un pedido que ya hiciste. Solo pagas lo nuevo, sin
        cobrarte el envío otra vez.
      </p>

      {error && (
        <div
          className="mb-6 rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(200,90,42,0.08)", color: "#b4491f" }}
        >
          {error}
        </div>
      )}

      {/* Por nº de pedido */}
      <form onSubmit={byCode} className="mb-8">
        <label className="block text-xs font-semibold text-negro/60 mb-2">
          Con tu nº de pedido
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ej. A1HJ9YKM"
          autoComplete="off"
          className={inputStyle}
          style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}
        />
        <button type="submit" className={btnStyle}>
          Buscar mi pedido
        </button>
        <p className="mt-2 text-[11px] text-negro/40">
          Está en tu email de confirmación y en la pantalla de "pedido
          confirmado".
        </p>
      </form>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex-1 h-px bg-negro/10" />
        <span className="text-[11px] uppercase tracking-wider text-negro/35">
          o
        </span>
        <div className="flex-1 h-px bg-negro/10" />
      </div>

      {/* Por teléfono + fecha */}
      <form onSubmit={byPhone}>
        <label className="block text-xs font-semibold text-negro/60 mb-2">
          Con tu teléfono
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Tu móvil (el del pedido)"
          inputMode="tel"
          autoComplete="tel"
          className={`${inputStyle} mb-2`}
        />
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          type="date"
          className={inputStyle}
        />
        <button type="submit" className={btnStyle}>
          Buscar mi pedido
        </button>
        <p className="mt-2 text-[11px] text-negro/40">
          La fecha de entrega/recogida de tu pedido.
        </p>
      </form>
    </div>
  );
}
