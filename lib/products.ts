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
  // true = solo se ve y se pide desde Novedades (arriba); no sale en la carta.
  soloNovedades?: boolean;
  // Unidades que quedan si el plato es de edición limitada (stock total). Lo
  // calcula el servidor (lib/stock) y lo usa la card para mostrar "quedan X".
  stockRemaining?: number;
  // Tipo de IVA que YA incluye el precio (informativo; no cambia el importe).
  // 0.10 para toda la comida actual. Las bebidas alcohólicas y los refrescos
  // azucarados irán al 0.21 cuando se añadan. Opcional: la carta real viene del
  // Sheet (sin columna de IVA), así que se resuelve con `vatRateOf` (default 10%).
  vatRate?: number;
  // Precio rebajado SOLO para pedidos hechos entre `desde` y `hasta` (ambos
  // inclusive, día natural de Madrid). Lo aplica `conPromo` en getPacks y en
  // getProductById, así que la carta y el cobro de Stripe ven el mismo precio.
  // Se apaga sola al pasar `hasta`.
  promo?: { precio: number; desde: string; hasta: string; etiqueta: string };
  // El producto SOLO se ve y se puede pedir en pedidos hechos entre `desde` y
  // `hasta` (inclusive, día natural de Madrid). Fuera de la ventana no sale en
  // la web y el checkout lo rechaza como no disponible.
  ventana?: { desde: string; hasta: string; abreEn?: string };
  // Días de ENTREGA en los que se puede reservar (inclusive). Fuera de ellos,
  // `agotadoParaFecha` lo da por agotado: la carta lo marca y el checkout lo
  // rechaza con un aviso que dice para qué días es.
  entrega?: { fechas: string[]; texto: string };
  // Extras en oferta (popup «Completa tu pedido»): van primero, con el color de
  // oferta, esta etiqueta y el precio de antes tachado.
  oferta?: { etiqueta: string; precioAntes: number };
}

/** ¿El producto está dentro de su ventana de venta hoy (Madrid)? Sin ventana, siempre. */
export function enVentana(p: Product): boolean {
  if (!p.ventana) return true;
  if (p.ventana.abreEn && Date.now() < Date.parse(p.ventana.abreEn)) return false;
  const hoy = todayMadrid();
  return hoy >= p.ventana.desde && hoy <= p.ventana.hasta;
}

/** ¿La promo de precio del producto está vigente hoy (Madrid)? */
export function promoVigente(p: Product): boolean {
  if (!p.promo) return false;
  const hoy = todayMadrid();
  return hoy >= p.promo.desde && hoy <= p.promo.hasta;
}

/** El producto con su precio de promo si está vigente hoy; si no, tal cual.
 *  Fuera de su ventana de venta sale como no disponible. */
export function conPromo(p: Product): Product {
  if (!enVentana(p)) return { ...p, available: false };
  if (!promoVigente(p)) return p;
  return { ...p, finalPrice: p.promo!.precio, depositAmount: p.promo!.precio };
}

// IVA que incluye el precio de un producto. Toda la comida actual va al 10 %;
// un producto puede fijar su propio `vatRate` (p. ej. 0.21 para alcohol o
// refrescos azucarados) y entonces manda ese.
export const DEFAULT_VAT_RATE = 0.10;
export function vatRateOf(p: { vatRate?: number }): number {
  return p.vatRate ?? DEFAULT_VAT_RATE;
}

