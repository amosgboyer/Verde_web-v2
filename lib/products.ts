import { todayMadrid } from "./directo";

export interface Product {
  id: string;
  name: string;
  description: string;
  finalPrice: number;       // precio total que paga el cliente al recoger
  depositAmount: number;    // abono que se paga al reservar (siempre 1 €)
  available: boolean;
  allergens?: string[];
  image?: string;           // ruta a /public o URL externa
  category?: string;
  isPack?: boolean;         // true = combo/pack con precio propio (no se muestra en la carta)
}

export const PRODUCTS: Product[] = [
  // ─── VERDE Y SOLO VERDE — Herencia cultural y vínculo con la tierra ───
  {
    id: "bolon-mixto-casa",
    name: "Bolón Mixto de la Casa",
    description:
      "Verde, chicharrón, queso manaba, demiglace, salsa verde de queso y sal prieta.",
    finalPrice: 10,
    depositAmount: 10,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "verde",
  },
  {
    id: "tigrillo-xl-mixto",
    name: "Tigrillo Mixto",
    description:
      "Hecho en demiglass de carne, chicharrón, mix de quesos, salsa de maní de la casa y sal prieta.",
    finalPrice: 15,
    depositAmount: 15,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "verde",
  },
  {
    id: "tigrillo-media-racion",
    name: "Tigrillo Media Ración",
    description:
      "Media ración de tigrillo mixto hecho en caldo madre, chicharrón, rabo desmenuzado, mix de quesos, salsa de maní y sal prieta.",
    finalPrice: 9,
    depositAmount: 9,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "verde",
  },
  {
    id: "corviche-pescado",
    name: "Corviche de Pescado",
    description:
      "Corviche frito, pesca del día en su reahogado, salsa de maní, aceite de cilantro y ensalada manaba de col.",
    finalPrice: 15,
    depositAmount: 15,
    available: true,
    allergens: ["Pescado", "Maní"],
    category: "verde",
  },
  {
    id: "patacon-rabo-toro",
    name: "Patacón de Rabo de Toro",
    description:
      "Patacón crocante, rabo de toro con 16h de cocción, cebolla caramelizada, queso gruyer y mostaza antigua.",
    finalPrice: 10,
    depositAmount: 10,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "verde",
  },

  // ─── PARA LOS AMANTES DEL MADURO — Una versión más dulce, intensa y contundente ───
  {
    id: "bolon-mixto-maduro",
    name: "Bolón Mixto con Maduro",
    description:
      "Maduro, chicharrón, queso manaba, demiglace, salsa verde de queso y sal prieta.",
    finalPrice: 10,
    depositAmount: 10,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "maduro",
  },
  {
    id: "canoa-maduro",
    name: "Canoa de Maduro",
    description:
      "Maduro, queso manaba, chicharrón, mix de quesos fundidos, tocino caramelizado, salsa verde de queso y sal prieta.",
    finalPrice: 12,
    depositAmount: 12,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "maduro",
  },

  // ─── OTROS PRODUCTOS — Más opciones disponibles ───
  {
    id: "ahora-comen-todos",
    name: "Ahora Comen Todos",
    description:
      "6 mini bolones mixtos de la casa para compartir con sus salsas.",
    finalPrice: 20,
    depositAmount: 20,
    available: true,
    allergens: ["Consultar"],
    category: "otros",
  },
  {
    id: "racion-patacon",
    name: "Ración de Patacón",
    description:
      "Cuatro patacones de la casa, salsa verde de queso, queso manaba y sal prieta.",
    finalPrice: 6,
    depositAmount: 6,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "otros",
  },
];

// ─── PACKS / COMBOS — precio propio con descuento ya aplicado ───
// Se cobran como un único producto (precio cerrado) para que el carrito y
// Stripe cobren exactamente el precio anunciado. No se muestran en la carta.
export const PACKS: Product[] = [
  {
    id: "pack-dos-tigrillos",
    name: "Pack · Los Dos Tigrillos",
    description:
      "2× Tigrillo Mixto. Hecho en demiglass de carne, chicharrón, mix de quesos y sal prieta.",
    finalPrice: 27,
    depositAmount: 27,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "pack",
    isPack: true,
  },
  {
    id: "pack-bolon-patacon",
    name: "Pack · Bolón + Patacón",
    description:
      "Bolón Mixto de la Casa + Ración de Patacón con salsa verde de queso y queso manaba.",
    finalPrice: 14,
    depositAmount: 14,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "pack",
    isPack: true,
  },
  {
    id: "pack-grupo",
    name: "Pack · Para Todo el Grupo",
    description:
      "Ahora Comen Todos + Ración de Patacón. Para 3–4 personas con ganas de verde.",
    finalPrice: 24,
    depositAmount: 24,
    available: true,
    allergens: ["Consultar"],
    category: "pack",
    isPack: true,
  },
];

