# Diseño · Cambiar dirección de un pedido (autoservicio del cliente)

**Fecha:** 2026-09-16
**Estado:** aprobado el diseño (pendiente revisión del spec por Amos)
**Rama:** `feature/editar-pedido-direccion` · **No desplegar a producción hasta OK de Amos.**

## Contexto

Es la primera pieza de un objetivo mayor: que el cliente pueda **editar su
pedido ya pagado** (añadir productos, cambiar dirección, fecha/hora, método).

Estado actual del código:
- **Añadir productos YA existe**: `/anadir?codigo=` + `app/api/add-to-order` +
  webhook con `isAddon`/`parentSessionId`. Cobra el extra en una sesión Stripe
  nueva; solo si el pedido es de mañana en adelante; sin envío ni promo.
- **Cambiar dirección NO existe** → esto.

Piezas siguientes (fuera de este spec): cambiar fecha/hora, cambiar método
envío↔recogida, pulir añadir productos.

## Objetivo

Permitir que el cliente cambie la **dirección de entrega** de un pedido a
domicilio ya pagado, cobrando la diferencia si la nueva dirección cae en una
zona de reparto más cara.

## Decisiones (acordadas con Amos, 16-09-2026)

1. **Seguridad:** el cliente entra con el código/enlace de su pedido y
   **confirma su teléfono** (el que dio al pedir). La verificación se hace en
   **servidor** antes de leer o escribir nada.
2. **Diferencia de tarifa de zona:** cobrar si sube; **misma zona = gratis**;
   **no se devuelve** si baja (sin reembolsos). Fuera de cobertura → rechazar.
3. **Ventana:** solo si el pedido es para **mañana en adelante** (mismo día o
   pasado → se le pide WhatsApp), igual que "añadir productos".
4. **Alcance:** solo pedidos **a domicilio**. Cambiar envío↔recogida es otra
   pieza.
5. **No tocar producción** hasta que Amos lo pruebe en preview y dé el OK.

## Flujo del cliente

1. Abre `verdemadrid.com/editar?codigo=<orderCode>` (enlace en el email de
   confirmación y en la página de "Gracias").
2. **Verificación:** introduce su teléfono. El servidor lo compara con el del
   pedido. Si no coincide → error genérico (no revela qué falló).
3. Ve su dirección actual y un formulario de **nueva dirección** con
   **Google Places** + cálculo de zona (reutiliza el hook de Places del
   checkout y `quoteDeliveryByPostalCode`; misma tabla CP→zona → lo que ve es
   lo que se cobra).
4. Según la zona nueva vs la actual:
   - **Fuera de cobertura (>12 km):** rechazar; sugerir recogida o WhatsApp.
   - **Misma zona o más barata:** aplicar el cambio directo, **sin pago**.
   - **Más cara:** mostrar la diferencia (nueva tarifa − tarifa original) y
     enviar a Stripe a pagarla; al confirmar el pago se aplica el cambio.
5. Confirmación en pantalla (y WhatsApp; no dependemos del email).

## Arquitectura / piezas

- **Página `/editar`** (cliente): paso de verificación (teléfono) + formulario
  de dirección. Reutiliza `use-places-autocomplete` y el cálculo de zona de
  `lib/delivery`.
- **`app/api/change-address`** (POST):
  - Localiza el pedido (`findAddOrderContext` por `sessionId`/código) y
    **verifica el teléfono** contra el del pedido.
  - Valida ventana (mañana en adelante) y que sea a domicilio.
  - Recalcula zona nueva con `zoneForPostalCode`.
  - Fuera de cobertura → 403 con mensaje.
  - Nueva tarifa ≤ original → **aplica el cambio directo** en Orders y responde
    OK (sin pago).
  - Nueva tarifa > original → crea sesión Stripe por la **diferencia** con
    metadata `isAddressChange`, `parentSessionId`, y la nueva dirección/CP/zona;
    responde con la URL de pago.
- **Webhook** (`stripe-webhook`): nuevo caso `isAddressChange` → al completarse
  el pago, aplica el cambio en Orders (con **dedup** por el `sessionId` de la
  sesión de cambio, para no aplicarlo dos veces).
- **`lib/google-sheets`**: función nueva `updateOrderAddress(sessionId, {…})`
  que **localiza y edita** las filas del pedido original por `sessionId` (hoy el
  webhook solo hace `append`; esto es escritura sobre filas existentes).

## Contrato con Orders (The Jungle)

- Cambiar dirección = **editar** las celdas `deliveryAddress`,
  `deliveryDetails`, `postalCode`, `deliveryZone` (formato `Z2 · barrio`) en
  **todas las filas** del pedido (una por plato + la línea `envio-delivery`),
  para que The Jungle lea la dirección nueva. `status` sigue `PAID`.
- Si se cobró diferencia de envío: **actualizar la línea `envio-delivery`** al
  nuevo importe, para que la suma de Orders cuadre con lo cobrado
  (original con envío viejo + diferencia = nuevo envío).
- No se renombra ningún `productId`/`productName`. No se tocan las demás
  columnas.

## Casos borde / errores

- Código/pedido no encontrado o teléfono no coincide → error genérico 404/403.
- Pedido de hoy o pasado → bloqueado (WhatsApp).
- Pedido de recogida (no delivery) → no aplica (mensaje; es otra pieza).
- Nueva dirección fuera de cobertura → rechazado.
- Pago de la diferencia cancelado → no se cambia nada (dirección vieja intacta).
- Doble webhook → dedup por `sessionId` del cambio (no re-aplicar).
- El cambio directo (sin pago) sólo se escribe tras verificar el teléfono en
  servidor.

## Testing

- Rama `feature/editar-pedido-direccion` + **preview con Stripe de test**.
- Casos: misma zona (sin pago), zona más cara (pago con 4242), fuera de
  cobertura (rechazo), teléfono incorrecto (rechazo), pedido de hoy (rechazo),
  pedido de recogida (rechazo).
- Verificar en Orders (service account) que las filas del pedido se actualizan
  (dirección/CP/zona) y que la suma cuadra tras cobrar diferencia.
- No pasar a producción hasta OK de Amos.

## Fuera de alcance (otras piezas)

Cambiar fecha/hora · cambiar método envío↔recogida · pulir añadir productos ·
devolución de diferencia si baja la tarifa · edición de datos de contacto.