export const PRODUCTS: Product[] = [
  // ─── VERDE Y SOLO VERDE — Herencia cultural y vínculo con la tierra ───
  {
    id: "bolon-mixto-casa",
    name: "Bolón Mixto de la Casa",
    description:
      "Verde, chicharrón, queso manaba, demiglace, salsa verde de queso y sal prieta.",
    finalPrice: 11,
    depositAmount: 11,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "verde",
  },
  {
    id: "tigrillo-xl-mixto",
    name: "Tigrillo Mixto",
    description:
      "Hecho en demiglass de carne, chicharrón, mix de quesos, salsa de maní de la casa y sal prieta.",
    finalPrice: 16,
    depositAmount: 16,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "verde",
  },
  {
    id: "tigrillo-media-racion",
    name: "Tigrillo Media Ración",
    description:
      "Media ración de tigrillo mixto hecho en caldo madre, chicharrón, rabo desmenuzado, mix de quesos, salsa de maní y sal prieta.",
    finalPrice: 9.5,
    depositAmount: 9.5,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "verde",
  },
  {
    id: "corviche-pescado",
    name: "Corviche de Pescado",
    description:
      "Corviche frito, pesca del día en su reahogado, salsa de maní, aceite de cilantro y ensalada manaba de col.",
    // Excepción a la subida ago-2026: Amos decidió dejarlo en 15 € (31-08).
    finalPrice: 15,
    depositAmount: 15,
    available: true,
    allergens: ["Pescado", "Maní"],
    category: "pesca",
  },
  {
    id: "patacon-rabo-toro",
    name: "Patacón de Rabo de Toro",
    description:
      "Patacón crocante, rabo de toro con 16h de cocción, cebolla caramelizada, queso gruyer y mostaza antigua.",
    finalPrice: 11,
    depositAmount: 11,
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
    finalPrice: 11,
    depositAmount: 11,
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "maduro",
  },
  {
    id: "canoa-maduro",
    name: "Canoa de Maduro",
    description:
      "Maduro, queso manaba, chicharrón, mix de quesos fundidos, tocino caramelizado, salsa verde de queso y sal prieta.",
    finalPrice: 13,
    depositAmount: 13,
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
    finalPrice: 22,
    depositAmount: 22,
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
    // Black Friday 2026 (Amos, 24-11): Dos Tigrillos −30 % (29 → 20,30 €) para
    // ENTREGAS del viernes 27 y del domingo 29. Se abre hoy martes a las 20:00.
    // Escandallo: 7,42 € → deja ~12,90 €.
    id: "pack-dos-tigrillos-bf",
    name: "Pack · Los Dos Tigrillos −30% (Black Friday)",
    description:
      "2× Tigrillo Mixto con un 30 % de descuento. Para entregas del viernes 27 y del domingo 29.",
    finalPrice: 20.3,
    depositAmount: 20.3,
    ventana: { desde: "2026-11-24", hasta: "2026-11-29", abreEn: "2026-11-24T20:00:00+01:00" },
    entrega: { fechas: ["2026-11-27", "2026-11-29"], texto: "del viernes 27 y del domingo 29" },
    available: true,
    allergens: ["Lácteos", "Maní"],
    category: "pack",
    isPack: true,
  },
  {
    id: "pack-dos-tigrillos",
    name: "Pack · Los Dos Tigrillos",
    description:
      "2× Tigrillo Mixto. Hecho en demiglass de carne, chicharrón, mix de quesos y sal prieta.",
    finalPrice: 29,
    depositAmount: 29,
    // Black Friday 2026: para entregas del 27 al 29 este pack está bloqueado
    // (AGOTADO_POR_FECHA) y se vende el de Black Friday a 27 €.
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
    finalPrice: 15,
    depositAmount: 15,
    // APAGADO 24-11-2026 (Amos): el pack que menos deja (8,82 €) y en caída.
    // Lo sustituyen los packs con Maduro con Macambo de postre.
    available: false,
    allergens: ["Lácteos", "Maní"],
    category: "pack",
    isPack: true,
  },
  {
    // 24-11-2026 (Amos): Canoa + el Maduro con Macambo de postre. Suelto 20 €.
    // Escandallo: 2,63 + 3,00 € → deja ~11,50 €.
    id: "pack-canoa-macambo",
    name: "Pack · Canoa + Maduro con Macambo",
    description:
      "Canoa de Maduro y, de postre, Maduro con Macambo: maduro asado con mantequilla, queso, macambo tostado y menta.",
    finalPrice: 17,
    depositAmount: 17,
    // APAGADO 24-11 (Amos): lo sustituye el pack Black Friday Dulce (con elección).
    available: false,
    allergens: ["Lácteos", "Maní"],
    category: "pack",
    isPack: true,
  },
  {
    // Semana de Black Friday (Amos, 24-11): SOLO entregas del jueves 26. Corviche +
    // Patacón de Rabo de Toro; sueltos 26 €. Escandallo: 2,85 + 2,30 € → deja ~17,85 €.
    id: "pack-mar-y-tierra",
    name: "Pack · Mar y Tierra",
    description:
      "Corviche de Pescado + Patacón de Rabo de Toro. Solo para entregas del jueves 26.",
    finalPrice: 23,
    depositAmount: 23,
    // Se puede pedir desde ya; solo se ENTREGA el jueves 26.
    ventana: { desde: "2026-11-24", hasta: "2026-11-26" },
    entrega: { fechas: ["2026-11-26"], texto: "del jueves 26" },
    // QUITADO 24-11 (Amos): lo sustituye el lineup de Black Friday.
    available: false,
    allergens: ["Pescado", "Maní", "Lácteos", "Apio", "Mostaza", "Sulfitos"],
    category: "pack",
    isPack: true,
  },
  {
    // 24-11-2026 (Amos): Bolón con Maduro + Maduro con Macambo de postre.
    // Suelto 18 €. Escandallo: 4,30 + 3,00 € → deja ~8,80 €.
    id: "pack-bolon-macambo",
    name: "Pack · Bolón con Maduro + Maduro con Macambo",
    description:
      "Bolón Mixto con Maduro y, de postre, Maduro con Macambo: maduro asado con mantequilla, queso, macambo tostado y menta.",
    finalPrice: 15.9,
    depositAmount: 15.9,
    // APAGADO 24-11 (Amos): lo sustituye el pack Black Friday Dulce (con elección).
    available: false,
    allergens: ["Lácteos", "Maní"],
    category: "pack",
    isPack: true,
  },
  {
    // 24-11-2026 (Amos): un solo pack con elección — Canoa de Maduro o Bolón
    // Mixto con Maduro — y el Maduro con Macambo de postre. Fijo (no caduca).
    // La elección va a las notas del pedido ("Pack Dulce: …", PRODUCT_CHOICES).
    // Sueltos: 20 € (Canoa) / 18 € (Bolón). Deja ~11,30 € / ~9,60 €.
    id: "pack-black-friday-dulce",
    name: "Pack · Black Friday Dulce",
    description:
      "Elige Canoa de Maduro o Bolón Mixto con Maduro y, de postre, Maduro con Macambo: maduro asado con mantequilla, queso, macambo tostado y menta.",
    finalPrice: 16.9,
    depositAmount: 16.9,
    // QUITADO 24-11 (Amos): de packs, solo los Dos Tigrillos (y su −30 % en su día).
    available: false,
    allergens: ["Lácteos", "Maní"],
    category: "pack",
    isPack: true,
  },
  {
    id: "pack-grupo",
    name: "Pack · Para Todo el Grupo",
    description:
      "Ahora Comen Todos + Ración de Patacón. Para 3–4 personas con ganas de verde.",
    finalPrice: 26,
    depositAmount: 26,
    available: false, // APAGADO 02-09: el pack que menos se pide (decisión Amos)
    allergens: ["Consultar"],
    category: "pack",
    isPack: true,
  },

  // ─── MENÚS CON BEBIDA (sep 2026) ─────────────────────────────────────────
  // Plato héroe + bebida ecuatoriana a 1,90 € dentro del menú (suelta 2,50).
  // Sale Tropical por defecto; el cliente puede pedir Inca Kola en las notas.
  // Palanca de attach de bebidas: en ago-2026 solo el 9% de pedidos llevaba
  // bebida frente al 30% de salsas.
  {
    id: "menu-tigrillo",
    name: "Menú · Tigrillo + Bebida",
    description:
      "Tigrillo Mixto + Tropical bien fría. ¿La prefieres Inca Kola? Dínoslo en las notas del pedido.",
    finalPrice: 17.9,
    depositAmount: 17.9,
    available: false, // APAGADO: pendiente de decidir combinación/precios con Amos
    allergens: ["Lácteos", "Maní"],
    category: "pack",
    isPack: true,
  },
  {
    id: "menu-corviche",
    name: "Menú · Corviche + Bebida",
    description:
      "Corviche de Pescado + Tropical bien fría. ¿La prefieres Inca Kola? Dínoslo en las notas del pedido.",
    finalPrice: 16.9,
    depositAmount: 16.9,
    available: false, // APAGADO: pendiente de decidir combinación/precios con Amos
    allergens: ["Pescado", "Maní"],
    category: "pack",
    isPack: true,
  },
  {
    id: "menu-ceviche",
    name: "Menú · Ceviche + Bebida",
    description:
      "Ceviche Jipijapa + Tropical bien fría. ¿La prefieres Inca Kola? Dínoslo en las notas del pedido.",
    finalPrice: 20.9,
    depositAmount: 20.9,
    available: false, // APAGADO: pendiente de decidir combinación/precios con Amos
    allergens: ["Pescado", "Maní"],
    category: "pack",
    isPack: true,
  },
  {
    id: "menu-sango",
    name: "Menú · Sango + Bebida",
    description:
      "Sango de pescado a la parrilla + Tropical bien fría. ¿La prefieres Inca Kola? Dínoslo en las notas del pedido.",
    finalPrice: 26.9,
    depositAmount: 26.9,
    available: false, // APAGADO: pendiente de decidir combinación/precios con Amos
    allergens: ["Pescado", "Cacahuetes", "Lácteos"],
    category: "pack",
    isPack: true,
  },
];

