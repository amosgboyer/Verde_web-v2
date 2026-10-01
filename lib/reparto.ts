import { google } from "googleapis";
import { z } from "zod";
import { IDIOMAS, ITEMS } from "./reparto-opciones";

export { IDIOMAS, ITEMS };

/**
 * Inscripciones para el reparto solidario de los lunes.
 *
 * Todo vive en el mismo Google Sheet que el resto de la web:
 *  - Pestaña "Reparto": una fila por persona (se crea sola la primera vez).
 *  - Pestaña "Settings": claves opcionales reparto_fecha, reparto_hora,
 *    reparto_lugar y reparto_abierto (TRUE/FALSE) para cambiar los datos del
 *    día sin tocar código.
 *
 * Archivo independiente a propósito: no modifica lib/google-sheets.ts.
 */

const TAB = "Reparto";
const HEADER = [
  "Alta",
  "Nombre",
  "Teléfono",
  "Trae",
  "Además",
  "Idiomas",
  "Mostrar nombre",
  "Actualizado",
];

export const repartoSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(80),
  telefono: z
    .string()
    .trim()
    .max(30)
    .refine((v) => (v.match(/\d/g) ?? []).length >= 9, "El teléfono necesita al menos 9 cifras."),
  trae: z.array(z.enum(ITEMS)).min(1, "Elige al menos una opción.").max(ITEMS.length),
  otro: z.string().trim().max(200).optional().default(""),
  idiomas: z.array(z.enum(IDIOMAS)).max(IDIOMAS.length).optional().default([]),
  publico: z.boolean().default(true),
  acepta: z.literal(true, {
    errorMap: () => ({ message: "Marca la casilla de datos para apuntarte." }),
  }),
  // Campo trampa para bots: un humano nunca lo ve ni lo rellena.
  web: z.string().max(0).optional().default(""),
});

export type RepartoInput = z.infer<typeof repartoSchema>;

export interface RepartoEvento {
  fecha: string;
  hora: string;
  lugar: string;
  abierto: boolean;
}

export interface RepartoPublico {
  nombre: string; // nombre de pila o "Alguien"
  trae: string[];
  otro: string;
}

// ─── Google Sheets ───────────────────────────────────────────────────────────

function sheetsClient() {
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!key) throw new Error("Falta GOOGLE_SHEETS_PRIVATE_KEY");
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function spreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("Falta GOOGLE_SHEETS_SPREADSHEET_ID");
  return id;
}

/** Crea la pestaña "Reparto" con su cabecera si todavía no existe. */
async function ensureTab(): Promise<void> {
  const sheets = sheetsClient();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId(),
    fields: "sheets.properties.title",
  });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === TAB);
  if (exists) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${TAB}!A1:H1`,
    valueInputOption: "RAW",
    requestBody: { values: [HEADER] },
  });
}

async function readRows(): Promise<string[][]> {
  const sheets = sheetsClient();
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId(),
      range: `${TAB}!A2:H`,
    });
    return (res.data.values ?? []) as string[][];
  } catch (e: unknown) {
    // La pestaña aún no existe: no hay nadie apuntado.
    if (String((e as Error)?.message ?? "").includes("Unable to parse range")) return [];
    throw e;
  }
}

const digits = (s: string) => (s.match(/\d/g) ?? []).join("").slice(-9);
const firstName = (s: string) => (s.trim().split(/\s+/)[0] ?? "").slice(0, 24);
const splitList = (s: string | undefined) =>
  (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);

/**
 * Guarda la inscripción. Si ese teléfono ya estaba apuntado, actualiza su
 * fila en vez de duplicarla (así la gente puede corregir lo que trae).
 */
export async function saveReparto(input: RepartoInput): Promise<{ updated: boolean }> {
  await ensureTab();
  const sheets = sheetsClient();
  const now = new Date().toISOString();
  const rows = await readRows();
  const idx = rows.findIndex((r) => digits(r[2] ?? "") === digits(input.telefono));

  // Prefijo ' para que Sheets no convierta el teléfono en número ni lea fórmulas.
  const safe = (s: string) => (/^[=+\-@]/.test(s) ? `'${s}` : s);
  const row = [
    idx >= 0 ? rows[idx][0] ?? now : now,
    safe(input.nombre),
    `'${input.telefono}`,
    input.trae.join(", "),
    safe(input.otro ?? ""),
    (input.idiomas ?? []).join(", "),
    input.publico ? "SÍ" : "NO",
    now,
  ];

  if (idx >= 0) {
    const sheetRow = idx + 2; // A2 = índice 0
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId(),
      range: `${TAB}!A${sheetRow}:H${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
    return { updated: true };
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${TAB}!A:H`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
  return { updated: false };
}

/** Lo que se puede enseñar en público: nunca teléfonos ni apellidos. */
export async function getRepartoPublico(): Promise<RepartoPublico[]> {
  const rows = await readRows();
  return rows
    .filter((r) => (r[1] ?? "").trim() || (r[2] ?? "").trim())
    .map((r) => ({
      nombre: (r[6] ?? "").toUpperCase().startsWith("S")
        ? firstName((r[1] ?? "").replace(/^'/, "")) || "Alguien"
        : "Alguien",
      trae: splitList(r[3]),
      otro: (r[4] ?? "").replace(/^'/, "").slice(0, 200),
    }));
}

/** Datos del día desde la pestaña Settings, con valores por defecto. */
export async function getRepartoEvento(): Promise<RepartoEvento> {
  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: "Settings!A2:B",
  });
  const map: Record<string, string> = {};
  for (const r of (res.data.values ?? []) as string[][]) {
    const k = (r[0] ?? "").trim();
    if (k) map[k] = (r[1] ?? "").trim();
  }
  return {
    fecha: map["reparto_fecha"] || "Lunes 5 de octubre",
    hora: map["reparto_hora"] || "",
    lugar: map["reparto_lugar"] || "",
    abierto: (map["reparto_abierto"] ?? "TRUE").toUpperCase() !== "FALSE",
  };
}