// Fotos de los platos (en /public/productos). Se usan si el producto no trae
// imageUrl propio desde el Sheet. Clave = productId del Sheet.
export const PRODUCT_IMAGES: Record<string, string> = {
  "bolon-mixto": "/productos/bolon-mixto.jpg",
  "tigrillo-mixto": "/productos/tigrillo.jpg",
  "tigrillo-media-racion": "/productos/tigrillo.jpg",
  "corviche-de-pescado": "/productos/corviche.jpg",
  "patacón-con-rabo-de-toto": "/productos/patacon-rabo.jpg",
  "tortilla-de-verde": "/productos/tortilla-verde.jpg",
  "bollo-de-verde": "/productos/bollo-verde.jpg",
  "bolon-mixto-con-maduro": "/productos/bolon-maduro.jpg",
  "canoa-de-maduro": "/productos/canoa-maduro.jpg",
  "Ahora -comen": "/productos/ahora-comen.jpg",
  "ración-patacon": "/productos/racion-patacon.jpg",
  "agua": "/productos/agua.jpg",
  "coca-cola": "/productos/coca-cola.jpg",
  "coca-cola-zero": "/productos/coca-cola-zero.jpg",
  "fuze-tea-limon": "/productos/fuze-tea.jpg",
  "tropical": "/productos/tropical.jpg",
  "inca-kola": "/productos/inca-kola.jpg",
  "ceviche-jipijapa": "/productos/ceviche-jipijapa.jpg",
  "colonche-de-chicharron": "/productos/colonche-de-chicharron.jpg",
  "chicharron-con-guacamole": "/productos/chicharron-con-guacamole.jpg",
};

export function imageForProduct(p: { id: string; image?: string }): string | undefined {
  // Los ids del Sheet se escriben a mano y a veces llevan mayúsculas
  // ("Inca-kola"), así que se reintenta en minúsculas antes de rendirse.
  return p.image || PRODUCT_IMAGES[p.id] || PRODUCT_IMAGES[p.id.toLowerCase()];
}

// ─── SALSAS EXTRA (de pago) ────────────────────────────────────────────────
// Se ofrecen en el popup de extras (no como card en la carta). Se validan y
// cobran como productos normales (categoría "Salsas").
export const EXTRA_SALSAS: Product[] = [
  {
    id: "salsa-aji-extra",
    name: "Salsa de ají extra",
    description: "Ají de la casa para darle chispa.",
    finalPrice: 1.5,
    depositAmount: 1.5,
    available: true,
    category: "Salsas",
  },
  {
    id: "salsa-verde-extra",
    name: "Salsa verde extra",
    description: "Salsa verde de queso de la casa.",
    finalPrice: 1.5,
    depositAmount: 1.5,
    available: true,
    category: "Salsas",
  },
  {
    id: "salsa-mani-secreta",
    name: "Salsa de maní secreta",
    description: "Salsa de maní de la casa, nuestra receta única.",
    finalPrice: 1.5,
    depositAmount: 1.5,
    available: true,
    // Kewpie = huevo, pasta de maní = cacahuete, ajonjolí = sésamo. Falta
    // confirmar la etiqueta de la salsa kimchi (pescado/crustáceos/soja son
    // habituales) — si los trae, añadirlos aquí Y en la columna G del Sheet.
    allergens: ["Cacahuetes", "Huevos", "Sésamo"],
    category: "Salsas",
  },
];

export function getSalsas(): Product[] {
  return EXTRA_SALSAS.filter((s) => s.available);
}

// ─── BEBIDAS DE LA CARTA (definidas en código) ─────────────────────────────
// No viven en el Sheet: se inyectan en la carta delante de las bebidas que sí
// vienen del Sheet. El checkout y el webhook las resuelven por `getProductById`
// (igual que las salsas), así que se cobran y se guardan como cualquier otra.
export const EXTRA_BEBIDAS: Product[] = [
  {
    id: "tropical",
    name: "Tropical",
    description:
      "Gaseosa ecuatoriana sabor a frutas. Botella de 500 ml, bien fría.",
    finalPrice: 2.5,
    depositAmount: 2.5,
    available: true,
    category: "Bebidas",
    image: "/productos/tropical.jpg",
  },
  {
    id: "inca-kola",
    name: "Inca Kola",
    description:
      "La gaseosa dorada, sabor original. Botella de vidrio de 300 ml.",
    finalPrice: 2.5,
    depositAmount: 2.5,
    available: true,
    category: "Bebidas",
    image: "/productos/inca-kola.jpg",
  },
];

export function getBebidas(): Product[] {
  return EXTRA_BEBIDAS.filter((b) => b.available);
}

