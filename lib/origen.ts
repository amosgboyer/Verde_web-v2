// ─── Origen del pedido: de dónde vino el cliente ─────────────────────────────
//
// Para saber cuánto vende Instagram (u otro canal) hay que apuntar, con cada pedido, por
// dónde entró el cliente. Se guarda al llegar a la web y viaja con el pedido hasta la hoja
// Orders (columnas AD–AF: utm_source, utm_campaign, referrer), donde el terminal lo lee.
//
// · UTMs: los parámetros del enlace (?utm_source=instagram&utm_campaign=bio). Son la medida
//   buena: van en la URL y sobreviven aunque el navegador de Instagram borre el referrer.
// · referrer: solo el dominio de la web de procedencia (p. ej. l.instagram.com). Complementa
//   a los UTMs; nunca la URL completa (podría llevar datos personales).
//
// Regla de atribución: el último enlace con UTMs gana; si no hay UTMs, se apunta el
// referrer solo si no había nada guardado. Caduca a los 7 días.

export type Origen = { utmSource: string; utmCampaign: string; referrer: string };

const CLAVE = "verde_origen";
const VIGENCIA_MS = 7 * 24 * 60 * 60 * 1000;
const MAX = 80;

/** Minúsculas, sin caracteres raros y con tope de longitud (va a metadata de Stripe y a la hoja). */
export function limpiarValor(v: unknown, max = MAX): string {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._\-:/ ]/g, "")
    .slice(0, max);
}

const sinWww = (h: string) => h.toLowerCase().replace(/^www\./, "");

// Dominios que no son una procedencia real (la vuelta del pago, nuestra propia web).
const NO_ES_ORIGEN = [/(^|\.)stripe\.com$/];

/**
 * Lee el origen de una visita. `hostPropio` es el dominio de la web: un referrer interno
 * (navegar de una página a otra) no cuenta como procedencia. Devuelve null si no hay nada.
 */
export function origenDeVisita(href: string, referrer: string, hostPropio: string): Origen | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const utmSource = limpiarValor(url.searchParams.get("utm_source"));
  const utmCampaign = limpiarValor(url.searchParams.get("utm_campaign"));

  let ref = "";
  if (referrer) {
    try {
      const h = sinWww(new URL(referrer).hostname);
      const propio = sinWww(hostPropio);
      const esPropio = h === propio || h.endsWith("." + propio);
      if (h && !esPropio && !NO_ES_ORIGEN.some((re) => re.test(h))) ref = limpiarValor(h);
    } catch {
      // referrer ilegible: se ignora
    }
  }

  if (!utmSource && !utmCampaign && !ref) return null;
  return { utmSource, utmCampaign, referrer: ref };
}

/** Decide qué guardar dado lo que ya había. Puro, para poder probarlo. */
export function combinarOrigen(
  nuevo: Origen | null,
  guardado: { origen: Origen; t: number } | null,
  ahora: number
): { origen: Origen; t: number } | null {
  const vigente = guardado && ahora - guardado.t < VIGENCIA_MS ? guardado : null;
  if (!nuevo) return vigente;
  if (nuevo.utmSource || nuevo.utmCampaign) return { origen: nuevo, t: ahora }; // UTMs: siempre gana el último
  if (vigente) return vigente; // solo referrer: no pisa lo que ya había
  return { origen: nuevo, t: ahora };
}

function leerGuardado(): { origen: Origen; t: number } | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) || "null");
    if (v && typeof v.t === "number" && v.origen) return v;
  } catch {
    // almacenamiento bloqueado o dañado
  }
  return null;
}

/** Al cargar cualquier página: apunta de dónde viene el cliente. Nunca lanza. */
export function capturarOrigen(): void {
  if (typeof window === "undefined") return;
  try {
    const nuevo = origenDeVisita(window.location.href, document.referrer, window.location.hostname);
    const guardado = leerGuardado();
    const resultado = combinarOrigen(nuevo, guardado, Date.now());
    if (resultado && resultado !== guardado) localStorage.setItem(CLAVE, JSON.stringify(resultado));
  } catch {
    // sin almacenamiento: el pedido simplemente irá sin origen
  }
}

/** Origen vigente para enviarlo con el pedido, o null. */
export function leerOrigen(): Origen | null {
  if (typeof window === "undefined") return null;
  const g = leerGuardado();
  return g && Date.now() - g.t < VIGENCIA_MS ? g.origen : null;
}

/** Una sola clave de metadata en Stripe (hay límite de 50 claves): "source|campaign|referrer". */
export function codificarOrigen(o: Partial<Origen> | null | undefined): string {
  if (!o) return "";
  const partes = [limpiarValor(o.utmSource), limpiarValor(o.utmCampaign), limpiarValor(o.referrer)];
  return partes.some(Boolean) ? partes.join("|") : "";
}

export function decodificarOrigen(s: string | null | undefined): Origen {
  const [utmSource = "", utmCampaign = "", referrer = ""] = String(s ?? "").split("|");
  return {
    utmSource: limpiarValor(utmSource),
    utmCampaign: limpiarValor(utmCampaign),
    referrer: limpiarValor(referrer),
  };
}
