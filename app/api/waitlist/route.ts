import { NextRequest, NextResponse } from "next/server";
import { appendWaitlistToSheet } from "@/lib/google-sheets";
import { sendWaitlistNotification } from "@/lib/email";
import { waitlistSchema } from "@/lib/validators";
import { WAITLIST_CLOSED } from "@/lib/launch";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    if (WAITLIST_CLOSED) {
      return NextResponse.json(
        { error: "La lista de espera está cerrada. ¡Gracias por el apoyo!" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = waitlistSchema.parse(body);

    // Guardar en la pestaña "Waitlist" de Google Sheets
    await appendWaitlistToSheet({
      createdAt: new Date().toISOString(),
      name: parsed.name,
      email: parsed.email ?? "",
      phone: parsed.phone,
      message: parsed.message ?? "",
    });

    // Notificar al equipo internamente
    await sendWaitlistNotification({
      name: parsed.name,
      email: parsed.email ?? "",
      phone: parsed.phone,
      message: parsed.message,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos.", details: error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    console.error("[waitlist]", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