// ─── PLATOS DE LA CARTA (definidos en código) ──────────────────────────────
// Mismo mecanismo que las bebidas: la carta real vive en el Sheet, pero desde
// aquí se puede añadir producto sin tocarlo. Si el Sheet acaba trayendo el
// mismo id, manda el Sheet y este deja de usarse (no se duplica).
export const EXTRA_PLATOS: Product[] = [
  {
    id: "chicharron-con-guacamole",
    name: "Chicharrón con Guacamole",
    description:
      "Panceta fresca crujiente, guacamole de la casa, patacón, ají manaba y lima.",
    finalPrice: 14,
    depositAmount: 14,
    available: true,
    // "Consultar" a propósito: tres subrecetas (guacamole, ají manaba y ajís
    // encurtidos) no están desglosadas y el ají manabita lleva maní a menudo.
    // Así la web dice al alérgico que pregunte, en vez de callar y dar a
    // entender que no hay nada. Sustituir por el valor real al confirmarlo.
    allergens: ["Consultar"],
    category: "otros",
    image: "/productos/chicharron-con-guacamole.jpg",
  },
  {
    id: "colonche-de-chicharron",
    name: "Colonche de Chicharrón",
    description:
      "Patacones, rehogado de la casa, salsa de maní, aguacate, sal prieta y mucho chicharrón.",
    finalPrice: 15,
    depositAmount: 15,
    available: true,
    allergens: ["Maní"],
    category: "verde", // igual que en el Sheet, por si algún día se lee de aquí
    image: "/productos/colonche-de-chicharron.jpg",
  },
  {
    id: "ceviche-jipijapa",
    name: "Ceviche Jipijapa",
    description:
      "Corvina fresca, leche de tigre, maní, aguacate, tostado, chifle, mix de encurtidos y aceite de cilantro.",
    finalPrice: 18,
    depositAmount: 18,
    available: true,
    allergens: ["Pescado", "Maní"],
    category: "otros",
    image: "/productos/ceviche-jipijapa.jpg",
  },
];

export function getPlatosExtra(): Product[] {
  return EXTRA_PLATOS.filter((p) => p.available);
}

// ─── Categorías ────────────────────────────────────────────────────────────
// Fuente única del vocabulario de categorías. La carta (ReservationForm) y la
// vitrina (MenuShowcase) agrupan con esto mismo, así que un producto añadido
// desde código cae exactamente en el bloque que se ve en pantalla.
export type NormalizedCategory = "Verde" | "Maduro" | "Otros" | "Bebidas";

export function normalizeCategory(raw: string): NormalizedCategory {
  const lower = (raw ?? "").trim().toLowerCase();
  if (lower === "verde") return "Verde";
  if (lower === "maduro") return "Maduro";
  if (
    lower === "bebida" ||
    lower === "bebidas" ||
    lower === "drink" ||
    lower === "drinks"
  )
    return "Bebidas";
  return "Otros";
}

function isBebida(category?: string): boolean {
  return normalizeCategory(category ?? "") === "Bebidas";
}

// Bebidas que van SIEMPRE las primeras dentro de "Bebidas", en este orden y
// vengan de donde vengan (código o Sheet). El Sheet añade filas al final, así
// que sin esto acabarían las últimas al migrarlas allí.
const BEBIDAS_PRIMERO: string[] = ["tropical", "inca-kola"];

// Los ids del Sheet se teclean a mano: "Inca-kola" y "inca-kola" son el mismo
// producto. Comparar en crudo duplicaría la card (una del Sheet y otra del
// código), así que todas las comparaciones de id van normalizadas. Exportada
// para que las páginas dedupliquen igual (salsas y packs contra el Sheet).
export const mismoId = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

// ─── Agotados temporales (con fecha de caducidad) ──────────────────────────
// Fuerzan el cartel "Agotado hoy" en la web hasta la fecha indicada INCLUSIVE
// (día natural de Madrid), pisando lo que diga la hoja. Al día siguiente se
// reactivan SOLOS — nadie tiene que acordarse de revertir nada, igual que las
// ofertas con ventana. Para agotar algo sin fecha de vuelta, usar la columna F
// de la hoja, que para eso está.
const AGOTADOS_TEMPORALES: { id: string; hasta: string }[] = [
  // Fin de semana del 28-30 ago: vuelven el lunes 31 a las 00:00.
  { id: "patacón-con-rabo-de-toto", hasta: "2026-08-30" },
  { id: "chicharron-con-guacamole", hasta: "2026-08-30" },
];

/**
 * ¿Está este producto agotado por código ahora mismo? La usan también el
 * checkout y /api/add-to-order: sin esa comprobación en servidor, un carrito
 * abierto en otra pestaña podría comprar el plato "agotado" igualmente —
 * la hoja sigue diciendo TRUE y el cartel solo vive en la carta.
 */
