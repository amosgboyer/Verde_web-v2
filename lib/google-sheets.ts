import { google } from "googleapis";

function getPrivateKey(): string {
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!key) throw new Error("Falta GOOGLE_SHEETS_PRIVATE_KEY");
  return key.replace(/\\n/g, "\n");
}

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: getPrivateKey(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) throw new Error("Falta GOOGLE_SHEETS_SPREADSHEET_ID");
  return id;
}

// "9:00" → "09:00", "9:5" → "09:05"
function normalizeTime(t: string): string {
  if (!t) return "";
  const [rawH = "0", rawM = "00"] = t.trim().split(":");
  return `${rawH.padStart(2, "0")}:${rawM.padStart(2, "0")}`;
}

// Trims and keeps only YYYY-MM-DD
function normalizeDate(d: string): string {
  if (!d) return "";
  return d.trim().slice(0, 10);
}

async function getSheetValues(range: string): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range,
  });
  return (res.data.values ?? []) as string[][];
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface ProductRow {
  productId: string;
  name: string;
  description: string;
  finalPrice: number;
  depositAmount: number;
  available: boolean;
  allergens: string[];
  imageUrl: string;
  category: string;
}

// Handles "8", "8.00", "8,00", "€8", "8 €", "€8,00", "8.00€", etc.
function parsePrice(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value
    .trim()
    .replace(/[€$£ \s]/g, "")  // strip currency symbols and spaces
    .replace(",", ".");               // normalize European decimal separator
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export async function getProductsRows(): Promise<ProductRow[]> {
  const rows = await getSheetValues("Products!A2:I");
  return rows
    .filter((r) => r.length >= 6)
    .map((r) => {
      const finalPrice = parsePrice(r[3]);
      // If depositAmount is empty/zero, fall back to finalPrice (full payment model)
      const depositAmount = parsePrice(r[4]) || finalPrice;
      const available = (r[5] ?? "").toUpperCase() === "TRUE";
      if (available && (finalPrice === 0 || depositAmount === 0)) {
        console.warn(
          `[products] Price is zero for available product "${r[1]}" (id: ${r[0]}). ` +
          `raw finalPrice="${r[3]}", raw depositAmount="${r[4]}"`
        );
      }
      return {
        productId: r[0] ?? "",
        name: r[1] ?? "",
        description: r[2] ?? "",
        finalPrice,
        depositAmount,
        available,
        allergens: r[6] ? r[6].split(",").map((a) => a.trim()).filter(Boolean) : [],
        imageUrl: r[7] ?? "",
        category: r[8] ?? "",
      };
    })
    .filter((p) => p.available);
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface Settings {
  reservationStartTime: string;
  reservationEndTime: string;
  slotIntervalMinutes: number;
  minLeadDays: number;
  currency: string;
  reservationsOpen: boolean;
  // Promotion fields
  promoEnabled: boolean;
  promoName: string;
  promoType: string;
  promoValue: number;
  promoStartDate: string;
  promoEndDate: string;
}

export async function getSettings(): Promise<Settings> {
  const rows = await getSheetValues("Settings!A2:C");
  const map: Record<string, string> = {};
  for (const row of rows) {
    const keyRaw = row[0] ?? "";
    const keyTrimmed = keyRaw.trim();
    if (!keyTrimmed) continue;
    if (keyTrimmed in map) {
      console.warn(`[settings] Duplicate setting key detected: "${keyTrimmed}"`);
    }
    map[keyTrimmed] = (row[1] ?? "").trim();
  }
  return {
    // La hoja Settings usa las claves `startTime` / `endTime`.
    // Se mantienen los nombres antiguos como respaldo por compatibilidad.
    reservationStartTime:
      map["startTime"] ?? map["reservationStartTime"] ?? "10:00",
    reservationEndTime:
      map["endTime"] ?? map["reservationEndTime"] ?? "19:00",
    slotIntervalMinutes: parseInt(map["slotIntervalMinutes"] ?? "60", 10) || 60,
    minLeadDays: parseInt(map["minLeadDays"] ?? "1", 10) || 1,
    currency: map["currency"] ?? "eur",
    reservationsOpen: (map["reservationsOpen"] ?? "TRUE").trim().toUpperCase() === "TRUE",
    promoEnabled: (map["promoEnabled"] ?? "FALSE").trim().toUpperCase() === "TRUE",
    promoName: map["promoName"] ?? "",
    promoType: map["promoType"] ?? "percentage",
    promoValue: parseFloat(map["promoValue"] ?? "0") || 0,
    promoStartDate: map["promoStartDate"] ?? "",
    promoEndDate: map["promoEndDate"] ?? "",
  };
}

// Returns raw rows from the Settings sheet for diagnostic purposes.
export async function getSettingsRawRows(): Promise<
  { keyRaw: string; keyTrimmed: string; valueRaw: string; valueTrimmed: string }[]
> {
  const rows = await getSheetValues("Settings!A2:C");
  return rows.map((row) => ({
    keyRaw: row[0] ?? "",
    keyTrimmed: (row[0] ?? "").trim(),
    valueRaw: row[1] ?? "",
    valueTrimmed: (row[1] ?? "").trim(),
  }));
}

// ─── Availability ─────────────────────────────────────────────────────────────

export interface AvailabilityRow {
  date: string;
  isOpen: boolean;
  maxOrdersPerSlot: number;
  manuallySoldOut: boolean;
  note: string;
}

export async function getAvailabilityRows(): Promise<AvailabilityRow[]> {
  const rows = await getSheetValues("Availability!A2:E");
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      date: r[0],
      isOpen: (r[1] ?? "").toUpperCase() === "TRUE",
      maxOrdersPerSlot: parseInt(r[2] ?? "0", 10) || 0,
      manuallySoldOut: (r[3] ?? "").toUpperCase() === "TRUE",
      note: r[4] ?? "",
    }));
}

