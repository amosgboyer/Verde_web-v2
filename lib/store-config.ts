export interface StoreConfig {
  reservationsOpen: boolean;
  closedMessage: string;
  deliveryDays: string[];
  maxQuantityPerOrder: number;
  currency: string;
}

// ─── Recogida en local ──────────────────────────────────────────────────────
// Dirección que se muestra al cliente cuando elige "Recogida" (para ir a por su
// pedido). Se enseña en el formulario, en el resumen y en el email de confirmación.
export const PICKUP_ADDRESS = "Calle de la Araucaria 19, 28039 Madrid";
export const PICKUP_MAPS_URL =
  "https://maps.google.com/?q=Calle+de+la+Araucaria+19+28039+Madrid";

// ─── SOLD OUT general ───────────────────────────────────────────────────────
// Pon `true` para cerrar TODO (sold out del mes): no se puede reservar, el
// calendario queda vacío y se muestra el cartel de SOLD OUT. Pon `false` para
// reabrir (entonces manda `reservationsOpen` del Google Sheet). Requiere deploy.
export const SOLD_OUT = false;

// Para abrir o cerrar reservas, cambia `reservationsOpen` a true o false.
// En el futuro esto puede moverse a una variable de entorno o a Google Sheets.
export const storeConfig: StoreConfig = {
  reservationsOpen: true,

  closedMessage:
    "Nos hemos llenado de pedidos y preferimos cocinar bien antes que correr mal. Abrimos nuevos cupos muy pronto — déjanos tu WhatsApp y te avisamos.",

  deliveryDays: ["sábado", "domingo"],

  maxQuantityPerOrder: 10,

  currency: "eur",
};
