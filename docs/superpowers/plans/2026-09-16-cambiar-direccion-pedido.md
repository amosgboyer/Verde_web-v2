# Cambiar dirección de pedido — Plan de implementación

> **Para quien ejecute:** implementar tarea por tarea. Este proyecto NO tiene
> runner de tests unitarios (package.json sin script `test`), así que la
> "verificación" de cada tarea es: `npm run build` (typecheck incluido) + prueba
> E2E en preview con Playwright + lectura del Sheet con el service account
> (`~/.config/verde/service-account.json`). Commits frecuentes. Nada a
> producción hasta OK de Amos.

**Goal:** Que el cliente cambie la dirección de entrega de un pedido a domicilio ya pagado, cobrando la diferencia si sube de zona.

**Architecture:** Página `/editar` (cliente) → API `change-address` (verifica teléfono, recalcula zona; aplica directo si no sube o crea sesión Stripe por la diferencia si sube) → webhook aplica el cambio en Orders editando las filas del pedido. Reutiliza el patrón de `add-to-order`, `use-places-autocomplete` y `lib/delivery`.

**Tech Stack:** Next.js (App Router), Stripe Checkout + webhook, Google Sheets (service account), Google Places (hook existente).

**Spec:** `docs/superpowers/specs/2026-09-16-cambiar-direccion-pedido-design.md`

---

## Estructura de archivos

- **Modificar** `lib/google-sheets.ts`: ampliar `AddOrderContext` con dirección actual (P–T); añadir `updateOrderAddress(sessionId, campos)` que localiza las filas del pedido (col C = stripeSessionId) y edita P,Q,R,S y la línea de envío.
- **Crear** `lib/order-address.ts`: lógica pura para decidir sin-pago / con-pago / fuera-de-cobertura y calcular la diferencia de envío (usa `lib/delivery`).
- **Crear** `app/api/change-address/route.ts`: endpoint POST.
- **Modificar** `app/api/stripe-webhook/route.ts`: caso `isAddressChange` (con dedup).
- **Crear** `app/editar/page.tsx` + `components/EditAddress.tsx`: UI cliente.
- **Modificar** `emails/CustomerReservationEmail.tsx` y `app/gracias/page.tsx`: enlace a `/editar?codigo=`.
- **Infra:** rama `feature/editar-pedido-direccion` (ya existe) + preview Vercel con env de rama (Stripe test) + alias, igual que el checkout recurrente.

---

## Task 1: Lógica pura de decisión (sin red, fácil de razonar)

**Files:** Create `lib/order-address.ts`

- [ ] **Paso 1: Implementar** `lib/order-address.ts`:

```ts
import { quoteDeliveryByPostalCode, feeForZone, type DeliveryQuote } from "./delivery";

export type AddressChangeOutcome =
  | { kind: "out_of_area" }                              // fuera de cobertura
  | { kind: "no_charge"; zone: number; newFee: number } // misma zona o más barata
  | { kind: "charge"; zone: number; newFee: number; diff: number }; // sube

// oldFee = tarifa de envío que se cobró en el pedido original.
export function evaluateAddressChange(
  newPostalCode: string,
  oldFee: number
): AddressChangeOutcome {
  const q: DeliveryQuote = quoteDeliveryByPostalCode(newPostalCode);
  if (!q.deliverable || q.zone == null) return { kind: "out_of_area" };
  const newFee = q.fee;
  const diff = Math.round((newFee - oldFee) * 100) / 100;
  if (diff > 0) return { kind: "charge", zone: q.zone, newFee, diff };
  return { kind: "no_charge", zone: q.zone, newFee };
}
```

- [ ] **Paso 2: Verificar** `npm run build` (con `STRIPE_SECRET_KEY` de test inyectada) → compila sin errores de tipos.
- [ ] **Paso 3: Commit** `git commit -am "feat(editar): lógica pura de cambio de dirección"`

---

## Task 2: Leer dirección actual + escribir dirección nueva en Orders

**Files:** Modify `lib/google-sheets.ts`

Columnas Orders (0-based): C(2)=stripeSessionId, P(15)=deliveryAddress, Q(16)=deliveryDetails, R(17)=postalCode, S(18)=deliveryZone, T(19)=deliveryMethod, G(6)=productId, L(11)=finalPrice, M(12)=depositPaid.

- [ ] **Paso 1:** Ampliar `AddOrderContext` (y `EMPTY_ADD_CONTEXT`) con:
```ts
  deliveryAddress: string;
  deliveryDetails: string;
  postalCode: string;
  deliveryZone: string;
```
y rellenarlos en `findAddOrderContext` desde la fila encontrada (`match[15]`, `match[16]`, `match[17]`, `match[18]`).

