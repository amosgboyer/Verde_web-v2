"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./RepartoForm.module.css";
import { IDIOMAS, ITEMS, NADA } from "@/lib/reparto-opciones";

type Evento = { fecha: string; hora: string; lugar: string; abierto: boolean };
type Persona = { nombre: string; trae: string[]; otro: string };

type Datos = {
  nombre: string;
  telefono: string;
  trae: string[];
  otro: string;
  idiomas: string[];
  publico: boolean;
  acepta: boolean;
};

const VACIO: Datos = {
  nombre: "",
  telefono: "",
  trae: [],
  otro: "",
  idiomas: [],
  publico: true,
  acepta: false,
};

const WHATSAPP = "+34 605 442 809";
const WHATSAPP_URL = "https://wa.me/34605442809";
const STORAGE_KEY = "verde-reparto-v1";

type Paso = {
  id: "nombre" | "telefono" | "trae" | "otro" | "idiomas" | "final";
  k: string;
  q: string;
  hint?: string;
  optional?: boolean;
};

const PASOS: Paso[] = [
  { id: "nombre", k: "Te llamas", q: "Para empezar, ¿cómo te llamamos?", hint: "Nombre y apellido, o como te conozca la gente." },
  { id: "telefono", k: "Teléfono", q: "¿A qué número te escribimos?", hint: "Por WhatsApp te mandamos la ruta y cualquier cambio de última hora." },
  { id: "trae", k: "Trae", q: "¿Qué puedes traer?", hint: "Elige todo lo que quieras. Si no puedes traer nada, también vale: lo importante es venir." },
  { id: "otro", k: "Además", q: "¿Algo más, o cuánto traes?", hint: "Opcional. Ej. «10 bocadillos», «2 mantas», «ropa de hombre talla L».", optional: true },
  { id: "idiomas", k: "Hablas", q: "¿Qué idiomas hablas?", hint: "Opcional. En la calle ayuda mucho poder hablar con la gente en su idioma.", optional: true },
  { id: "final", k: "", q: "Último paso" },
];

const lista = (a: string[]) => a.join(", ");
const nombrePila = (n: string) => n.trim().split(/\s+/)[0] ?? "";

function valorVisible(d: Datos, id: Paso["id"]): string {
  if (id === "trae") return lista(d.trae);
  if (id === "idiomas") return lista(d.idiomas);
  if (id === "final") return "";
  return d[id];
}

function errorDe(d: Datos, p: Paso): string {
  if (p.optional) return "";
  if (p.id === "nombre" && d.nombre.trim().length < 2) return "Escribe tu nombre para seguir.";
  if (p.id === "telefono" && (d.telefono.match(/\d/g) ?? []).length < 9)
    return "Ese número parece incompleto: necesitamos al menos 9 cifras.";
  if (p.id === "trae" && d.trae.length === 0) return "Elige al menos una opción.";
  return "";
}

