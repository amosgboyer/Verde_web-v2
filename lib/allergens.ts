// ─── Alérgenos: dos vocabularios que no se hablaban ─────────────────────────
//
// El cliente marca de la lista oficial de 14 (Reglamento UE 1169/2011), donde
// el cacahuete se llama "Cacahuetes". La hoja usa ese mismo vocabulario en casi
// toda la carta —así que la comparación en crudo funcionaba— pero NO siempre:
// el Ceviche Jipijapa está etiquetado "Maní", la palabra de cocina, y ahí un
// alérgico al cacahuete que marcaba su casilla no recibía ningún aviso. El
// catálogo de respaldo del código usa "Maní" en todos los platos, así que si la
// hoja falla el problema se extiende a la carta entera.
//
// Basta con que alguien escriba "maní", "queso" o "frutos secos" en una celda
// para reabrirlo. Por eso la comparación deja de ser literal.
//
// Esta tabla solo puede AÑADIR avisos, nunca quitarlos: en el peor caso avisa
// de más, que en alergias es el lado correcto del error.

const GRUPOS: Record<string, string[]> = {
  gluten: ["gluten", "trigo", "harina", "pan", "cebada", "centeno", "avena", "espelta"],
  crustaceos: ["crustaceo", "crustaceos", "gamba", "gambas", "camaron", "camarones", "langostino", "langostinos", "cangrejo"],
  huevos: ["huevo", "huevos", "mayonesa"],
  pescado: ["pescado", "pescados", "pesca", "corvina", "atun", "anchoa", "anchoas"],
  // El cacahuete es legumbre: NO es "frutos de cáscara". Van separados a propósito.
  cacahuetes: ["cacahuete", "cacahuetes", "mani", "manies", "salsa de mani", "sal prieta"],
  soja: ["soja", "soya", "tofu", "salsa de soja"],
  lacteos: ["lacteo", "lacteos", "leche", "lactosa", "queso", "quesos", "mantequilla", "nata", "yogur"],
  "frutos de cascara": ["frutos de cascara", "frutos secos", "nuez", "nueces", "almendra", "almendras", "avellana", "avellanas", "anacardo", "anacardos", "pistacho", "pistachos"],
  apio: ["apio"],
  mostaza: ["mostaza"],
  sesamo: ["sesamo", "ajonjoli"],
  sulfitos: ["sulfito", "sulfitos", "dioxido de azufre"],
  altramuces: ["altramuz", "altramuces", "lupino"],
  moluscos: ["molusco", "moluscos", "calamar", "pulpo", "mejillon", "mejillones", "almeja", "almejas"],
};

// Etiqueta que usa la cocina cuando NO ha detallado los alérgenos de un plato.
const SIN_DETALLAR = ["consultar", "consultanos", "preguntar"];

function normaliza(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // fuera tildes
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const CANON = new Map<string, string>();
for (const [canon, variantes] of Object.entries(GRUPOS)) {
  CANON.set(normaliza(canon), canon);
  for (const v of variantes) CANON.set(normaliza(v), canon);
}

/** Reduce cualquier forma de escribir un alérgeno a una clave común. */
export function canonAlergeno(termino: string): string {
  const n = normaliza(termino);
  return CANON.get(n) ?? n;
}

/** ¿El plato declara el alérgeno que ha marcado el cliente? */
export function platoDeclaraAlergeno(
  alergenosPlato: string[] | undefined,
  alergenoCliente: string
): boolean {
  const buscado = canonAlergeno(alergenoCliente);
  return (alergenosPlato ?? []).some((a) => canonAlergeno(a) === buscado);
}

/**
 * El plato no tiene los alérgenos detallados (viene marcado "Consultar"). No es
 * un aviso de conflicto, pero tampoco se puede decir que sea seguro: si el
 * cliente ha marcado alguna alergia, hay que decírselo.
 */
export function platoSinDetallar(alergenosPlato: string[] | undefined): boolean {
  return (alergenosPlato ?? []).some((a) => SIN_DETALLAR.includes(normaliza(a)));
}
