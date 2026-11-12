import { Resend } from "resend";
import { upsertSubscriber } from "./google-sheets";

// Alta en la lista de ofertas cuando el cliente activa el toggle del checkout.
//
// 1. Sheet → pestaña "Suscriptores" (siempre). Es la lista maestra, por email.
// 2. Resend → contacto en la Audience RESEND_AUDIENCE_ID (solo si existe la
//    variable). Así se pueden mandar campañas con Resend Broadcasts y Resend
//    gestiona solo el enlace de baja ({{{RESEND_UNSUBSCRIBE_URL}}}).
//
// Best-effort: nunca lanza. Un fallo aquí no puede tocar el pedido ni los
// emails de confirmación (la lección de la columna AG, nov-2026).

export async function registrarSuscriptor(data: {
  email: string;
  name: string;
  phone: string;
}): Promise<void> {
  const at = new Date().toISOString();

  try {
    const r = await upsertSubscriber({ ...data, at });
    console.log(`[suscriptores] ${r}: ${data.email}`);
  } catch (err) {
    console.warn("[suscriptores] No se pudo guardar en el Sheet:", err);
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const apiKey = process.env.RESEND_API_KEY;
  if (!audienceId || !apiKey) return;

  try {
    const [firstName, ...rest] = (data.name || "").trim().split(/\s+/);
    const { error } = await new Resend(apiKey).contacts.create({
      audienceId,
      email: data.email.trim().toLowerCase(),
      firstName: firstName || undefined,
      lastName: rest.join(" ") || undefined,
      unsubscribed: false,
    });
    // Si ya existía, Resend devuelve error de duplicado: no es un fallo real.
    if (error && !/exist|duplicate/i.test(error.message)) {
      console.warn("[suscriptores] Resend rechazó el contacto:", error.message);
    }
  } catch (err) {
    console.warn("[suscriptores] No se pudo crear el contacto en Resend:", err);
  }
}