export default function RepartoForm() {
  const [d, setD] = useState<Datos>(VACIO);
  const [paso, setPaso] = useState(0);
  const [modo, setModo] = useState<"flujo" | "pase">("flujo");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [trampa, setTrampa] = useState("");
  const [evento, setEvento] = useState<Evento>({ fecha: "Lunes 5 de octubre", hora: "", lugar: "", abierto: true });
  const [gente, setGente] = useState<Persona[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const primeraCarga = useRef(true);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch("/api/reparto", { cache: "no-store" });
      const j = await r.json();
      setEvento(j.evento);
      setGente(j.listaDisponible ? j.gente : null);
    } catch {
      setGente(null);
    }
  }, []);

  // Datos del día + lista, y si esta persona ya se apuntó desde este móvil.
  useEffect(() => {
    cargar();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const prev = JSON.parse(raw) as Datos;
        setD({ ...VACIO, ...prev, acepta: true });
        setModo("pase");
      }
    } catch {
      /* sin almacenamiento: empezamos de cero */
    }
  }, [cargar]);

  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    inputRef.current?.focus();
  }, [paso]);

  const p = PASOS[paso];

  const siguiente = () => {
    if (p.id === "final") return enviar();
    const e = errorDe(d, p);
    if (e) return setError(e);
    setError("");
    setPaso(paso + 1);
  };

  const toggle = (campo: "trae" | "idiomas", v: string) => {
    setD((prev) => {
      let a = prev[campo].slice();
      if (campo === "trae" && v === NADA) a = a.includes(v) ? [] : [v];
      else {
        a = a.filter((x) => x !== NADA);
        a = a.includes(v) ? a.filter((x) => x !== v) : [...a, v];
      }
      return { ...prev, [campo]: a };
    });
    setError("");
  };

  async function enviar() {
    if (!d.acepta) return setError("Marca la casilla de datos para apuntarte.");
    setEnviando(true);
    setError("");
    try {
      const r = await fetch("/api/reparto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, web: trampa }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No hemos podido guardarlo.");
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...d, acepta: false }));
      } catch {
        /* no pasa nada */
      }
      setModo("pase");
      window.scrollTo({ top: 0, behavior: "smooth" });
      cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const empezarDeNuevo = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada */
    }
    setD(VACIO);
    setPaso(0);
    setModo("flujo");
  };

  // ─── Recuento de lo que llega ──────────────────────────────────────────────
  const recuento: Record<string, number> = {};
  (gente ?? []).forEach((g) => g.trae.forEach((t) => t !== NADA && (recuento[t] = (recuento[t] ?? 0) + 1)));
  const fechaCorta = (() => {
    const m = evento.fecha.match(/(\d{1,2})\s+de\s+(\p{L}{3})/iu);
    return m ? `Lun · ${m[1]} ${m[2].toLowerCase()}` : "Lunes";
  })();

  const chip = (on: boolean) =>
    `rounded-full border px-4 py-2 text-[0.95rem] leading-tight text-left transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gold ${
      on ? "bg-g1 border-g1 text-cream" : "bg-cream border-cream3 text-ink hover:border-g2"
    }`;

  const btn =
    "rounded-xl bg-g1 text-cream font-medium px-5 py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-g0 transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gold";
  const btnGhost =
    "rounded-xl border border-cream3 text-ink px-5 py-3 hover:border-g2 transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gold";

  return (
    <div className="mx-auto max-w-[1040px] px-5 pb-20 pt-8 sm:pt-12">
      {/* Cabecera del día */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-cream3 pb-3">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-gray">Reparto solidario · Verde</p>
        <p className="text-[0.9rem] text-gray">
          <b className="font-medium text-ink">{evento.fecha}</b> · {evento.hora || "hora por confirmar"} ·{" "}
          {evento.lugar || "lugar por confirmar"}
        </p>
      </div>

      <div className="mt-8 grid items-start gap-8 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)] md:gap-12">
        {/* ── Conversación ── */}
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(1.9rem,5vw,2.8rem)] leading-[1.05] text-g1 [text-wrap:balance]">
            Este lunes salimos a llevar comida y abrigo a quien duerme en la calle. ¿Te vienes?
          </h1>
          <p className="mb-7 mt-3 max-w-[46ch] text-gray">
            Cinco preguntas cortas, una cada vez. Mientras respondes se va escribiendo tu etiqueta. Abajo ves qué trae ya
            cada persona, para no repetir y cubrir lo que falta.
          </p>

          {!evento.abierto && modo === "flujo" ? (
            <div className="rounded-2xl border border-cream3 bg-[var(--white)] p-6">
              <h2 className="font-display text-2xl text-g1">Inscripciones cerradas</h2>
              <p className="mt-2 text-gray">
                Ya estamos completos para este reparto. Si quieres ayudar en el próximo, escríbenos al{" "}
                <span className="select-all font-medium text-ink">{WHATSAPP}</span>.
              </p>
            </div>
          ) : modo === "pase" ? (
            <div className={`${styles.stage} rounded-2xl border border-cream3 bg-[var(--white)] p-6`}>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-gray">Inscripción guardada</p>
              <h2 className="mt-1 font-display text-[1.8rem] leading-tight text-g1">
                Gracias, {nombrePila(d.nombre)}. Nos vemos el lunes.
              </h2>
              <p className="mt-1 text-gray">Te escribiremos al {d.telefono} con la ruta.</p>
              <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-1.5">
                <dt className="pt-1 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-gray">Día</dt>
                <dd>{evento.fecha}</dd>
                <dt className="pt-1 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-gray">Hora</dt>
                <dd>{evento.hora || "Te la confirmamos por WhatsApp"}</dd>
                <dt className="pt-1 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-gray">Dónde</dt>
                <dd>{evento.lugar || "Te lo confirmamos por WhatsApp"}</dd>
              </dl>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button type="button" className={btnGhost} onClick={() => { setPaso(2); setModo("flujo"); }}>
                  Cambiar lo que traigo
                </button>
                <button type="button" className="px-1 text-sm text-gray underline underline-offset-4" onClick={empezarDeNuevo}>
                  Apuntar a otra persona
                </button>
              </div>
              <p className="mt-4 text-sm text-gray">
                ¿Ya no puedes venir? Avísanos al <span className="select-all">{WHATSAPP}</span> o por{" "}
                <a className="text-g2 underline underline-offset-4" href={WHATSAPP_URL} target="_blank" rel="noopener">
                  WhatsApp
                </a>
                .
              </p>
            </div>
          ) : (
            <>
              {paso > 0 && (
                <ul className="mb-4 flex flex-col">
                  {PASOS.slice(0, paso)
                    .filter((x) => x.id !== "final")
                    .map((x, i) => {
                      const v = valorVisible(d, x.id);
                      return (
                        <li key={x.id} className="flex items-baseline gap-3 border-b border-dashed border-cream3 py-1.5 text-[0.92rem]">
                          <span className="min-w-[6.5em] text-gray">{x.k}</span>
                          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{v || <span className="text-lgray">—</span>}</span>
                          <button
                            type="button"
                            className="px-1 text-[0.8rem] text-g2 underline underline-offset-4"
                            onClick={() => { setError(""); setPaso(i); }}
                          >
                            cambiar
                          </button>
                        </li>
                      );
                    })}
                </ul>
              )}

              <div key={p.id} className={`${styles.stage} rounded-2xl border border-cream3 bg-[var(--white)] p-6`}>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-gray">
                  Pregunta {paso + 1} de {PASOS.length}
                </p>
                <h2 className="mt-1 font-display text-[1.55rem] leading-tight text-ink">{p.q}</h2>
                {p.hint && <p className="mb-4 mt-1 text-[0.92rem] text-gray">{p.hint}</p>}

                {(p.id === "nombre" || p.id === "telefono" || p.id === "otro") && (
                  <input
                    ref={inputRef}
                    id={`reparto-${p.id}`}
                    aria-label={p.q}
                    type={p.id === "telefono" ? "tel" : "text"}
                    autoComplete={p.id === "telefono" ? "tel" : p.id === "nombre" ? "name" : "off"}
                    placeholder={p.id === "nombre" ? "Ej. Lucía Martín" : p.id === "telefono" ? "+34 6__ ___ ___" : "Escribe aquí"}
                    value={d[p.id]}
                    maxLength={p.id === "otro" ? 200 : 80}
                    onChange={(e) => { setD({ ...d, [p.id]: e.target.value }); setError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); siguiente(); } }}
                    className="w-full border-0 border-b-2 border-cream3 bg-transparent px-0.5 py-2 text-[1.15rem] text-ink outline-none focus:border-g1"
                  />
                )}

                {(p.id === "trae" || p.id === "idiomas") && (
                  <div className="flex flex-wrap gap-2" role="group" aria-label={p.q}>
                    {(p.id === "trae" ? ITEMS : IDIOMAS).map((o) => {
                      const on = d[p.id as "trae" | "idiomas"].includes(o);
                      return (
                        <button key={o} type="button" aria-pressed={on} className={chip(on)} onClick={() => toggle(p.id as "trae" | "idiomas", o)}>
                          {o}
                          {p.id === "trae" && o !== NADA && recuento[o] ? (
                            <span className={`ml-2 font-mono text-[0.72rem] ${on ? "text-cream/80" : "text-gray"}`}>
                              ya {recuento[o]}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}

                {p.id === "final" && (
                  <div className="flex flex-col gap-3">
                    <label htmlFor="reparto-publico" className="flex cursor-pointer items-start gap-3 text-[0.95rem]">
                      <input
                        id="reparto-publico"
                        type="checkbox"
                        className="mt-1 h-[18px] w-[18px] flex-none accent-[#2d5a1b]"
                        checked={d.publico}
                        onChange={(e) => setD({ ...d, publico: e.target.checked })}
                      />
                      <span>Que aparezca mi nombre de pila junto a lo que traigo. Si no, salgo como «Alguien».</span>
                    </label>
                    <label htmlFor="reparto-acepta" className="flex cursor-pointer items-start gap-3 text-[0.95rem]">
                      <input
                        id="reparto-acepta"
                        type="checkbox"
                        className="mt-1 h-[18px] w-[18px] flex-none accent-[#2d5a1b]"
                        checked={d.acepta}
                        onChange={(e) => { setD({ ...d, acepta: e.target.checked }); setError(""); }}
                      />
                      <span>
                        Acepto que Verde guarde estos datos solo para coordinar este reparto y escribirme por WhatsApp.{" "}
                        <a href="/politica-privacidad" className="text-g2 underline underline-offset-4" target="_blank">
                          Privacidad
                        </a>
                      </span>
                    </label>
                    <div className={styles.trap} aria-hidden="true">
                      <label htmlFor="reparto-web">No rellenar</label>
                      <input id="reparto-web" tabIndex={-1} autoComplete="off" value={trampa} onChange={(e) => setTrampa(e.target.value)} />
                    </div>
                  </div>
                )}

                <p role="alert" className="mt-2 min-h-[1.3em] text-[0.88rem] text-[#a3261b]">{error}</p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button type="button" className={btn} onClick={siguiente} disabled={enviando}>
                    {p.id === "final"
                      ? enviando ? "Guardando…" : "Apuntarme"
                      : p.optional && !valorVisible(d, p.id).trim() ? "Saltar" : "Siguiente"}
                  </button>
                  {paso > 0 && (
                    <button type="button" className="px-1 text-gray underline underline-offset-4" onClick={() => { setError(""); setPaso(paso - 1); }}>
                      Atrás
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Etiqueta ── */}
        <aside className="-order-1 md:sticky md:top-[80px] md:order-none" aria-label="Tu etiqueta">
          <div className={`${styles.tag} ${modo === "pase" ? styles.done : ""}`}>
            <div className={styles.head}>
              <span>Sale a repartir</span>
              <span>{fechaCorta}</span>
            </div>
            <div className={`${styles.who} ${d.nombre ? "" : styles.empty}`}>{d.nombre || "tu nombre"}</div>
            <dl className={styles.rows}>
              <dt>Trae</dt>
              <dd className={d.trae.length ? "" : styles.empty}>{lista(d.trae) || "…"}</dd>
              <dt>Además</dt>
              <dd className={d.otro ? "" : styles.empty}>{d.otro || "…"}</dd>
              <dt>Habla</dt>
              <dd className={d.idiomas.length ? "" : styles.empty}>{lista(d.idiomas) || "…"}</dd>
            </dl>
            <div className={styles.stamp} aria-hidden="true">APUNTADO</div>
          </div>
          <p className="mt-4 text-center text-[0.82rem] text-gray">
            {modo === "pase" ? "Esta es tu etiqueta para el lunes." : "Se rellena sola mientras contestas."}
          </p>
        </aside>
      </div>

      {/* ── Quién va y qué trae ── */}
      <section className="mt-14 border-t border-cream3 pt-6" aria-labelledby="quien-va">
        <h2 id="quien-va" className="font-display text-[1.6rem] text-g1">
          Quién va y qué trae{gente ? <span className="ml-2 font-mono text-base text-gray">{gente.length}</span> : null}
        </h2>
        <p className="mt-1 text-[0.9rem] text-gray">
          Los teléfonos solo los ve Verde. En gris, lo que todavía no trae nadie.
        </p>

        {gente === null ? (
          <p className="mt-4 text-[0.9rem] text-gray">La lista no se puede cargar ahora mismo. Tu inscripción se guarda igual.</p>
        ) : (
          <>
            <ul className="mt-4 flex flex-wrap gap-2">
              {ITEMS.filter((i) => i !== NADA).map((i) => {
                const n = recuento[i] ?? 0;
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-2 rounded-full border py-1 pl-3 pr-1.5 text-[0.88rem] ${
                      n ? "border-g2 bg-g4/40 text-ink" : "border-cream3 text-gray"
                    }`}
                  >
                    {i}
                    <b className={`min-w-[1.7em] rounded-full px-1.5 text-center font-mono text-[0.78rem] font-normal tabular-nums ${n ? "bg-g1 text-cream" : "bg-cream3 text-gray"}`}>
                      {n}
                    </b>
                  </li>
                );
              })}
            </ul>
            <ul className="mt-5 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {gente.length === 0 ? (
                <li className="py-2 text-[0.9rem] text-gray">Aún no se ha apuntado nadie. Puedes ser la primera persona.</li>
              ) : (
                gente.map((g, i) => (
                  <li key={i} className="flex min-w-0 items-baseline gap-3 border-b border-dashed border-cream3 py-2">
                    <span className="min-w-[4.5em] flex-none font-caveat text-[1.5rem] font-semibold leading-none">{g.nombre}</span>
                    <span className="min-w-0 text-[0.9rem] [overflow-wrap:anywhere]">
                      {lista(g.trae) || "—"}
                      {g.otro ? <em className="text-gray"> · {g.otro}</em> : null}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