// ─── SlotOverrides ────────────────────────────────────────────────────────────

export interface SlotOverrideRow {
  date: string;
  time: string;
  status: "sold_out" | "available";
  maxOrdersOverride: number | null;
  note: string;
}

export async function getSlotOverridesRows(): Promise<SlotOverrideRow[]> {
  const rows = await getSheetValues("SlotOverrides!A2:E");
  return rows
    .filter((r) => r[0] && r[1])
    .map((r) => ({
      date: r[0],
      time: r[1],
      status: (r[2] ?? "available") as "sold_out" | "available",
      maxOrdersOverride: r[3] ? parseInt(r[3], 10) : null,
      note: r[4] ?? "",
    }));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface OrderSheetRow {
  createdAt: string;
  status: string;
  stripeSessionId: string;
  customerName: string;
  email: string;
  phone: string;
  productId: string;
  productName: string;
  quantity: number;
  reservationDate: string;
  reservationTime: string;
  finalPrice: number;
  depositPaid: number;
  pendingAmount: number;
  notes: string;
}

export async function getOrdersRows(): Promise<OrderSheetRow[]> {
  const rows = await getSheetValues("Orders!A2:O");
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      createdAt: r[0] ?? "",
      status: r[1] ?? "",
      stripeSessionId: r[2] ?? "",
      customerName: r[3] ?? "",
      email: r[4] ?? "",
      phone: r[5] ?? "",
      productId: r[6] ?? "",
      productName: r[7] ?? "",
      quantity: parseInt(r[8] ?? "0", 10) || 0,
      reservationDate: normalizeDate(r[9] ?? ""),
      reservationTime: normalizeTime(r[10] ?? ""),
      finalPrice: parseFloat(r[11] ?? "0") || 0,
      depositPaid: parseFloat(r[12] ?? "0") || 0,
      pendingAmount: parseFloat(r[13] ?? "0") || 0,
      notes: r[14] ?? "",
    }));
}

export async function findOrderByStripeSessionId(
  sessionId: string
): Promise<OrderSheetRow | null> {
  const orders = await getOrdersRows();
  return orders.find((o) => o.stripeSessionId === sessionId) ?? null;
}

// ─── Append Order ─────────────────────────────────────────────────────────────

export interface OrderRow {
  createdAt: string;
  status: string;
  stripeSessionId: string;
  customerName: string;
  email: string;
  phone: string;
  productId: string;
  productName: string;
  quantity: number;
  reservationDate: string;
  reservationTime: string;
  finalPrice: number;
  depositPaid: number;
  pendingAmount: number;
  notes: string;
  // Delivery fields (columns P–T)
  deliveryAddress: string;
  deliveryDetails: string;
  postalCode: string;
  deliveryZone: string;
  deliveryMethod: string;
  // Legal acceptance (columns U–W)
  privacyAccepted: boolean;
  termsAccepted: boolean;
  acceptedAt: string;
  // Discount (columns X–AC)
  discountName: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  subtotalBeforeDiscount: number;
  totalAfterDiscount: number;
}

export async function appendOrderToSheet(order: OrderRow): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const row = [
    order.createdAt,
    order.status,
    order.stripeSessionId,
    order.customerName,
    order.email,
    order.phone,
    order.productId,
    order.productName,
    order.quantity,
    order.reservationDate,
    order.reservationTime,
    order.finalPrice,
    order.depositPaid,
    order.pendingAmount,
    order.notes,
    order.deliveryAddress,
    order.deliveryDetails,
    order.postalCode,
    order.deliveryZone,
    order.deliveryMethod,
    // Legal acceptance — columns U, V, W
    order.privacyAccepted ? "TRUE" : "FALSE",
    order.termsAccepted ? "TRUE" : "FALSE",
    order.acceptedAt,
    // Discount — columns X, Y, Z, AA, AB, AC
    order.discountName,
    order.discountType,
    order.discountValue,
    order.discountAmount,
    order.subtotalBeforeDiscount,
    order.totalAfterDiscount,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: "Orders!A:AC",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

// ─── Append Waitlist ──────────────────────────────────────────────────────────

export interface WaitlistRow {
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}

export async function appendWaitlistToSheet(entry: WaitlistRow): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const row = [
    entry.createdAt,
    entry.name,
    entry.email,
    entry.phone,
    entry.message,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: "Waitlist!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

// ─── Setup admin: abrir días + actualizar horario ──────────────────────────────

// Añade días a la pestaña Availability (isOpen=TRUE, capacidad, no sold out).
export async function appendAvailabilityDays(
  days: { date: string; capacity: number }[]
): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const rows = days.map((d) => [
    d.date,
    "TRUE",
    String(d.capacity),
    "FALSE",
    "Disponible",
  ]);
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: "Availability!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}

// Actualiza (o crea) una clave de la pestaña Settings (columna B = valor).
export async function updateSetting(key: string, value: string): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: "Settings!A:A",
  });
  const keys = res.data.values ?? [];
  const idx = keys.findIndex((r) => (r[0] ?? "").trim() === key);
  if (idx === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: getSpreadsheetId(),
      range: "Settings!A:B",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[key, value]] },
    });
    return;
  }
  const sheetRow = idx + 1; // values.get A:A → índice 0 = fila 1
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `Settings!B${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });
}
