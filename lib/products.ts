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
    name: "Tigrillo XL Mixto",
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
      "2× Tigrillo XL Mixto. Hecho en demiglass de carne, chicharrón, mix de quesos y sal prieta.",
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
};

export function imageForProduct(p: { id: string; image?: string }): string | undefined {
  return p.image || PRODUCT_IMAGES[p.id];
}

export function getPacks(): Product[] {
  return PACKS.filter((p) => p.available);
}

export function getProductById(id: string): Product | undefined {
  return [...PRODUCTS, ...PACKS].find((p) => p.id === id);
}

export function getAvailableProducts(): Product[] {
  return PRODUCTS.filter((p) => p.available);
}
