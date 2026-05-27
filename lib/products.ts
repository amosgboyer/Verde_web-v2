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
      "Hecho en caldo madre, chicharrón, rabo desmenuzado, mix de quesos, salsa de maní de la casa y sal prieta.",
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

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getAvailableProducts(): Product[] {
  return PRODUCTS.filter((p) => p.available);
}
