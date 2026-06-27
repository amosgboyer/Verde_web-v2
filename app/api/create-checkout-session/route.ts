import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getProductById } from "@/lib/products";
import { getProductsRows, getSettings } from "@/lib/google-sheets";
import { isSlotAvailable } from "@/lib/availability";
import { reservationSchema } from "@/lib/validators";
import { getActivePromotion, calculateDiscount } from "@/lib/promotions";
import { feeForZone } from "@/lib/delivery";
import { SOLD_OUT } from "@/lib/store-config";
import { getLaunchPhase, isAccessCodeValid } from "@/lib/launch";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    if (SOLD_OUT) {
      return NextResponse.json(
        { error: "Estamos completos este mes. ¡Vuelve pronto!" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = reservationSchema.parse(body);

    // Acceso anticipado: durante la fase de lista de espera se exige código válido.
    if (getLaunchPhase() === "early_access" && !isAccessCodeValid(parsed.accessCode)) {
      return NextResponse.json(
        {
          error:
            "Código de acceso no válido. Estos días solo reservan los de la lista de espera con su código; el martes abrimos para todos.",
        },
        { status: 403 }
      );
    }

    const settings = await getSettings();

    if (!settings.reservationsOpen) {
      return NextResponse.json(
        { error: "Las reservas están cerradas en este momento." },
        { status: 403 }
      );
    }

    // Validate date: not today, not past, respects minLeadDays
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.reservationDate <= today) {
      return NextResponse.json(
        { error: "No puedes reservar para hoy. La primera fecha disponible es mañana." },
        { status: 400 }
      );
    }

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + settings.minLeadDays);
    const minDateStr = minDate.toISOString().slice(0, 10);
    if (parsed.reservationDate < minDateStr) {
      return NextResponse.json(
        { error: `Debes reservar con al menos ${settings.minLeadDays} día(s) de antelación.` },
        { status: 400 }
      );
    }

    // Validate delivery fields when method is "delivery"
    if (parsed.deliveryMethod !== "pickup") {
      if (!parsed.deliveryAddress || parsed.deliveryAddress.trim().length < 5) {
        return NextResponse.json(
          { error: "Dirección de entrega requerida (mínimo 5 caracteres)." },
          { status: 400 }
        );
      }
      if (!parsed.postalCode || parsed.postalCode.trim().length < 1) {
        return NextResponse.json(
          { error: "Código postal requerido." },
          { status: 400 }
        );
      }
      // El envío DEBE estar calculado: sin zona válida (1 o 2) no se permite la
      // entrega. Evita que se cuele un pedido a domicilio con envío 0 € cuando el
      // cliente no pulsa "Calcular envío".
      if (parsed.deliveryZoneLevel !== 1 && parsed.deliveryZoneLevel !== 2) {
        return NextResponse.json(
          {
            error:
              'Antes de pagar, calcula el envío de tu dirección con el botón "Calcular envío".',
          },
          { status: 400 }
        );
      }
    }

    // Validate slot availability (backend is source of truth)
    const slotOk = await isSlotAvailable(
      parsed.reservationDate,
      parsed.reservationTime
    );
    if (!slotOk) {
      return NextResponse.json(
        { error: "Ese horario acaba de agotarse. Elige otro horario disponible." },
        { status: 409 }
      );
    }

    // Validate products — Google Sheets first, static fallback
    let sheetsProducts: Awaited<ReturnType<typeof getProductsRows>> = [];
    try {
      sheetsProducts = await getProductsRows();
    } catch {
      // continue with static fallback
    }

    const validatedItems = parsed.items.map((item) => {
      const sheetProduct = sheetsProducts.find((p) => p.productId === item.productId);
      if (sheetProduct) {
        if (!sheetProduct.available) throw new Error(`${sheetProduct.name} no está disponible`);
        return {
          product: {
            id: sheetProduct.productId,
            name: sheetProduct.name,
            finalPrice: sheetProduct.finalPrice,
            depositAmount: sheetProduct.depositAmount,
          },
          quantity: item.quantity,
        };
      }
      const staticProduct = getProductById(item.productId);
      if (!staticProduct) throw new Error(`Producto ${item.productId} no encontrado`);
      if (!staticProduct.available) throw new Error(`${staticProduct.name} no está disponible`);
      return {
        product: {
          id: staticProduct.id,
          name: staticProduct.name,
          finalPrice: staticProduct.finalPrice,
          depositAmount: staticProduct.depositAmount,
        },
        quantity: item.quantity,
      };
    });

    // ── Calcular subtotal, descuento y total ──────────────────────────────────
    const productsSubtotal = validatedItems.reduce(
      (s, { product, quantity }) => s + product.depositAmount * quantity,
      0
    );
    const totalItems = validatedItems.reduce((s, { quantity }) => s + quantity, 0);

    const promo = getActivePromotion(settings);
    const discount = calculateDiscount(productsSubtotal, promo);

    // Si es recogida, se ignoran por completo los campos de entrega (aunque el
    // cliente haya escrito una dirección antes de cambiar a "Recogida").
    const isPickup = parsed.deliveryMethod === "pickup";

    // Envío — recalculado en servidor desde la zona (no se confía en el cliente).
    // Solo aplica con entrega a domicilio; recogida = 0.
    const deliveryFee = isPickup
      ? 0
      : feeForZone(parsed.deliveryZoneLevel ?? null);
    const chargeTotal = discount.totalAfterDiscount + deliveryFee;

    console.log(
      `[checkout] subtotal=${discount.subtotalBeforeDiscount} ` +
      `discount=${discount.discountAmount} ` +
      `delivery=${deliveryFee} ` +
      `charge=${chargeTotal} ` +
      `promoActive=${discount.isActive} promoName="${discount.promoName}"`
    );

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const acceptedAt = new Date().toISOString();

    // Un único line item con el total final. El detalle de productos va en metadata.
    const productSummary = validatedItems
      .map(({ product, quantity }) => `${product.name} ×${quantity}`)
      .join(", ");

    const lineItemDescription =
      (discount.isActive
        ? `${productSummary} — ${discount.promoName} −${discount.promoValue}%`
        : productSummary) +
      (deliveryFee > 0 ? ` · Envío ${deliveryFee.toFixed(2)} €` : "");

    // Stripe Checkout mostrará métodos de pago disponibles según la configuración del Dashboard,
    // el país, la moneda, el dominio y el dispositivo. No limitar con payment_method_types
    // para permitir Apple Pay, Google Pay y Link cuando estén disponibles.
    const lineItems = [
      {
        price_data: {
          currency: settings.currency,
          unit_amount: Math.round(chargeTotal * 100),
          product_data: {
            name: "Pedido Verde",
            description: lineItemDescription,
          },
        },
        quantity: 1,
      },
    ];

    const itemsMeta = JSON.stringify(
      validatedItems.map(({ product, quantity }) => ({
        id: product.id,
        name: product.name,
        qty: quantity,
        price: product.finalPrice,
        deposit: product.depositAmount,
      }))
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: {
        items: itemsMeta,
        reservationDate: parsed.reservationDate,
        reservationTime: parsed.reservationTime,
        customerName: parsed.customerName,
        email: parsed.email,
        phone: parsed.phone,
        notes: parsed.notes ?? "",
        deliveryMethod: parsed.deliveryMethod ?? "delivery",
        deliveryAddress: isPickup ? "" : parsed.deliveryAddress ?? "",
        deliveryDetails: isPickup ? "" : parsed.deliveryDetails ?? "",
        postalCode: isPickup ? "" : parsed.postalCode ?? "",
        deliveryZone: isPickup ? "" : parsed.deliveryZone ?? "",
        totalItems: String(totalItems),
        totalFinal: String(productsSubtotal),
        totalDeposit: String(chargeTotal), // monto real cobrado (productos − promo + envío)
        totalPending: "0",
        deliveryFee: String(deliveryFee),
        deliveryZoneLevel: isPickup ? "" : String(parsed.deliveryZoneLevel ?? ""),
        privacyAccepted: String(parsed.privacyAccepted),
        termsAccepted: String(parsed.termsAccepted),
        acceptedAt,
        // Promoción
        promoApplied: String(discount.isActive),
        promoName: discount.promoName,
        promoType: discount.promoType,
        promoValue: String(discount.promoValue),
        discountAmount: String(discount.discountAmount),
        subtotalBeforeDiscount: String(discount.subtotalBeforeDiscount),
        totalAfterDiscount: String(discount.totalAfterDiscount),
      },
      customer_email: parsed.email,
      success_url: `${appUrl}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancelado`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos.", details: error.flatten().fieldErrors },
        { status: 422 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[create-checkout-session]", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