// ─── Elecciones incluidas en un producto ─────────────────────────────────────
// Opciones que NO cambian el precio (p. ej. la bebida del menú de la semana).
// Se eligen en la tarjeta del producto y viajan al pedido en las NOTAS — la
// cocina las lee donde ya lee alergias y cubiertos; el contrato del Sheet no
// cambia. Fuente única: la usan la card del bloque de packs y el formulario.
export const PRODUCT_CHOICES: {
  productId: string;
  label: string;
  options: string[];
}[] = [
  {
    productId: "menu-semana",
    label: "Bebida del menú",
    options: [
      "Tropical",
      "Inca Kola",
      "Coca-Cola",
      "Coca-Cola Zero",
      "Fuze Tea",
      "Agua",
    ],
  },
  {
    productId: "pack-black-friday-dulce",
    label: "Pack Dulce",
    options: ["Canoa de Maduro", "Bolón Mixto con Maduro"],
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
  "empanada-de-queso": "/productos/empanada-de-queso-topping.jpg",
  "maduro-con-macambo": "/productos/maduro-con-macambo.jpg",
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
    // 24-11-2026 (Amos): las tres salsas de la casa juntas a precio cerrado,
    // para cualquier plato de la carta (sale el primero en el popup de extras).
    // Sueltas 6 €. Escandallo: 0,17 + 0,45 + 0,84 € → deja ~3 €.
    id: "trio-salsas",
    name: "Trío de salsas",
    description: "Ají de la casa, salsa verde de queso y nuestra salsa de maní secreta. Las tres por 4,50 €.",
    finalPrice: 4.5,
    depositAmount: 4.5,
    // Semana de Black Friday (Amos, 24-11): entregas de miércoles 25 a domingo 29.
    // Se ve desde ya (lo antes que se entrega es mañana miércoles).
    ventana: { desde: "2026-11-24", hasta: "2026-11-29", abreEn: "2026-11-24T20:00:00+01:00" },
    entrega: {
      fechas: ["2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"],
      texto: "del miércoles 25 al domingo 29",
    },
    oferta: { etiqueta: "Oferta · ahorras 1,50 €", precioAntes: 6 },
    available: true,
    allergens: ["Lácteos", "Cacahuetes", "Huevos", "Sésamo"],
    category: "Salsas",
  },
  {
    id: "salsa-aji-extra",
    name: "Salsa de ají extra",
    description: "Ají de la casa para darle chispa.",
    finalPrice: 2,
    depositAmount: 2,
    available: true,
    category: "Salsas",
  },
  {
    id: "salsa-verde-extra",
    name: "Salsa verde extra",
    description: "Salsa verde de queso de la casa.",
    finalPrice: 2,
    depositAmount: 2,
    available: true,
    category: "Salsas",
  },
  {
    id: "salsa-mani-secreta",
    name: "Salsa de maní secreta",
    description: "Salsa de maní de la casa, nuestra receta única.",
    finalPrice: 2,
    depositAmount: 2,
    available: true,
    // Kewpie = huevo, pasta de maní = cacahuete, ajonjolí = sésamo. Falta
    // confirmar la etiqueta de la salsa kimchi (pescado/crustáceos/soja son
    // habituales) — si los trae, añadirlos aquí Y en la columna G del Sheet.
    allergens: ["Cacahuetes", "Huevos", "Sésamo"],
    category: "Salsas",
  },
  {
    // Topping de la Empanada de Queso. Sale en el popup de salsas Y dentro de
    // la card de la empanada (PRODUCT_ADDONS en ReservationForm): mismo id,
    // así que es la misma línea del carrito.
    id: "extra-empanada-queso-mayo",
    name: "Queso y mayonesa de sal prieta",
    description: "Queso rallado, mayonesa de sal prieta y sal prieta por encima.",
    finalPrice: 2,
    depositAmount: 2,
    available: true,
    // Mayonesa = huevo; sal prieta = maní.
    allergens: ["Lácteos", "Huevos", "Cacahuetes"],
    category: "Salsas",
  },
];

