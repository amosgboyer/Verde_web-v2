"use client";

import { useEffect, useState } from "react";

// This component listens to a global cart event system
// ReservationForm dispatches "verde:cart:update" events
interface CartState {
  items: number;
  total: number;
}

export default function FloatingCart({ onOpen }: { onOpen?: () => void }) {
  const [cart, setCart] = useState<CartState>({ items: 0, total: 0 });

  useEffect(() => {
    function onUpdate(e: Event) {
      const detail = (e as CustomEvent<CartState>).detail;
      setCart(detail);
    }
    window.addEventListener("verde:cart:update", onUpdate);
    return () => window.removeEventListener("verde:cart:update", onUpdate);
  }, []);

  if (cart.items === 0) return null;

  function fmt(n: number) { return n.toFixed(2).replace(".", ",") + " €"; }

  return (
    <div
      onClick={() => {
        onOpen?.();
        document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" });
      }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-1"
      style={{
        background: "#1c3a10",
        boxShadow: "0 8px 40px rgba(28,58,16,0.4)",
        minWidth: 190,
      }}
    >
      <span style={{ fontSize: "1.1rem" }}>🛒</span>
      <div style={{ flex: 1 }}>
        <div className="text-[11px]" style={{ color: "rgba(245,240,232,0.6)" }}>
          {cart.items} {cart.items === 1 ? "producto" : "productos"}
        </div>
        <div className="font-bold text-base" style={{ color: "#f2ead8", fontFamily: "Georgia, serif" }}>
          {fmt(cart.total)}
        </div>
      </div>
      <span className="text-sm" style={{ color: "rgba(245,240,232,0.55)" }}>→</span>
    </div>
  );
}
