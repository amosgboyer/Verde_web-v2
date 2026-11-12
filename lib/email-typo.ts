// Detecta errores típicos al escribir el dominio del email ("gmail.con",
// "ocloud.com", "hotmal.com"…) y propone la corrección. Solo sugiere: el
// cliente decide con un toque. Nov-2026: dos confirmaciones rebotaron por
// "@gmail.con" y "@ocloud.com".

const DOMINIOS = [
  "gmail.com", "hotmail.com", "hotmail.es", "outlook.com", "outlook.es",
  "icloud.com", "yahoo.com", "yahoo.es", "live.com", "msn.com", "me.com",
  "protonmail.com", "proton.me", "telefonica.net",
];

// Dominios reales que se parecen a los de arriba: nunca sugerir cambiarlos.
const VALIDOS_PARECIDOS = new Set([
  "gmx.com", "gmx.es", "gmx.net", "mail.com", "email.com", "aol.com", "ymail.com",
  "ya.com", "terra.es", "live.es", "msn.es", "mac.com", "googlemail.com", "outlook.fr",
  "hotmail.fr", "hotmail.it", "hotmail.co.uk", "yahoo.fr", "yahoo.co.uk", "icloud.es",
]);

const TLDS_RAROS: Record<string, string> = {
  con: "com", cmo: "com", ocm: "com", vom: "com", xom: "com", cim: "com",
  comm: "com", co: "com", cm: "com", om: "com", "com.": "com", ed: "es", rs: "es",
};

function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return d[a.length][b.length];
}

/** Devuelve el email corregido si parece un error de escritura; si no, null. */
export function sugerirEmail(email: string): string | null {
  const limpio = email.trim().toLowerCase();
  const at = limpio.lastIndexOf("@");
  if (at < 1 || at === limpio.length - 1) return null;
  const usuario = limpio.slice(0, at);
  const dominio = limpio.slice(at + 1);
  if (DOMINIOS.includes(dominio) || VALIDOS_PARECIDOS.has(dominio)) return null;

  // 1) Dominio conocido con terminación mal escrita: gmail.con → gmail.com
  const punto = dominio.lastIndexOf(".");
  if (punto > 0) {
    const base = dominio.slice(0, punto);
    const tld = dominio.slice(punto + 1);
    const tldBueno = TLDS_RAROS[tld];
    if (tldBueno && DOMINIOS.includes(`${base}.${tldBueno}`)) return `${usuario}@${base}.${tldBueno}`;
  }

  // 2) Dominio parecido a uno conocido: ocloud.com → icloud.com
  let mejor: string | null = null;
  let mejorD = Infinity;
  for (const d of DOMINIOS) {
    const dist = distancia(dominio, d);
    if (dist < mejorD) { mejorD = dist; mejor = d; }
  }
  if (mejor && mejorD > 0 && mejorD <= 2) return `${usuario}@${mejor}`;
  return null;
}