// Toppings que en el popup de salsas van PRIMERO y destacados, ligados a su
// plato (se muestran con la foto y el nombre del plato al que van).
export const SALSAS_DESTACADAS: { id: string; baseId: string; etiqueta: string }[] = [
  {
    id: "extra-empanada-queso-mayo",
    baseId: "empanada-de-queso",
    etiqueta: "Topping de la Empanada de Queso",
  },
];

export function getSalsas(): Product[] {
  return EXTRA_SALSAS.filter((s) => s.available && enVentana(s));
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
    finalPrice: 19,
    depositAmount: 19,
    available: true,
    allergens: ["Pescado", "Maní"],
    category: "pesca",
    image: "/productos/ceviche-jipijapa.jpg",
  },
  {
    id: "empanada-de-queso",
    name: "Empanada de Queso",
    description:
      "Masa de verde crocante, rellena de queso mozzarella fundido. Pídela con queso rallado, mayonesa de sal prieta y sal prieta por 2 € más.",
    finalPrice: 5,
    depositAmount: 5,
    available: true,
    // Receta (verdehost): plátano verde, mozzarella, maicena, sal → solo
    // lácteos. Los alérgenos del topping van en su propio producto (abajo).
    allergens: ["Lácteos"],
    category: "verde",
    image: "/productos/empanada-de-queso-topping.jpg",
  },
  {
    // Nov 2026: versión para compartir del Patacón de Rabo de Toro, en el
    // formato del Ahora Comen Todos (que es de mini bolones).
    id: "ahora-comen-todos-rabo",
    name: "Ahora Comen Todos · Rabo de Toro",
    description:
      "4 pataconcitos crocantes con rabo de toro de 16h de cocción, cebolla caramelizada, queso gruyer y mostaza antigua. Para compartir.",
    finalPrice: 19.9,
    depositAmount: 19.9,
    // Publicado 16-11 (Amos): 19,90 €, solo en Novedades, fuera de la carta.
    available: true,
    soloNovedades: true,
    // Mismos alérgenos que el Patacón de Rabo de Toro (hoja Products).
    allergens: ["Lácteos", "Apio", "Mostaza", "Sulfitos"],
    category: "Ahora -comen", // mismo bloque que el Ahora Comen Todos de bolones
    // Foto pendiente (Amos la pasa). Sin imagen hasta entonces.
  },
  {
    // 24-11-2026 (Amos): plato nuevo, 7 €. Escandallo: coste 2,83 €/porción.
    id: "maduro-con-macambo",
    name: "Maduro con Macambo",
    description:
      "Maduro asado en su piel con mantequilla, queso rallado, macambo tostado y menta fresca.",
    finalPrice: 7,
    depositAmount: 7,
    available: true,
    // Receta: queso + mantequilla → lácteos. El macambo es semilla de la
    // familia del cacao, no fruto seco.
    allergens: ["Lácteos"],
    // 24-11-2026 (Amos): va en la sección de Maduro (no en Postres ni Acompañantes).
    category: "maduro",
    image: "/productos/maduro-con-macambo.jpg",
  },
];

