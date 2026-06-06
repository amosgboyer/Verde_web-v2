"use client";

import { useEffect, useState } from "react";

// Botón del nav que actúa como CTA "Pedir" cuando el carrito está vacío y como
// carrito (icono + nº + total) cuando hay productos. Lleva al checkout.
export default function NavCart() {
  const [cart, setCart] = useState({ items: 0, total: 0 });

  useEffect(() => {
    function onUpdate(e: Event) {
      const d = (e as CustomEvent<{ items: number; total: number }>).detail;
      if (d) setCart(d);
    }
    window.addEventListener("verde:cart:update", onUpdate);
    return () => window.removeEventListener("verde:cart:update", onUpdate);
  }, []);

  function fmt(n: number) {
    return n.toFixed(2).replace(".", ",") + " €";
  }

  function go() {
    window.dispatchEvent(new CustomEvent("verde:cart:open"));
    // Si el formulario no existe (sold out), llevar al aviso de waitlist
    const target =
      document.getElementById("reservar") || document.getElementById("waitlist");
    target?.scrollIntoView({ behavior: "smooth" });
  }

  const hasItems = cart.items > 0;

  return (
    <button
      type="button"
      onClick={go}
      aria-label={hasItems ? `Ver carrito · ${cart.items} producto(s)` : "Hacer un pedido"}
      className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium tracking-[0.03em] px-3.5 py-2 rounded-lg text-cream bg-g1 hover:bg-g0 transition-colors whitespace-nowrap"
    >
      {hasItems ? (
        <>
          <span aria-hidden>🛒</span>
          <span className="tabular-nums">{cart.items}</span>
          <span className="hidden sm:inline tabular-nums">· {fmt(cart.total)}</span>
        </>
      ) : (
        "Pedir"
      )}
    </button>
  );
}
