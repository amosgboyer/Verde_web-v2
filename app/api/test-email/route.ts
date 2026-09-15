import { NextRequest, NextResponse } from "next/server";
import { sendConfirmationToCustomer } from "@/lib/email";

// GET /api/test-email
// Envía un CustomerReservationEmail con datos ficticios.
//
// En desarrollo: va a VERDE_INTERNAL_EMAIL sin más.
// En producción: SOLO si se pasa ?key=<TOKEN_DIAG> correcto — es una prueba de
// entregabilidad temporal (verificar que el correo nuevo, con el enlace de
// WhatsApp por dominio propio, llega a bandeja y no a spam). Se puede indicar
// destinatario con ?to=. QUITAR este acceso tras la prueba.
const TOKEN_DIAG = "diag-JuARTR9VUSxdBZOaWTLA7o_Me2qKYNwp";

export async function GET(req: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const key = req.nextUrl.searchParams.get("key");
  if (!isDev && key !== TOKEN_DIAG) {
    return new NextResponse(null, { status: 404 });
  }

  const to = req.nextUrl.searchParams.get("to") || process.env.VERDE_INTERNAL_EMAIL;

  if (!to) {
    return NextResponse.json(
      { success: false, error: "Falta destinatario (VERDE_INTERNAL_EMAIL o ?to=)" },
      { status: 500 }
    );
  }

  try {
    await sendConfirmationToCustomer({
      email:           to,
      customerName:    "Prueba Entregabilidad",
      phone:           "+34 600 000 000",
      items: [
        { productName: "Bolón Mixto de la Casa", quantity: 1, finalPrice: 11 },
        { productName: "La Chocletiza",          quantity: 1, finalPrice: 9.9 },
      ],
      reservationDate: "miércoles 17 de septiembre de 2026",
      reservationTime: "13:00",
      depositPaid:     20.9,
      pendingAmount:   0,
      deliveryMethod:  "delivery",
      deliveryAddress: "Calle de Alberto Aguilera 12",
      deliveryDetails: "2ºA",
      postalCode:      "28015",
      deliveryZone:    "Z1 · Chamberí",
      notes:           "Correo de prueba de entregabilidad.",
    });

    return NextResponse.json({ success: true, sentTo: to });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
