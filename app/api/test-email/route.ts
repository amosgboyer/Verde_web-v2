import { NextResponse } from "next/server";
import { sendConfirmationToCustomer } from "@/lib/email";

// GET /api/test-email
// Sends a CustomerReservationEmail with fake data to VERDE_INTERNAL_EMAIL.
// Only for development / staging. Remove or protect in production.
export async function GET() {
  // En producción esta ruta NO existe. Es pública y cada visita ENVÍA un correo
  // real: dejarla viva permite a cualquiera llenar el buzón interno y quemar la
  // cuota de Resend. Solo se puede usar en desarrollo.
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const to = process.env.VERDE_INTERNAL_EMAIL;

  if (!to) {
    return NextResponse.json(
      { success: false, error: "Falta VERDE_INTERNAL_EMAIL en variables de entorno" },
      { status: 500 }
    );
  }

  try {
    await sendConfirmationToCustomer({
      // Redirect to internal email so no real customer gets a test email
      email:           to,
      customerName:    "Sara Rodríguez",
      phone:           "+34 600 000 000",
      items: [
        { productName: "Bolón clásico", quantity: 2, finalPrice: 8 },
        { productName: "Combo Verde",   quantity: 1, finalPrice: 14 },
      ],
      reservationDate: "sábado 17 de mayo de 2025",
      reservationTime: "10:00",
      depositPaid:     3,
      pendingAmount:   27,
      deliveryMethod:  "delivery",
      deliveryAddress: "Calle Gran Vía 12, 3º A",
      deliveryDetails: "Timbre apellido Rodríguez",
      postalCode:      "28013",
      deliveryZone:    "Centro",
      notes:           "Sin cebolla por favor.",
    });

    return NextResponse.json({ success: true, sentTo: to });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
