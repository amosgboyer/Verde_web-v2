// ─── Metadata de Stripe: límites y errores de cara al cliente ───────────────
//
// Stripe limita CADA valor de metadata a 500 caracteres (y a 50 claves por
// objeto). El detalle del carrito viaja como JSON en la clave `items`, y con
// 6 productos distintos ya pasaba de 500: Stripe rechazaba la sesión y el
// cliente NO PODÍA PAGAR. Los pedidos pequeños sí pasaban, así que el fallo
// solo salía en los pedidos grandes — justo los que más duele perder.
//
// Adelgazar el JSON solo subiría el techo (de 6 a ~30 productos). Trocear lo
// quita: el valor se reparte en `items`, `items2`, `items3`… y el webhook los
// vuelve a unir. Además es compatible hacia atrás — una sesión creada antes de
// este cambio solo trae `items` y se lee igual.

export const STRIPE_META_MAX = 500;

// Margen sobre el límite real, por si Stripe cuenta caracteres de otra forma
// (unicode, escapes) — los nombres de la carta llevan acentos.
const TAM_TROZO = 400;

// Tope de trozos. Con 400 caracteres cada uno son ~4.800 caracteres de carrito,
// del orden de 55 productos distintos, y deja de sobra bajo el límite de 50
// claves. Si se superara, es mejor un mensaje claro que un error de Stripe.
const MAX_TROZOS = 12;

/** Mensaje pensado para que lo lea el cliente. El resto de errores no se le enseñan. */
export class ErrorCliente extends Error {}

/**
 * Reparte un valor largo en varias claves: `clave`, `clave2`, `clave3`…
 * Un valor corto se queda en una sola clave, como siempre.
 */
export function trocearMeta(
  clave: string,
  valor: string
): Record<string, string> {
  const out: Record<string, string> = {};
  if (valor.length <= TAM_TROZO) {
    out[clave] = valor;
    return out;
  }

  const trozos = Math.ceil(valor.length / TAM_TROZO);
  if (trozos > MAX_TROZOS) {
    throw new ErrorCliente(
      "El pedido tiene demasiados productos distintos para procesarlo de una vez. " +
        "Divídelo en dos pedidos o escríbenos por WhatsApp y lo hacemos nosotros."
    );
  }

  for (let i = 0, n = 1; i < valor.length; i += TAM_TROZO, n++) {
    out[n === 1 ? clave : `${clave}${n}`] = valor.slice(i, i + TAM_TROZO);
  }
  return out;
}

/**
 * Reconstruye el valor troceado. Si la sesión es antigua (solo `clave`),
 * devuelve esa tal cual.
 */
export function unirMeta(
  meta: Record<string, string | undefined> | null | undefined,
  clave: string
): string {
  if (!meta) return "";
  let valor = meta[clave] ?? "";
  for (let n = 2; meta[`${clave}${n}`] !== undefined; n++) {
    valor += meta[`${clave}${n}`];
  }
  return valor;
}
