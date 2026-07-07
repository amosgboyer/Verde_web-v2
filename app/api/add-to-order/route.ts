import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { getProductById } from "@/lib/products";
import {
  getProductsRows,
  getSettings,
  findAddOrderContext,
} from "@/lib/google-sheets";
import { SOLD_OUT } from "@/lib/store-config";

const addSchema = z.object({
  sessionId: z.string().min(6),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, "Añade al menos un producto"),
});

export async function POST(req: NextRequest) {
  try {
    if (SOLD_OUT) {
      return NextResponse.json(
        { error: "Estamos completos ahora mismo." },
        { status: 403 }
      );
    }

    const parsed = addSchema.parse(await req.json());

    // Pedido original (fuente de verdad: fecha/hora/cliente salen de aquí)
    const ctx = await findAddOrderContext({ sessionId: parsed.sessionId });
    if (!ctx.found) {
      return NextResponse.json(
        { error: "No encontramos tu pedido." },
        { status: 404 }
      );
    }

    // Solo se puede ampliar mientras el pedido no sea de hoy o de un día pasado.
    const today = new Date().toISOString().slice(0, 10);
    if (ctx.reservationDate <= today) {
      return NextResponse.json(
        {
          error:
            "Ya no se puede añadir a este pedido (es de hoy o ya pasó). Escríbenos por WhatsApp.",
        },
        { status: 403 }
      );
    }

    const settings = await getSettings();

    // Validar productos (Google Sheets primero, estático de respaldo)
    let sheetsProducts: Awaited<ReturnType<typeof getProductsRows>> = [];
    try {
      sheetsProducts = await getProductsRows();
    } catch {
      // respaldo estático
    }

    const validatedItems = parsed.items.map((item) => {
      const sheetProduct = sheetsProducts.find(
        (p) => p.productId === item.productId
      );
      if (sheetProduct) {
        if (!sheetProduct.available)
          throw new Error(`${sheetProduct.name} no está disponible`);
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
      if (!staticProduct)
        throw new Error(`Producto ${item.productId} no encontrado`);
      if (!staticProduct.available)
        throw new Error(`${staticProduct.name} no está disponible`);
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

    const totalItems = validatedItems.reduce((s, { quantity }) => s + quantity, 0);
    const productsSubtotal = validatedItems.reduce(
      (s, { product, quantity }) => s + product.depositAmount * quantity,
      0
    );

    // Sin envío (mismo reparto) y sin promo en ampliaciones.
    const chargeTotal = productsSubtotal;
    if (chargeTotal < 0.5) {
      return NextResponse.json(
        { error: "Importe demasiado bajo." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const acceptedAt = new Date().toISOString();

    const productSummary = validatedItems
      .map(({ product, quantity }) => `${product.name} ×${quantity}`)
      .join(", ");

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
      line_items: [
        {
          price_data: {
            currency: settings.currency,
            unit_amount: Math.round(chargeTotal * 100),
            product_data: {
              name: `Ampliación · pedido ${ctx.orderCode}`,
              description: productSummary,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        items: itemsMeta,
        reservationDate: ctx.reservationDate,
        reservationTime: ctx.reservationTime,
        customerName: ctx.customerName,
        email: ctx.email,
        phone: ctx.phone,
        notes: `Ampliación del pedido ${ctx.orderCode}`,
        deliveryMethod: ctx.deliveryMethod,
        deliveryAddress: "",
        deliveryDetails: "",
        postalCode: "",
        deliveryZone: "",
        totalItems: String(totalItems),
        totalFinal: String(productsSubtotal),
        totalDeposit: String(chargeTotal),
        totalPending: "0",
        deliveryFee: "0",
        deliveryZoneLevel: "",
        privacyAccepted: "true",
        termsAccepted: "true",
        acceptedAt,
        // Marca de ampliación (el webhook salta la comprobación de cupo)
        isAddon: "true",
        parentSessionId: ctx.sessionId,
        // Sin promoción en ampliaciones
        promoApplied: "false",
        promoName: "",
        promoType: "",
        promoValue: "0",
        discountAmount: "0",
        subtotalBeforeDiscount: String(chargeTotal),
        totalAfterDiscount: String(chargeTotal),
      },
      customer_email: ctx.email || undefined,
      success_url: `${appUrl}/gracias?session_id={CHECKOUT_SESSION_ID}&added=1`,
      cancel_url: `${appUrl}/anadir`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