- [ ] **Paso 2:** Añadir función que localiza y edita las filas del pedido. Usa `sheets.spreadsheets.values` con el número de fila real (índice + 2 sobre `Orders!A2:T`):

```ts
export async function updateOrderAddress(
  sessionId: string,
  fields: { deliveryAddress: string; deliveryDetails: string; postalCode: string; deliveryZone: string; newDeliveryFee?: number }
): Promise<{ updatedRows: number }> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: "Orders!A2:T",
  });
  const rows = (res.data.values ?? []) as string[][];
  const data: { range: string; values: string[][] }[] = [];
  const safe = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v);
  rows.forEach((r, i) => {
    if ((r[2] ?? "").trim() !== sessionId.trim()) return;
    const rowNum = i + 2;
    // P,Q,R,S = dirección, detalles, CP, zona
    data.push({ range: `Orders!P${rowNum}:S${rowNum}`, values: [[
      safe(fields.deliveryAddress), safe(fields.deliveryDetails),
      safe(fields.postalCode), safe(fields.deliveryZone),
    ]]});
    // Si hay nueva tarifa y esta fila es la línea de envío, actualizar importes (L,M)
    if (fields.newDeliveryFee != null && (r[6] ?? "") === "envio-delivery") {
      data.push({ range: `Orders!L${rowNum}:M${rowNum}`, values: [[
        String(fields.newDeliveryFee), String(fields.newDeliveryFee),
      ]]});
    }
  });
  if (data.length === 0) return { updatedRows: 0 };
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: { valueInputOption: "RAW", data },
  });
  return { updatedRows: data.length };
}
```
(Nota: si el pedido no tenía línea `envio-delivery` y ahora hay tarifa, se contempla en Task 3 añadiendo la línea; para Fase 1 los pedidos a domicilio siempre traen línea de envío.)

- [ ] **Paso 3: Verificar** `npm run build`.
- [ ] **Paso 4: Verificación funcional aislada** con un script Node de un solo uso (service account) que llame a `updateOrderAddress` sobre un pedido de prueba del Sheet y confirme que P–S cambian. Borrar el script tras usarlo.
- [ ] **Paso 5: Commit** `git commit -am "feat(editar): leer y editar dirección de un pedido en Orders"`

---

## Task 3: API `change-address`

**Files:** Create `app/api/change-address/route.ts` (patrón calcado de `app/api/add-to-order/route.ts`)

- [ ] **Paso 1: Implementar** el endpoint:
  - Zod: `{ code: string; phone: string; deliveryAddress: string; deliveryDetails?: string; postalCode: string; deliveryZone?: string }`.
  - `findAddOrderContext({ code })`; si `!found` → 404 genérico.
  - **Verificar teléfono:** `normalizePhone(phone) === normalizePhone(ctx.phone)`; si no → 403 genérico ("No hemos podido verificar tu pedido").
  - Ventana: si `ctx.reservationDate <= hoy` → 403 (WhatsApp).
  - Método: si `ctx.deliveryMethod !== "delivery"` → 400 ("Este pedido es de recogida").
  - `oldFee` = tarifa actual: `feeForZone(zoneForPostalCode(ctx.postalCode))`.
  - `evaluateAddressChange(postalCode, oldFee)`:
    - `out_of_area` → 403 (recogida/WhatsApp).
    - `no_charge` → `updateOrderAddress(ctx.sessionId, { …, deliveryZone: zoneLabel(zone, deliveryZone) })` y responder `{ ok: true, charged: false }`.
    - `charge` → crear sesión Stripe (mode payment) por `diff`, con metadata `isAddressChange: "true"`, `parentSessionId: ctx.sessionId`, y `newAddress/newDetails/newPostalCode/newZoneLabel/newDeliveryFee`; responder `{ url }`.
  - `success_url`: `${appUrl}/gracias?session_id={CHECKOUT_SESSION_ID}&address=1`; `cancel_url`: `${appUrl}/editar?codigo=${ctx.orderCode}`.
  - Errores: mismo patrón `ErrorCliente` / genérico que `add-to-order`.

- [ ] **Paso 2: Verificar** `npm run build`.
- [ ] **Paso 3: Commit** `git commit -am "feat(editar): API change-address (verifica, aplica o cobra diferencia)"`

---

## Task 4: Webhook — aplicar el cambio tras pago

**Files:** Modify `app/api/stripe-webhook/route.ts`

