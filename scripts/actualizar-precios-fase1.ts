// Sube los precios de la carta en el Sheet `Products` según la Fase 1B del
// handoff de THE JUNGLE (ago-2026). SOLO toca los precios (columnas D y E):
// nunca ids ni nombres (el terminal casa por id/nombre y renombrar rompe el
// histórico y las recetas).
//
// ⚠️ El Sheet es PRODUCCIÓN EN VIVO: la web lee los precios de ahí en caliente.
// Ejecutar el --aplicar el MISMO día que se despliega el código (packs, salsas
// y ceviche viven en código y solo cambian con el deploy).
//
// Uso (desde la raíz del repo):
//   npx tsx scripts/actualizar-precios-fase1.ts            ← dry-run: compara y enseña qué haría
//   npx tsx scripts/actualizar-precios-fase1.ts --aplicar  ← escribe los precios nuevos
//
// Seguridad: cada fila solo se toca si su precio actual coincide con el precio
// "Hoy" esperado del handoff. Si no coincide (alguien lo cambió a mano), se
// avisa y NO se toca esa fila.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { google } from "googleapis";

// ─── Credenciales ───────────────────────────────────────────────────────────
// Este repo es PÚBLICO: aquí no va ningún ID ni clave. Orden de resolución:
// variables de entorno (si están) → ficheros locales en ~/.config/verde/
// (service-account.json = clave JSON de `verde-reservas@verde-madrid`;
// spreadsheet-id = el mismo SHEETS_ID que usa el terminal de Verde-Org).
const CONFIG_DIR = path.join(os.homedir(), ".config/verde");
const KEY_PATH = path.join(CONFIG_DIR, "service-account.json");
const SPREADSHEET_ID = (
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
  fs.readFileSync(path.join(CONFIG_DIR, "spreadsheet-id"), "utf8")
).trim();

function getCredentials(): { email: string; key: string } {
  const envEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const envKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (envEmail && envKey) {
    return { email: envEmail, key: envKey.replace(/\\n/g, "\n") };
  }
  const sa = JSON.parse(fs.readFileSync(KEY_PATH, "utf8"));
  return { email: sa.client_email, key: sa.private_key };
}

// ─── Fase 1B: precio esperado hoy → precio nuevo, por productId del Sheet ───
// Los que no aparezcan en el Sheet viven en código (lib/products.ts) y se
// despliegan con el deploy — el script solo informa de dónde vive cada uno.
const CAMBIOS: Record<string, { hoy: number; nuevo: number }> = {
  "bolon-mixto": { hoy: 10, nuevo: 11 },
  "bolon-mixto-con-maduro": { hoy: 10, nuevo: 11 },
  "tigrillo-mixto": { hoy: 15, nuevo: 16 },
  // corviche-de-pescado NO sube: excepción decidida por Amos (31-08), se queda en 15 €.
  "patacón-con-rabo-de-toto": { hoy: 10, nuevo: 11 },
  "canoa-de-maduro": { hoy: 12, nuevo: 13 },
  "ceviche-jipijapa": { hoy: 18, nuevo: 19 },
  "Ahora -comen": { hoy: 20, nuevo: 22 },
  "tigrillo-media-racion": { hoy: 9, nuevo: 9.5 },
  "salsa-aji-extra": { hoy: 1.5, nuevo: 2 },
  "salsa-verde-extra": { hoy: 1.5, nuevo: 2 },
  "salsa-mani-secreta": { hoy: 1.5, nuevo: 2 },
  "pack-dos-tigrillos": { hoy: 27, nuevo: 29 },
  "pack-bolon-patacon": { hoy: 14, nuevo: 15 },
  "pack-grupo": { hoy: 24, nuevo: 26 },
};

// Mismo parser de precios que lib/google-sheets.ts ("8", "8,00", "8 €"…)
function parsePrice(value: string | undefined): number {
  if (!value) return 0;
  const n = parseFloat(value.trim().replace(/[€$£ \s]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

// Los precios se escriben con coma decimal (formato del Sheet) salvo enteros.
function fmtPrecio(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
}

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  const creds = getCredentials();
  const auth = new google.auth.JWT({
    email: creds.email,
    key: creds.key,
    scopes: [
      aplicar
        ? "https://www.googleapis.com/auth/spreadsheets"
        : "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Products!A2:F",
  });
  const rows = (res.data.values ?? []) as string[][];

  const updates: { range: string; values: string[][] }[] = [];
  const vistos = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const [id, name, , rawFinal, rawDeposit] = rows[i];
    const cambio = id ? CAMBIOS[id.trim()] : undefined;
    if (!cambio) continue;
    vistos.add(id.trim());

    const fila = i + 2;
    const final = parsePrice(rawFinal);
    const deposit = parsePrice(rawDeposit);

    if (final !== cambio.hoy) {
      console.log(
        `⚠️  fila ${fila} "${name}" (${id}): precio actual ${final} ≠ esperado ${cambio.hoy} — NO SE TOCA (revisar a mano)`
      );
      continue;
    }

    // depositAmount: si va igual que finalPrice (modelo de pago completo) se
    // sube a la par; si va vacío se deja vacío (la web ya cae a finalPrice).
    const nuevoDeposit =
      rawDeposit && deposit === final ? fmtPrecio(cambio.nuevo) : rawDeposit ?? "";

    console.log(
      `${aplicar ? "✍️ " : "· "} fila ${fila} "${name}" (${id}): ${fmtPrecio(cambio.hoy)} → ${fmtPrecio(cambio.nuevo)} €` +
        (rawDeposit && deposit === final ? " (final + deposit)" : " (solo final)")
    );
    updates.push({
      range: `Products!D${fila}:E${fila}`,
      values: [[fmtPrecio(cambio.nuevo), nuevoDeposit]],
    });
  }

  const enCodigo = Object.keys(CAMBIOS).filter((id) => !vistos.has(id));
  if (enCodigo.length) {
    console.log(
      `\nℹ️  No están en el Sheet (viven en lib/products.ts y cambian con el deploy):\n   ${enCodigo.join(", ")}`
    );
  }

  if (!updates.length) {
    console.log("\nNada que escribir.");
    return;
  }

  if (!aplicar) {
    console.log(
      `\nDRY-RUN: ${updates.length} fila(s) se actualizarían. Ejecuta con --aplicar para escribir.`
    );
    return;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: "USER_ENTERED", data: updates },
  });
  console.log(`\n✅ ${updates.length} fila(s) actualizadas en el Sheet.`);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
