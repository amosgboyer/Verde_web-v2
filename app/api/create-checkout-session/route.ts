import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getProductById, estaAgotadoTemporal } from "@/lib/products";
import { getProductsRows, getSettings } from "@/lib/google-sheets";
import { isSlotAvailable } from "@/lib/availability";
import { reservationSchema } from "@/lib/validators";
import { getActivePromotion, calculateDiscount } from "@/lib/promotions";
import { getActiveWeekendOffer, computeOfferDiscount, offerBadgeLabel } from "@/lib/offers";
import {
  feeForZone,
  minOrderForZone,
  zoneForPostalCode,
  zoneLabel,
} from "@/lib/delivery";
import { SOLD_OUT } from "@/lib/store-config";
import { getLaunchPhase, isAccessCodeValid } from "@/lib/launch";
import { getDirectoStatus, todayMadrid } from "@/lib/directo";
import { trocearMeta, ErrorCliente } from "@/lib/stripe-meta";
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

    // ── Fecha ────────────────────────────────────────────────────────────────
    // Las reservas normales son para mañana en adelante. El modo "en directo"
    // (pedido para HOY) es la excepción — y hasta ahora chocaba con esta misma
    // validación, así que el piloto no habría podido cobrar ni un pedido.
    //
    // El permiso NO se concede por el flag que manda el cliente: se comprueba
    // en servidor que la ventana del directo esté realmente abierta y que la
    // fecha sea hoy en Madrid. Si no, se aplica la regla de siempre.
    const directoStatus = getDirectoStatus();
    const esDirectoValido =
      parsed.directo &&
      directoStatus.isOpen &&
      parsed.reservationDate === todayMadrid();

    if (!esDirectoValido) {
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
    }

    // Validate delivery fields when method is "delivery"
    // La zona se recalcula en servidor desde el código postal (tabla CP → zona
    // de lib/delivery.ts) — nunca se confía en la que manda el cliente. CP no
    // listado = sin envío: no se deja pasar el checkout a domicilio.
    let serverZone: number | null = null;
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
      serverZone = zoneForPostalCode(parsed.postalCode);
      if (!serverZone) {
        return NextResponse.json(
          {
            error:
              "Ahora mismo no llegamos a ese código postal (repartimos hasta 12 km de la cocina). " +
              "Puedes elegir recogida en local o escribirnos por WhatsApp y lo vemos.",
          },
          { status: 403 }
        );
      }
      // El envío DEBE estar calculado y coincidir con la zona del servidor: así
      // el cliente nunca paga una tarifa distinta de la que vio en pantalla
      // (p. ej. una pestaña abierta con tarifas viejas tras un despliegue).
      if (parsed.deliveryZoneLevel !== serverZone) {
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
      // Agotados temporales definidos en código: la hoja sigue diciendo TRUE,
      // así que sin esta comprobación un carrito abierto podría comprarlos.
      if (estaAgotadoTemporal(item.productId)) {
        throw new ErrorCliente(
          "Uno de los platos de tu pedido se ha agotado hoy. Quítalo del carrito para continuar."
        );
      }
      const sheetProduct = sheetsProducts.find((p) => p.productId === item.productId);
      if (sheetProduct) {
        if (!sheetProduct.available) throw new ErrorCliente(`${sheetProduct.name} no está disponible`);
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
      if (!staticProduct) throw new ErrorCliente(`Producto ${item.productId} no encontrado`);
      if (!staticProduct.available) throw new ErrorCliente(`${staticProduct.name} no está disponible`);
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

    // Pedido mínimo por zona: se valida sobre la comida (sin la línea de envío)
    // ANTES de cobrar. Mensaje con upsell en vez de un "no" seco.
    if (parsed.deliveryMethod !== "pickup" && serverZone) {
      const minOrder = minOrderForZone(serverZone);
      if (productsSubtotal < minOrder) {
        const falta = (minOrder - productsSubtotal)
          .toFixed(2)
          .replace(".", ",");
        return NextResponse.json(
          {
            error:
              `Pedido mínimo a domicilio en tu zona: ${minOrder} € (sin contar el envío). ` +
              `Te faltan ${falta} € — ¿añades una salsa o una bebida?`,
          },
          { status: 400 }
        );
      }
    }

    const promo = getActivePromotion(settings);
    const discount = calculateDiscount(productsSubtotal, promo);

    // ── Oferta de fin de semana (nivel ítem) ─────────────────────────────────
    // Se recalcula en servidor desde los ítems validados (fuente de verdad); no
    // se confía en ningún dato de descuento enviado por el cliente. La fecha de
    // entrega también sale de aquí: hay ofertas que solo valen para ciertos días.
    const weekendOffer = getActiveWeekendOffer();
    const offer = weekendOffer
      ? computeOfferDiscount(
          weekendOffer,
          validatedItems.map(({ product, quantity }) => ({
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: product.depositAmount,
          })),
          parsed.reservationDate
        )
      : { discountAmount: 0, discountedUnits: 0 };

    // Descuento combinado (promo global + oferta finde), nunca mayor que el
    // subtotal de productos.
    const combinedDiscount = Math.min(
      productsSubtotal,
      discount.discountAmount + offer.discountAmount
    );
    const subtotalAfterDiscount = Math.round((productsSubtotal - combinedDiscount) * 100) / 100;
    const anyDiscount = combinedDiscount > 0;

    // Si es recogida, se ignoran por completo los campos de entrega (aunque el
    // cliente haya escrito una dirección antes de cambiar a "Recogida").
    const isPickup = parsed.deliveryMethod === "pickup";

    // Envío — recalculado en servidor desde la zona del CP (no se confía en el
    // cliente). Solo aplica con entrega a domicilio; recogida = 0.
    const deliveryFee = isPickup ? 0 : feeForZone(serverZone);
    const chargeTotal = subtotalAfterDiscount + deliveryFee;

    console.log(
      `[checkout] subtotal=${productsSubtotal} ` +
      `promoDiscount=${discount.discountAmount} ` +
      `offerDiscount=${offer.discountAmount} (${offer.discountedUnits}u) ` +
      `combinedDiscount=${combinedDiscount} ` +
      `delivery=${deliveryFee} ` +
      `charge=${chargeTotal} ` +
      `promoActive=${discount.isActive} promoName="${discount.promoName}" ` +
      `offerActive=${offer.discountAmount > 0} offerName="${weekendOffer?.name ?? ""}"`
    );

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const acceptedAt = new Date().toISOString();

    // Un único line item con el total final. El detalle de productos va en metadata.
    const productSummary = validatedItems
      .map(({ product, quantity }) => `${product.name} ×${quantity}`)
      .join(", ");

    const discountNotes: string[] = [];
    if (discount.isActive) {
      discountNotes.push(`${discount.promoName} −${discount.promoValue}%`);
    }
    if (offer.discountAmount > 0 && weekendOffer) {
      discountNotes.push(
        `${weekendOffer.name}: ${offer.discountedUnits}× ${offerBadgeLabel(weekendOffer)}`
      );
    }
    const lineItemDescription =
      productSummary +
      (discountNotes.length > 0 ? ` — ${discountNotes.join(" · ")}` : "") +
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
        // Troceado: el carrito de un pedido grande no cabe en una sola clave.
        ...trocearMeta("items", itemsMeta),
        reservationDate: parsed.reservationDate,
        reservationTime: parsed.reservationTime,
        customerName: parsed.customerName,
        email: parsed.email,
        phone: parsed.phone,
        notes: parsed.notes ?? "",
        deliveryMethod: parsed.deliveryMethod ?? "delivery",
        directo: String(parsed.directo ?? false), // pedido "en directo" (hoy)
        deliveryAddress: isPickup ? "" : parsed.deliveryAddress ?? "",
        deliveryDetails: isPickup ? "" : parsed.deliveryDetails ?? "",
        postalCode: isPickup ? "" : parsed.postalCode ?? "",
        // Zona explícita al principio ("Z2 · Salamanca"): el terminal la lee
        // con /^Z(\d)/ — el precio ya no identifica la zona con las tarifas nuevas.
        deliveryZone:
          isPickup || !serverZone ? "" : zoneLabel(serverZone, parsed.deliveryZone),
        totalItems: String(totalItems),
        totalFinal: String(productsSubtotal),
        totalDeposit: String(chargeTotal), // monto real cobrado (productos − promo + envío)
        totalPending: "0",
        deliveryFee: String(deliveryFee),
        deliveryZoneLevel: isPickup ? "" : String(serverZone ?? ""),
        privacyAccepted: String(parsed.privacyAccepted),
        termsAccepted: String(parsed.termsAccepted),
        acceptedAt,
        // Descuento total registrado (promo global + oferta finde combinadas)
        promoApplied: String(anyDiscount),
        promoName:
          discount.isActive && offer.discountAmount > 0 && weekendOffer
            ? `${discount.promoName} + ${weekendOffer.name}`
            : offer.discountAmount > 0 && weekendOffer
            ? weekendOffer.name
            : discount.promoName,
        promoType: discount.promoType,
        promoValue: String(discount.promoValue),
        discountAmount: String(combinedDiscount),
        subtotalBeforeDiscount: String(productsSubtotal),
        totalAfterDiscount: String(subtotalAfterDiscount),
        // Oferta de fin de semana (nivel ítem) — desglose propio
        offerApplied: String(offer.discountAmount > 0),
        offerName: weekendOffer?.name ?? "",
        offerDiscount: String(offer.discountAmount),
        offerUnits: String(offer.discountedUnits),
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
    // Solo se le enseñan al cliente los mensajes escritos PARA él. Antes se
    // devolvía `error.message` de cualquier error: un fallo de Stripe llegaba a
    // la pantalla en inglés, con jerga y con ids y precios internos a la vista.
    if (error instanceof ErrorCliente) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[create-checkout-session]", error);
    return NextResponse.json(
      {
        error:
          "No hemos podido crear tu reserva. Vuelve a intentarlo en un momento; " +
          "si sigue fallando, escríbenos por WhatsApp y la hacemos nosotros.",
      },
      { status: 500 }
    );
  }
}