- [ ] **Paso 1:** En `checkout.session.completed`, ANTES del flujo de pedido normal, detectar `meta.isAddressChange === "true"`:
  - Dedup: si ya se aplicó este `session.id` (marcar con una comprobación propia o reutilizar `findOrderByStripeSessionId` sobre parentSession + nota) → salir 200. (Implementación simple: guardar una fila-registro no; mejor: como el cambio es idempotente por naturaleza —escribe los mismos valores— basta con no duplicar la línea de envío. Aplicar es idempotente.)
  - Llamar `updateOrderAddress(meta.parentSessionId, { deliveryAddress: meta.newAddress, deliveryDetails: meta.newDetails, postalCode: meta.newPostalCode, deliveryZone: meta.newZoneLabel, newDeliveryFee: Number(meta.newDeliveryFee) })`.
  - `return NextResponse.json({ received: true })` (no seguir al flujo de pedido normal).

- [ ] **Paso 2: Verificar** `npm run build`.
- [ ] **Paso 3: Commit** `git commit -am "feat(editar): webhook aplica cambio de dirección tras pago"`

---

## Task 5: UI cliente `/editar`

**Files:** Create `app/editar/page.tsx`, `components/EditAddress.tsx`

- [ ] **Paso 1:** `app/editar/page.tsx` (server) lee `?codigo=` y renderiza `<EditAddress codigo={codigo} />`.
- [ ] **Paso 2:** `components/EditAddress.tsx` (client):
  - Paso A — verificación: input teléfono + botón. Llama a `change-address`? No: primero un estado local; la verificación real la hace el POST. Para UX, un único formulario: teléfono + dirección nueva (Places) + CP (autorelleno) → botón "Guardar cambios".
  - Reutiliza `useAddressAutocomplete` (de `lib/use-places-autocomplete`) y `quoteDeliveryByPostalCode` para mostrar la zona/tarifa nueva y, si sube, avisar "se cobrará X €".
  - Al enviar: POST a `/api/change-address`. Si `{url}` → `window.location = url` (pago). Si `{ok:true}` → pantalla de éxito. Si error → mensaje.
- [ ] **Paso 3: Verificar** `npm run build`.
- [ ] **Paso 4: Commit** `git commit -am "feat(editar): página /editar con verificación + formulario de dirección"`

---

## Task 6: Enlaces de entrada (email + gracias)

**Files:** Modify `emails/CustomerReservationEmail.tsx`, `app/gracias/page.tsx`

- [ ] **Paso 1:** En el email, junto al enlace de "añadir", añadir "¿Cambiar la dirección?" → `https://www.verdemadrid.com/editar?codigo=${orderCode}` (dominio propio, no romper entregabilidad).
- [ ] **Paso 2:** En `/gracias`, añadir botón "Editar mi pedido" → `/editar?codigo=…` (si hay code disponible en esa página).
- [ ] **Paso 3: Verificar** `npm run build`.
- [ ] **Paso 4: Commit** `git commit -am "feat(editar): enlaces a /editar desde email y gracias"`

---

## Task 7: Preview + pruebas E2E (Stripe test)

- [ ] **Paso 1:** Configurar env de rama en Vercel para `feature/editar-pedido-direccion` (STRIPE_SECRET_KEY test, STRIPE_WEBHOOK_SECRET de un webhook de test nuevo apuntando a la preview, NEXT_PUBLIC_SITE_URL del alias) — igual que se hizo con `test-checkout-recurrente`.
- [ ] **Paso 2:** `vercel deploy` + alias estable + bypass de protección.
- [ ] **Paso 3: E2E con Playwright** contra la preview, con un pedido de prueba real creado en test:
  - Misma zona → cambio sin pago; verificar Orders (P–S actualizadas).
  - Zona más cara → paga diferencia con 4242; webhook aplica; verificar Orders (dirección + línea envío nuevas, suma cuadra).
  - Fuera de cobertura → rechazo.
  - Teléfono incorrecto → rechazo.
  - Pedido de hoy → rechazo.
- [ ] **Paso 4:** Reportar a Amos con la URL de preview para que lo pruebe. **No merge/producción hasta su OK.**

---

## Notas de verificación (todas las tareas)

- `npm run build` requiere `STRIPE_SECRET_KEY` presente para la fase de page-data: inyectarla en el comando (clave TEST).
- Verificación del Sheet: script Node con `~/.config/verde/service-account.json`, borrarlo tras usar.
- Rebase sobre `origin/main` antes de cualquier deploy; el alias de preview se re-apunta tras cada deploy.