export function getPlatosExtra(): Product[] {
  return EXTRA_PLATOS.filter((p) => p.available);
}

// ─── Categorías ────────────────────────────────────────────────────────────
// Fuente única del vocabulario de categorías. La carta (ReservationForm) y la
// vitrina (MenuShowcase) agrupan con esto mismo, así que un producto añadido
// desde código cae exactamente en el bloque que se ve en pantalla.
export type NormalizedCategory =
  | "Menu"
  | "Verde"
  | "Maduro"
  | "Pesca"
  | "Otros"
  | "Acompanantes"
  | "Bebidas";

// Platos del Sheet que van en otra sección que la de su categoría (sin tocar
// la hoja). 24-11-2026 (Amos): la Ración de Patacón pasa a Acompañantes.
const CATEGORIA_POR_ID: Record<string, NormalizedCategory> = {
  "ración-patacon": "Acompanantes",
  "racion-patacon": "Acompanantes",
};
/** Sección de la carta de un producto: la de su id si está forzada; si no, la de su categoría. */
export function categoriaDe(p: { id: string; category?: string }): NormalizedCategory {
  const forzada = Object.entries(CATEGORIA_POR_ID).find(([id]) => mismoId(id, p.id));
  return forzada ? forzada[1] : normalizeCategory(p.category ?? "");
}

