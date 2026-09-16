import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import {
  findAddOrderContext,
  updateOrderAddress,
  getSettings,
} from "@/lib/google-sheets";
import { normalizePhone } from "@/lib/order-code";
import { evaluateAddressChange } from "@/lib/order-address";
import { zoneForPostalCode, feeForZone, zoneLabel } from "@/lib/delivery";
import { SOLD_OUT } from "@/lib/store-config";
import { ErrorCliente } from "@/lib/stripe-meta";

const schema = z.object({
  code: z.string().min(3),
  phone: z.string().min(6),
  deliveryAddress: z.string().min(5, "Dirección demasiado corta"),
  deliveryDetails: z.string().max(500).optional().or(z.literal("")),
  postalCode: z.string().min(1),
  deliveryZone: z.string().max(100).optional().or(z.literal("")),
});

// Mensaje genérico a propósito: no revelar si falló el código o el teléfono.
const NO_VERIFICADO =
  "No hemos podido verificar tu pedido. Revisa el teléfono con el que hiciste el pedido.";

export async function POST(req: NextRequest) {
  try {
    if (SOLD_OUT) {
      return NextResponse.json({ error: "Estamos completos ahora mismo." }, { status: 403 });
    }

    const parsed = schema.parse(await req.json());

    const ctx = await findAddOrderContext({ code: parsed.code });
    if (!ctx.found) {
      return NextResponse.json({ error: NO_VERIFICADO }, { status: 404 });
    }

    // Verificación de identidad: el teléfono debe coincidir con el del pedido.
    if (normalizePhone(parsed.phone) !== normalizePhone(ctx.phone)) {
      return NextResponse.json({ error: NO_VERIFICADO }, { status: 403 });
    }

    // Solo pedidos a domicilio.
    if (ctx.deliveryMethod !== "delivery") {
      return NextResponse.json(
        { error: "Este pedido es de recogida, no tiene dirección de entrega." },
        { status: 400 }
      );
    }

    // Ventana: solo hasta el día antes (mañana en adelante).
    const today = new Date().toISOString().slice(0, 10);
    if (ctx.reservationDate <= today) {
      return NextResponse.json(
        {
          error:
            "Ya no se puede cambiar la dirección de este pedido (es de hoy o ya pasó). Escríbenos por WhatsApp.",
        },
        { status: 403 }
      );
    }

    // Tarifa que se cobró en el pedido original (por su CP actual).
    const oldFee = feeForZone(zoneForPostalCode(ctx.postalCode));
    const outcome = evaluateAddressChange(parsed.postalCode, oldFee);

    if (outcome.kind === "out_of_area") {
      return NextResponse.json(
        {
          error:
            "Esa dirección queda fuera de nuestra zona de reparto (hasta 12 km). Puedes elegir recogida o escribirnos por WhatsApp.",
        },
        { status: 403 }
      );
    }

    const label = zoneLabel(outcome.zone, parsed.deliveryZone);

    // Misma zona o más barata → aplicar directo, sin cobro (no se devuelve).
    if (outcome.kind === "no_charge") {
      const { updatedRows } = await updateOrderAddress(ctx.sessionId, {
        deliveryAddress: parsed.deliveryAddress,
        deliveryDetails: parsed.deliveryDetails ?? "",
        postalCode: parsed.postalCode,
        deliveryZone: label,
      });
      if (updatedRows === 0) {
        return NextResponse.json({ error: NO_VERIFICADO }, { status: 404 });
      }
      return NextResponse.json({ ok: true, charged: false });
    }

    // Sube de zona → cobrar la diferencia por Stripe; el cambio se aplica en el webhook.
    const settings = await getSettings();
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: settings.currency,
            unit_amount: Math.round(outcome.diff * 100),
            product_data: {
              name: `Cambio de dirección · pedido ${ctx.orderCode}`,
              description: `Diferencia de envío a ${label}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        isAddressChange: "true",
        parentSessionId: ctx.sessionId,
        newAddress: parsed.deliveryAddress,
        newDetails: parsed.deliveryDetails ?? "",
        newPostalCode: parsed.postalCode,
        newZoneLabel: label,
        newDeliveryFee: String(outcome.newFee),
      },
      customer_email: ctx.email || undefined,
      success_url: `${appUrl}/gracias?session_id={CHECKOUT_SESSION_ID}&address=1`,
      cancel_url: `${appUrl}/editar?codigo=${ctx.orderCode}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
    }
    if (error instanceof ErrorCliente) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[change-address]", error);
    return NextResponse.json(
      {
        error:
          "No hemos podido cambiar la dirección. Inténtalo de nuevo; si sigue fallando, escríbenos por WhatsApp.",
      },
      { status: 500 }
    );
  }
}