export function estaAgotadoTemporal(id: string): boolean {
  const hoy = todayMadrid();
  return AGOTADOS_TEMPORALES.some(
    (a) => mismoId(a.id, id) && hoy <= a.hasta
  );
}

/**
 * Deja la carta con las bebidas destacadas al frente del bloque de bebidas:
 *
 *  1. Añade las de `EXTRA_BEBIDAS` que no estén ya en la lista. Si el mismo id
 *     ya viene del Sheet, manda el Sheet y no se duplica.
 *  2. Reordena el bloque de bebidas para que las de `BEBIDAS_PRIMERO` salgan
 *     primero; el resto conserva su orden original.
 *
 * El bloque de bebidas se reinserta donde estaba la primera bebida, así que el
 * orden del resto de la carta no se toca.
 */
export function withExtraBebidas(products: Product[]): Product[] {
  const nuevas = getBebidas().filter(
    (b) => !products.some((p) => mismoId(p.id, b.id))
  );

  const posiciones = products
    .map((p, i) => (!p.isPack && isBebida(p.category) ? i : -1))
    .filter((i) => i >= 0);

  if (posiciones.length === 0) return [...products, ...nuevas];

  const rango = (p: Product) => {
    const k = BEBIDAS_PRIMERO.findIndex((id) => mismoId(id, p.id));
    return k === -1 ? BEBIDAS_PRIMERO.length : k;
  };
  const bebidas = [...posiciones.map((i) => products[i]), ...nuevas]
    .map((p, orden) => ({ p, orden }))
    .sort((a, b) => rango(a.p) - rango(b.p) || a.orden - b.orden)
    .map(({ p }) => p);

  const primera = posiciones[0];
  const resto = products.filter((_, i) => !posiciones.includes(i));
  return [...resto.slice(0, primera), ...bebidas, ...resto.slice(primera)];
}

/**
 * Inyecta los platos de `EXTRA_PLATOS` al PRINCIPIO de su bloque de categoría
 * (para que un plato nuevo se vea, no quede sepultado al final). Si su
 * categoría todavía no existe en la carta, va al final de la lista. Dedupe por
 * id normalizado: si el Sheet ya lo trae, manda el Sheet.
 */
export function withExtraPlatos(products: Product[]): Product[] {
  let salida = [...products];

  for (const plato of getPlatosExtra()) {
    if (salida.some((p) => mismoId(p.id, plato.id))) continue;

    const cat = normalizeCategory(plato.category ?? "");
    const idx = salida.findIndex(
      (p) => !p.isPack && normalizeCategory(p.category ?? "") === cat
    );
    salida =
      idx === -1
        ? [...salida, plato]
        : [...salida.slice(0, idx), plato, ...salida.slice(idx)];
  }

  return salida;
}

// Todo lo que se añade o se pisa desde código, en una sola llamada. Es lo que
// usan las páginas: así, al añadir un producto o un agotado temporal, no hay
// que acordarse de tocar cada página por separado. El agotado se aplica al
// FINAL, sobre la lista ya fusionada, para que pise igual la versión de la
// hoja que la del respaldo.
export function withExtraProducts(products: Product[]): Product[] {
  return withExtraPlatos(withExtraBebidas(products)).map((p) =>
    estaAgotadoTemporal(p.id) ? { ...p, available: false } : p
  );
}

export function getPacks(): Product[] {
  return PACKS.filter((p) => p.available);
}

// ─── Novedades del escaparate ──────────────────────────────────────────────
// El bloque de arriba de la home tiene una zona de "Novedades" (platos sueltos)
// y otra de packs. Estos son los platos que se empujan arriba, EN ESTE ORDEN.
// Para cambiar las novedades, tocar esta lista; vaciarla oculta la zona entera.
export const DESTACADOS_IDS: string[] = [
  "chicharron-con-guacamole",
  "colonche-de-chicharron",
  "ceviche-jipijapa",
];

/**
 * Resuelve las novedades contra la lista REAL de la carta (la del Sheet si
 * está), no contra el catálogo estático: así el precio y la disponibilidad del
 * escaparate son los mismos que los de la carta y los del cobro. Un id que no
 * exista o esté agotado simplemente no sale.
 */
export function getDestacados(products: Product[]): Product[] {
  return DESTACADOS_IDS.map((id) =>
    products.find((p) => !p.isPack && p.available !== false && mismoId(p.id, id))
  ).filter((p): p is Product => !!p);
}

export function getProductById(id: string): Product | undefined {
  return [
    ...PRODUCTS,
    ...PACKS,
    ...EXTRA_SALSAS,
    ...EXTRA_BEBIDAS,
    ...EXTRA_PLATOS,
  ].find((p) => p.id === id);
}

export function getAvailableProducts(): Product[] {
  return PRODUCTS.filter((p) => p.available);
}