export function normalizeCategory(raw: string): NormalizedCategory {
  const lower = (raw ?? "").trim().toLowerCase();
  if (lower === "verde") return "Verde";
  if (lower === "maduro") return "Maduro";
  // "menu", "menú", "menu semana"… → sección Menú de la Semana (sep 2026).
  // La fila `menu-semana` vive en el Sheet y Amos la reescribe cada lunes
  // (descripción, precio y col G de alérgenos) — sin deploys.
  if (lower.startsWith("menu") || lower.startsWith("menú")) return "Menu";
  // "pesca", "pesca del día", "pescado"… → sección Pesca del Día (sep 2026)
  if (lower.startsWith("pesca")) return "Pesca";
  // "acompañante(s)" → sección Acompañantes (24-11-2026, Amos): Ración de
  // Patacón y Maduro con Macambo. "postre" también cae aquí (ya no hay Postres).
  if (lower.startsWith("acompa") || lower.startsWith("postre")) return "Acompanantes";
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
  // Pedido de Amos (31-08): siguen agotados hasta la semana que viene.
  // Vuelven solos el martes 02-09 a las 00:00.
  { id: "patacón-con-rabo-de-toto", hasta: "2026-09-01" },
  // Pedido de Amos (02-10): sold out hasta el martes; vuelve solo el miércoles 07.
  { id: "ceviche-jipijapa", hasta: "2026-10-06" },
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

// ─── Sin stock para una FECHA DE ENTREGA concreta ──────────────────────────
// A diferencia de AGOTADOS_TEMPORALES (global, bloquea el plato para TODOS los
// días hasta una fecha), esto bloquea un plato SOLO cuando la reserva es para
// esa fecha concreta; el resto de días sigue disponible. Para "no nos queda
// bolón para el miércoles, pero sí el resto de días".
// Clave = fecha de entrega (YYYY-MM-DD) · valor = ids sin stock ese día.
// Platos que llevan bolón: los dos bolones, Ahora Comen Todos (mini bolones) y
// el Pack Bolón + Patacón. Si falta stock de bolón, se bloquean todos juntos.
const PLATOS_CON_BOLON = [
  "bolon-mixto",
  "bolon-mixto-con-maduro",
  "Ahora -comen",
  "pack-bolon-patacon",
  "pack-bolon-macambo",
];
export const AGOTADO_POR_FECHA: Record<string, string[]> = {
  // Black Friday: esos días los Dos Tigrillos van con el pack al −30 %.
  "2026-11-27": ["pack-dos-tigrillos"],
  "2026-11-29": ["pack-dos-tigrillos"],
  // Sin bolón (Amos): bloqueado el miércoles 21 y el jueves 22. Vuelve el viernes.
  "2026-10-21": PLATOS_CON_BOLON,
  "2026-10-22": PLATOS_CON_BOLON,
};

/** ¿Este producto está sin stock para esa fecha de entrega concreta? */
export function agotadoParaFecha(id: string, fecha: string): boolean {
  if (fueraDeEntrega(id, fecha)) return true;
  const lista = AGOTADO_POR_FECHA[fecha];
  return !!lista && lista.some((x) => mismoId(x, id));
}

/** Producto con días de entrega propios (`entrega`) y fecha fuera de ellos. */
function fueraDeEntrega(id: string, fecha: string): boolean {
  const p = productoEstatico(id);
  if (!p?.entrega || !fecha) return false;
  return !p.entrega.fechas.includes(fecha.slice(0, 10));
}

/** Aviso para el cliente si el producto no se entrega ese día por su `entrega`. */
export function avisoEntrega(id: string, fecha: string): string | null {
  const p = productoEstatico(id);
  if (!p?.entrega || !fueraDeEntrega(id, fecha)) return null;
  return `${p.name.replace(/^Pack · /, "")} es solo para entregas ${p.entrega.texto}. Quítalo o cambia el día de entrega.`;
}

function productoEstatico(id: string): Product | undefined {
  return [...PRODUCTS, ...PACKS, ...EXTRA_SALSAS, ...EXTRA_BEBIDAS, ...EXTRA_PLATOS].find((p) =>
    mismoId(p.id, id)
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
// Platos RETIRADOS de la carta: no se muestran en ningún sitio (ni como
// agotados), aunque sigan en la hoja Products. Para recuperar uno, quitarlo de
// aquí y ponerlo available=TRUE en la hoja.
export const PLATOS_RETIRADOS: string[] = [
  "caldo-bolas-de-verde", // retirado 12-11-2026 (decisión Amos)
];
export function estaRetirado(id: string): boolean {
  return PLATOS_RETIRADOS.some((r) => mismoId(r, id));
}

// Platos que NO salen en la carta mientras no tengan foto (ni en
// PRODUCT_IMAGES ni imageUrl en el Sheet). En cuanto se le pone foto,
// aparece solo; no hay que tocar nada más.
export const OCULTOS_HASTA_FOTO: string[] = [
  "ahora-comen-todos-rabo", // 24-11-2026 (Amos): fuera hasta tener foto
];
function pendienteDeFoto(p: Product): boolean {
  return OCULTOS_HASTA_FOTO.some((id) => mismoId(id, p.id)) && !imageForProduct(p);
}

export function withExtraProducts(products: Product[]): Product[] {
  return withExtraPlatos(withExtraBebidas(products))
    .filter((p) => !estaRetirado(p.id))
    .filter((p) => !pendienteDeFoto(p))
    .map((p) => (estaAgotadoTemporal(p.id) ? { ...p, available: false } : p));
}

export function getPacks(): Product[] {
  return PACKS.filter((p) => p.available && enVentana(p)).map(conPromo);
}

// ─── Novedades del escaparate ──────────────────────────────────────────────
// El bloque de arriba de la home tiene una zona de "Novedades" (platos sueltos)
// y otra de packs. Estos son los platos que se empujan arriba, EN ESTE ORDEN.
// Para cambiar las novedades, tocar esta lista; vaciarla oculta la zona entera.
// 24-11-2026 (Amos): se quita la zona de Novedades. Los platos siguen en su
// sección de la carta. Antes: ahora-comen-todos-rabo, empanada-de-queso,
// la-chocletiza, ceviche-jipijapa.
export const DESTACADOS_IDS: string[] = [
  "maduro-con-macambo", // 24-11-2026 (Amos): novedad
];

// Platos que en la CARTA se resaltan con el dorado del menú (borde + brillo)
// para llamar la atención. Añadir/quitar ids aquí.
// 24-11-2026 (Amos): sin brillo dorado, ya no son novedades.
export const PLATOS_DORADOS: string[] = [];
export function esPlatoDorado(id: string): boolean {
  return PLATOS_DORADOS.some((d) => mismoId(d, id));
}

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
  const prod = [
    ...PRODUCTS,
    ...PACKS,
    ...EXTRA_SALSAS,
    ...EXTRA_BEBIDAS,
    ...EXTRA_PLATOS,
  ].find((p) => p.id === id);
  return prod ? conPromo(prod) : undefined;
}

export function getAvailableProducts(): Product[] {
  return PRODUCTS.filter((p) => p.available);
}
