import React from "react";
import { Resend } from "resend";
import { CustomerReservationEmail } from "../emails/CustomerReservationEmail";
import { InternalOrderEmail } from "../emails/InternalOrderEmail";
import { OverbookingAlertEmail } from "../emails/OverbookingAlertEmail";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Falta la variable de entorno RESEND_API_KEY");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.VERDE_FROM_EMAIL ?? "verde@ejemplo.com";
const TEAM_EMAIL = process.env.VERDE_INTERNAL_EMAIL ?? "equipo@ejemplo.com";

// ─── Email de lanzamiento a la lista de espera ────────────────────────────────
const LAUNCH_REPLY_TO = "verdeysoloverdemadrid@gmail.com";
const ACCESS_CODE_SPACED = "01110110 01100101 01110010 01100100 01100101";

export async function sendLaunchAnnouncement(
  to: string,
  name: string
): Promise<void> {
  const hello = name && name.trim() ? name.trim().split(/\s+/)[0] : "hola";
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#2e2e1e;background:#f5edd8;">
    <div style="background:#1c3a10;padding:24px;text-align:center;">
      <span style="color:#7ab356;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Verde · Madrid</span>
    </div>
    <div style="padding:28px 24px;">
      <p style="font-size:16px;">¡Hola ${hello}!</p>
      <h1 style="color:#2E4F20;font-size:24px;margin:8px 0 16px;">El momento ha llegado 🌱</h1>
      <p style="font-size:15px;line-height:1.6;">Te apuntaste a la lista de espera de <b>Verde</b> y por eso hoy entras <b>antes que nadie</b>. El fruto de tu interés ya está aquí… pero solo unos días: <b>el martes abrimos para todo el mundo.</b> Reserva cuanto antes y disfruta.</p>
      <p style="margin-top:22px;font-size:13px;color:#6e6e5a;">🔓 Tu código de acceso anticipado (cópialo y pégalo en la web):</p>
      <div style="background:#0d1f08;color:#b8d89a;font-family:monospace;padding:14px;border-radius:8px;text-align:center;letter-spacing:2px;font-size:14px;word-break:break-all;">${ACCESS_CODE_SPACED}</div>
      <p style="margin-top:22px;font-size:15px;line-height:1.6;">👉 Entra en la web, baja a <i>"Haz tu pedido"</i>, pega el código y verás la magia ✨. Elige tu pack o plato y reserva tu día (entregamos miércoles a domingo).</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://www.verdemadrid.com" style="background:#c85a2a;color:#ffffff;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">Reservar ahora →</a>
      </div>
      <p style="font-size:13px;color:#6e6e5a;">⚡ Plazas limitadas — 1 cupo por hora. ¡Corre que vuelan!</p>
      <p style="margin-top:18px;font-size:13px;color:#6e6e5a;">¿Dudas? Escríbenos por WhatsApp: <a href="https://wa.me/34605442809" style="color:#509234;font-weight:bold;text-decoration:none;">📲 +34 605 442 809</a></p>
      <p style="margin-top:14px;font-size:15px;">Con cariño,<br/><b>Verde Madrid</b><br/><a href="https://www.verdemadrid.com" style="color:#2E4F20;">verdemadrid.com</a></p>
    </div>
  </div>`;

  await resend.emails.send({
    from: FROM,
    to,
    reply_to: LAUNCH_REPLY_TO,
    subject: "El momento ha llegado 🌱",
    html,
  });
}

export interface OrderItem {
  productName: string;
  quantity: number;
  finalPrice: number;
}

export interface ConfirmationEmailData {
  customerName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  reservationDate: string;
  reservationTime: string;
  depositPaid: number;
  pendingAmount: number;
  notes?: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  deliveryDetails?: string;
  postalCode?: string;
  deliveryZone?: string;
  privacyAccepted?: boolean;
  termsAccepted?: boolean;
  acceptedAt?: string;
  subtotalBeforeDiscount?: number;
  discountAmount?: number;
  promoName?: string;
}

// ─── Customer confirmation ────────────────────────────────────────────────────

export async function sendConfirmationToCustomer(
  data: ConfirmationEmailData
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: "Tu reserva en Verde está confirmada",
    // React.createElement avoids needing JSX in this .ts file
    react: React.createElement(CustomerReservationEmail, {
      customerName:   data.customerName,
      items:          data.items,
      reservationDate: data.reservationDate,
      reservationTime: data.reservationTime,
      deliveryMethod:  data.deliveryMethod,
      deliveryAddress: data.deliveryAddress,
      deliveryDetails: data.deliveryDetails,
      postalCode:      data.postalCode,
      deliveryZone:    data.deliveryZone,
      depositPaid:              data.depositPaid,
      pendingAmount:            data.pendingAmount,
      subtotalBeforeDiscount:   data.subtotalBeforeDiscount,
      discountAmount:           data.discountAmount,
      promoName:                data.promoName,
    }),
  });
}

// ─── Internal order notification ──────────────────────────────────────────────

export async function sendInternalOrderNotification(
  data: ConfirmationEmailData & { stripeSessionId?: string }
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: TEAM_EMAIL,
    subject: `Nueva reserva pagada — Verde | ${data.customerName}`,
    react: React.createElement(InternalOrderEmail, {
      customerName:    data.customerName,
      email:           data.email,
      phone:           data.phone,
      items:           data.items,
      reservationDate: data.reservationDate,
      reservationTime: data.reservationTime,
      deliveryMethod:  data.deliveryMethod,
      deliveryAddress: data.deliveryAddress,
      deliveryDetails: data.deliveryDetails,
      postalCode:      data.postalCode,
      deliveryZone:    data.deliveryZone,
      depositPaid:     data.depositPaid,
      pendingAmount:   data.pendingAmount,
      notes:           data.notes,
      stripeSessionId:          data.stripeSessionId,
      privacyAccepted:          data.privacyAccepted,
      termsAccepted:            data.termsAccepted,
      acceptedAt:               data.acceptedAt,
      subtotalBeforeDiscount:   data.subtotalBeforeDiscount,
      discountAmount:           data.discountAmount,
      promoName:                data.promoName,
    }),
  });
}

// ─── Overbooking alert ────────────────────────────────────────────────────────

export interface OverbookingAlertData {
  customerName: string;
  email: string;
  phone: string;
  items: OrderItem[];
  reservationDate: string;
  reservationTime: string;
  stripeSessionId: string;
  depositPaid: number;
  pendingAmount: number;
}

export async function sendOverbookingAlert(
  data: OverbookingAlertData
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: TEAM_EMAIL,
    subject: "URGENTE — Posible sobrecupo en reserva Verde",
    react: React.createElement(OverbookingAlertEmail, {
      customerName:    data.customerName,
      email:           data.email,
      phone:           data.phone,
      items:           data.items,
      reservationDate: data.reservationDate,
      reservationTime: data.reservationTime,
      stripeSessionId: data.stripeSessionId,
      depositPaid:     data.depositPaid,
      pendingAmount:   data.pendingAmount,
    }),
  });
}

// ─── Waitlist (unchanged) ─────────────────────────────────────────────────────

export async function sendWaitlistNotification(data: {
  name: string;
  email: string;
  phone: string;
  message?: string;
}): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: TEAM_EMAIL,
    subject: `Lista de espera — Verde | ${data.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111;">
        <h2>Nuevo registro en lista de espera</h2>
        <table style="border-collapse:collapse;width:100%;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#555;">Nombre</td><td>${data.name}</td></tr>
          <tr><td style="padding:6px 0;color:#555;">WhatsApp</td><td>${data.phone}</td></tr>
          <tr><td style="padding:6px 0;color:#555;">Email</td><td>${data.email || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#555;">Mensaje</td><td>${data.message ?? "—"}</td></tr>
        </table>
      </div>
    `,
  });
}
