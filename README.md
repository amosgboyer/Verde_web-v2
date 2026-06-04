# Verde — Web de pedidos

Web de preventa para la dark kitchen **Verde** (cocina ecuatoriana, Madrid). Pedido anticipado con pago **completo online** vía Stripe, confirmación por webhook, registro en Google Sheets y emails automáticos con Resend. En producción: **www.verdemadrid.com**.

---

## Funcionalidades

- **Carta dinámica** por categorías (Verde / Maduro / Otros), gestionada desde Google Sheets.
- **Packs / combos** con precio cerrado y descuento (p. ej. *Los Dos Tigrillos* 27 €). Se cobran como un único producto, así el carrito y Stripe cobran exactamente lo anunciado.
- **Carrito multiproducto** con carrito flotante que lleva directo al checkout.
- **Reserva por fecha y hora** con disponibilidad y aforo por slot (Google Sheets).
- **Zonas de reparto**: el cliente introduce su dirección, se calcula la zona y el **coste de envío se suma al carrito y al cobro** (recalculado en el servidor).
- **Promociones** por % configurables desde Google Sheets (fechas, valor).
- **Atención al cliente** con WhatsApp + llamada (en el checkout y en la home).
- **Emails automáticos** (confirmación al cliente + aviso interno) con Resend.
- **Vercel Web Analytics** para tráfico.

---

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Tailwind CSS** + **GSAP** (animaciones de scroll)
- **Stripe Checkout** + **Webhooks** — pago y confirmación
- **Google Sheets API** — productos, ajustes, disponibilidad y registro de pedidos
- **Resend** — emails transaccionales
- **Zod** — validación en backend
- **Vercel** — hosting + analytics

---

## Instalación

```bash
npm install
cp .env.example .env.local   # rellena con credenciales reales
npm run dev                  # http://localhost:3000
```

> Para recibir webhooks de Stripe en local: `stripe listen --forward-to localhost:3000/api/stripe-webhook` (deja el `whsec_...` en `STRIPE_WEBHOOK_SECRET`).

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe (`sk_live_...` / `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook (`whsec_...`) |
| `RESEND_API_KEY` | API key de Resend |
| `VERDE_FROM_EMAIL` | Email remitente (dominio verificado en Resend) |
| `VERDE_INTERNAL_EMAIL` | Email interno donde llegan los avisos de pedido |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Email de la cuenta de servicio de Google |
| `GOOGLE_SHEETS_PRIVATE_KEY` | Clave privada de la cuenta de servicio (con `\n`) |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ID de la hoja de cálculo |
| `NEXT_PUBLIC_SITE_URL` | URL base pública (`http://localhost:3000` en dev) |

---

## Google Sheets (panel operativo)

El negocio se gestiona desde la hoja de cálculo. Pestañas que lee/escribe la app:

- **Products** (`A:I`) — `productId · name · description · finalPrice · depositAmount · available · allergens · imageUrl · category`. La carta sale de aquí.
- **Settings** (`A:C`, clave/valor) — `reservationsOpen`, `startTime`, `endTime`, `slotIntervalMinutes`, `minLeadDays`, `currency`, y los `promo*` (promoEnabled / promoName / promoType / promoValue / promoStartDate / promoEndDate).
- **Availability** (`A:E`) — `date · isOpen · maxOrdersPerSlot · manuallySoldOut · note`. Capacidad y apertura por día.
- **SlotOverrides** (`A:E`) — excepciones por fecha+hora.
- **Orders** (`A:AC`) — registro de pedidos (lo escribe el webhook). Los packs se guardan con `productId = pack-*` y el envío como línea `envio-delivery`.

> Comparte la hoja con el `client_email` de la cuenta de servicio (permiso Editor).

### Reglas de negocio en código

- **Packs**: definidos en [`lib/products.ts`](lib/products.ts) (`PACKS`). No se muestran en la carta; se inyectan al formulario y se cobran como producto cerrado.
- **Zonas/envío**: límites y precios en [`lib/delivery.ts`](lib/delivery.ts) (`ZONE_LIMITS`, `ZONE_PRICES`). El origen no se expone en la UI.
- **Horas bloqueadas** (p. ej. comida) y **capacidad por defecto**: en [`lib/availability.ts`](lib/availability.ts) (`BLOCKED_TIMES`, `DEFAULT_MAX_ORDERS_PER_SLOT`).
- **Teléfono de atención al cliente**: en [`components/ContactHelp.tsx`](components/ContactHelp.tsx).

---

## Desplegar en Vercel

1. Proyecto conectado al repo. En **Settings → Environment Variables** añade todas las variables (Production + Preview).
2. Para `GOOGLE_SHEETS_PRIVATE_KEY`, pega el valor completo con los `\n` literales.
3. Webhook de Stripe: **Developers → Webhooks → Add endpoint** → `https://www.verdemadrid.com/api/stripe-webhook`, evento `checkout.session.completed`. Copia el `whsec_...` a `STRIPE_WEBHOOK_SECRET`. ⚠️ El webhook debe estar en el **mismo modo** (live/test) que la clave secreta.

---

## Estructura

```
/app
  page.tsx                              # Home (hero, packs, carta, reseñas, zonas, atención)
  layout.tsx                            # Nav, footer, fuentes, Analytics
  /api/create-checkout-session/route.ts # Crea sesión Stripe (productos + promo + envío)
  /api/stripe-webhook/route.ts          # Confirma pago → guarda pedido + emails
  /api/availability/route.ts            # Disponibilidad por día/slot
  /api/promotion · waitlist · test-email · debug-*

/lib
  stripe.ts · products.ts · delivery.ts · availability.ts
  google-sheets.ts · email.ts · promotions.ts · store-config.ts · validators.ts

/components
  ReservationForm.tsx  # Checkout por pasos (producto → fecha → hora → datos → entrega → pago)
  ProductCard.tsx · Packs.tsx · CategoryBar.tsx · FloatingCart.tsx
  ZoneMap.tsx · ContactHelp.tsx · Reviews.tsx · HowItWorks.tsx
  ScrollAnimations.tsx · ClosedState.tsx · WaitlistForm.tsx
```

---

## Seguridad

- El precio **nunca** se confía al frontend: el backend recibe `productId` + `quantity` y recalcula todos los importes (productos, promo y envío).
- El envío se recalcula en el servidor desde la zona (no se confía en el precio del cliente).
- La firma del webhook de Stripe se verifica en cada llamada.
- No se guardan datos de tarjeta (Stripe Checkout alojado). Todas las claves van en variables de entorno.
