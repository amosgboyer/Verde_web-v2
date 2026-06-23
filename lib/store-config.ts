export interface StoreConfig {
  reservationsOpen: boolean;
  closedMessage: string;
  deliveryDays: string[];
  maxQuantityPerOrder: number;
  currency: string;
}

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
