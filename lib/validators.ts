import { z } from "zod";
import { storeConfig } from "./store-config";

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z
    .number()
    .int()
    .min(1)
    .max(storeConfig.maxQuantityPerOrder, `Máximo ${storeConfig.maxQuantityPerOrder} por producto`),
});

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

export const reservationSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Añade al menos un producto"),
  reservationDate: z.string().regex(DATE_REGEX, "Fecha inválida (YYYY-MM-DD)"),
  reservationTime: z.string().regex(TIME_REGEX, "Hora inválida (HH:mm)"),
  customerName: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email no válido"),
  phone: z.string().min(6, "Teléfono/WhatsApp requerido"),
  notes: z.string().max(500).optional(),
  deliveryMethod: z.enum(["delivery", "pickup"]).default("delivery"),
  deliveryAddress: z.string().max(300).optional().or(z.literal("")),
  deliveryDetails: z.string().max(500).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  deliveryZone: z.string().max(100).optional().or(z.literal("")),
  deliveryZoneLevel: z.number().int().min(1).max(2).nullable().optional(),
  directo: z.boolean().optional().default(false),
  accessCode: z.string().max(60).optional().or(z.literal("")),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar la política de privacidad." }),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar las condiciones de compra." }),
  }),
});

export type ReservationInput = z.infer<typeof reservationSchema>;

export const waitlistSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email no válido").optional().or(z.literal("")),
  phone: z.string().min(6, "WhatsApp requerido"),
  message: z.string().max(300).optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
