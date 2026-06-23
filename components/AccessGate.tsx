"use client";

import { useRef, useState } from "react";

const TARGET = "VERDE MADRID";
const GLYPHS = "01010110<>/\\#%&{}[]=+*01ABCDEF01";

// Gate de acceso anticipado: el usuario pega su código binario; al acertar,
// una animación lo "descifra" hasta revelar VERDE MADRID y desbloquea reservar.
export default function AccessGate({
  code,
  onUnlock,
}: {
  code: string;
  onUnlock: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [granted, setGranted] = useState(false);
  const [scramble, setScramble] = useState(TARGET);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clean = (s: string) => s.replace(/\s+/g, "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (decoding || granted) return;
    if (clean(value) !== clean(code)) {
      setError("Código incorrecto. Revisa el que te enviamos por WhatsApp.");
      return;
    }
    setError(null);
    setDecoding(true);

    let frame = 0;
    const total = 38;
    intervalRef.current = setInterval(() => {
      frame++;
      const locked = Math.floor((frame / total) * TARGET.length);
      let out = "";
      for (let i = 0; i < TARGET.length; i++) {
        if (TARGET[i] === " ") {
          out += " ";
        } else if (i < locked) {
          out += TARGET[i];
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      setScramble(out);
      if (frame >= total) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setScramble(TARGET);
        setGranted(true);
        setTimeout(onUnlock, 1100);
      }
    }, 45);
  }

  return (
    <div
      className="relative my-6 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0d1f08 0%, #16300d 100%)",
        border: "1px solid rgba(122,179,86,0.35)",
        boxShadow: "0 12px 48px rgba(13,31,8,0.45)",
      }}
    >
      <div className="p-8 sm:p-10 text-center font-mono">
        {!decoding && !granted && (
          <>
            <p
              className="text-[0.62rem] tracking-[0.3em] uppercase mb-3"
              style={{ color: "rgba(122,179,86,0.7)" }}
            >
              🔒 Acceso anticipado · lista de espera
            </p>
            <h3
              className="font-bold mb-2"
              style={{ color: "#f2ead8", fontSize: "1.25rem" }}
            >
              Introduce tu código cifrado
            </h3>
            <p
              className="text-xs mb-6 max-w-sm mx-auto leading-relaxed"
              style={{ color: "rgba(245,237,216,0.5)" }}
            >
              Pega el código que te enviamos por WhatsApp para desbloquear tu
              reserva. El martes abrimos para todos.
            </p>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                placeholder="0101 1011 ..."
                autoComplete="off"
                spellCheck={false}
                className="w-full text-center rounded-lg px-4 py-3 text-sm tracking-[0.15em] outline-none"
                style={{
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(122,179,86,0.4)",
                  color: "#b8d89a",
                }}
              />
              <button
                type="submit"
                className="mt-4 w-full rounded-lg py-3 text-[0.72rem] font-bold tracking-[0.2em] uppercase transition-colors"
                style={{ background: "#509234", color: "#0d1f08" }}
              >
                Descifrar ▸
              </button>
              {error && (
                <p className="mt-3 text-xs" style={{ color: "#e08a6a" }}>
                  {error}
                </p>
              )}
            </form>
          </>
        )}

        {decoding && (
          <div className="py-4">
            <p
              className="text-[0.62rem] tracking-[0.35em] uppercase mb-5"
              style={{ color: "rgba(122,179,86,0.8)" }}
            >
              {granted ? "✓ Acceso concedido" : "Descifrando…"}
            </p>
            <div
              className="font-bold tracking-[0.15em]"
              style={{
                color: granted ? "#b8d89a" : "#7ab356",
                fontSize: "clamp(1.6rem, 6vw, 2.6rem)",
                textShadow: granted
                  ? "0 0 24px rgba(122,179,86,0.6)"
                  : "0 0 14px rgba(122,179,86,0.35)",
                transition: "color .4s, text-shadow .4s",
              }}
            >
              {scramble}
            </div>
            {granted && (
              <p
                className="text-xs mt-5"
                style={{ color: "rgba(245,237,216,0.6)" }}
              >
                Desbloqueando tu reserva…
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
